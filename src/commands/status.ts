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
} from '@/db/queries.js';
import { getAsciiArt } from '@/utils/ascii-art.js';
import { formatStatus } from '@/utils/messages.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the pet\'s current status')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const serverId = interaction.guildId!;

      // Get server and pet state
      const server = await getOrCreateServer(serverId);
      const petState = await getOrCreatePetState(serverId);

      // Create the status text with progress bars
      const statusText = formatStatus(
        server.petName,
        petState.hunger,
        petState.happiness,
        petState.energy,
        petState.mood
      );

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${server.petName} • Status Check`)
        .setDescription(`\`\`\`${getAsciiArt(petState.mood)}\`\`\`\n\n${statusText}`)
        .setColor(0x9370db);

      // Create buttons
      const feedButton = new ButtonBuilder()
        .setCustomId('cmd_feed')
        .setLabel('Feed')
        .setStyle(ButtonStyle.Primary);

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

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        feedButton,
        playButton,
        petButton,
        talkButton
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Error in status command:', error);
      await interaction.editReply({
        content: 'An error occurred while checking the pet\'s status.',
      });
    }
  },
};
