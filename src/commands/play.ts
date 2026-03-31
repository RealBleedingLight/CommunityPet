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

const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export const playCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play with the pet to increase happiness')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const serverId = interaction.guildId!;
      const userId = interaction.user.id;

      // Check cooldown
      const lastInteraction = await getLastInteractionTime(serverId, userId, 'play');
      if (lastInteraction) {
        const timeSinceLastInteraction = Date.now() - lastInteraction.getTime();
        if (timeSinceLastInteraction < COOLDOWN_MS) {
          const remainingMs = COOLDOWN_MS - timeSinceLastInteraction;
          const remainingSec = Math.ceil(remainingMs / 1000);
          await interaction.editReply({
            content: `Please wait ${remainingSec}s before playing with the pet again.`,
          });
          return;
        }
      }

      // Get server and pet state
      const server = await getOrCreateServer(serverId);
      const petState = await getOrCreatePetState(serverId);

      // Check if pet has enough energy
      if (petState.energy < 25) {
        await interaction.editReply({
          content: `The pet is too tired to play! (Energy: ${petState.energy}/100)`,
        });
        return;
      }

      // Calculate stat changes
      const newEnergy = Math.max(petState.energy - 25, 0);
      const newHappiness = Math.min(petState.happiness + 30, 100);
      const newMood = calculateMood({
        ...petState,
        energy: newEnergy,
        happiness: newHappiness,
      });

      // Update pet state in database
      await updatePetState(serverId, {
        energy: newEnergy,
        happiness: newHappiness,
        mood: newMood,
        lastPlayedAt: new Date(),
        lastInteractionAt: new Date(),
      });

      // Log interaction
      await logInteraction(serverId, userId, 'play');

      // Get response message
      const responseMessage = getRandomMessage('play');

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${server.petName} • ${responseMessage}`)
        .setDescription(`\`\`\`${getAsciiArt(newMood)}\`\`\``)
        .addFields(
          {
            name: 'Energy',
            value: `${petState.energy} → ${newEnergy}`,
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
      const feedButton = new ButtonBuilder()
        .setCustomId('cmd_feed')
        .setLabel('Feed')
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
        feedButton,
        petButton,
        talkButton,
        statusButton
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Error in play command:', error);
      await interaction.editReply({
        content: 'An error occurred while playing with the pet.',
      });
    }
  },
};
