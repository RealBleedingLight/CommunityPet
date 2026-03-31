import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import {
  getOrCreateServer,
  getOrCreatePetState,
  updatePetState,
  logInteraction,
  getLastInteractionTime,
} from '@/db/queries.js';
import { calculateMood } from '@/utils/pet-state.js';
import { getRandomMessage } from '@/utils/messages.js';
import { getAsciiArt } from '@/utils/ascii-art.js';

const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export const feedCommand = {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('Feed the pet and reduce hunger')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const serverId = interaction.guildId!;
      const userId = interaction.user.id;

      // Check cooldown
      const lastInteraction = await getLastInteractionTime(serverId, userId, 'feed');
      if (lastInteraction) {
        const timeSinceLastInteraction = Date.now() - lastInteraction.getTime();
        if (timeSinceLastInteraction < COOLDOWN_MS) {
          const remainingMs = COOLDOWN_MS - timeSinceLastInteraction;
          const remainingSec = Math.ceil(remainingMs / 1000);
          await interaction.editReply({
            content: `Please wait ${remainingSec}s before feeding the pet again.`,
          });
          return;
        }
      }

      // Get server and pet state
      const server = await getOrCreateServer(serverId);
      const petState = await getOrCreatePetState(serverId);

      // Calculate stat changes
      const newHunger = Math.max(petState.hunger - 30, 0);
      const newHappiness = Math.min(petState.happiness + 15, 100);
      const newMood = calculateMood({
        ...petState,
        hunger: newHunger,
        happiness: newHappiness,
      });

      // Update pet state in database
      await updatePetState(serverId, {
        hunger: newHunger,
        happiness: newHappiness,
        mood: newMood,
        lastFedAt: new Date(),
        lastInteractionAt: new Date(),
      });

      // Log interaction
      await logInteraction(serverId, userId, 'feed');

      // Get response message
      const responseMessage = getRandomMessage('feed');

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${server.petName} • ${responseMessage}`)
        .setDescription(`\`\`\`${getAsciiArt(newMood)}\`\`\``)
        .addFields(
          {
            name: 'Hunger',
            value: `${petState.hunger} → ${newHunger}`,
            inline: true,
          },
          {
            name: 'Happiness',
            value: `${petState.happiness} → ${newHappiness}`,
            inline: true,
          },
          {
            name: 'Mood',
            value: `${newMood}`,
            inline: true,
          }
        )
        .setColor(0x9370db);

      // Create buttons
      const playButton = new ButtonBuilder()
        .setCustomId('cmd_play')
        .setLabel('Play')
        .setStyle(ButtonStyle.Primary);

      const petButton = new ButtonBuilder()
        .setCustomId('cmd_pet')
        .setLabel('Pet')
        .setStyle(ButtonStyle.Primary);

      const talkButton = new ButtonBuilder()
        .setCustomId('cmd_talk')
        .setLabel('Talk')
        .setStyle(ButtonStyle.Primary);

      const statusButton = new ButtonBuilder()
        .setCustomId('cmd_status')
        .setLabel('Status')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        playButton,
        petButton,
        talkButton,
        statusButton
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Error in feed command:', error);
      await interaction.editReply({
        content: 'An error occurred while feeding the pet.',
      });
    }
  },
};
