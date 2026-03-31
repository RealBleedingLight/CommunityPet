import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import {
  getOrCreateServer,
  updatePetName,
} from '@/db/queries.js';

export const renameCommand = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename the pet (mod only)')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The new name for the pet')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(50)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const serverId = interaction.guildId!;
      const newName = interaction.options.getString('name', true);

      // Check permissions
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.editReply({
          content: 'You need the **Manage Guild** permission to rename the pet.',
        });
        return;
      }

      // Get current server
      const server = await getOrCreateServer(serverId);
      const oldName = server.petName;

      // Update pet name
      await updatePetName(serverId, newName);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Pet Renamed!')
        .setDescription(`The pet's name has been changed from **${oldName}** to **${newName}**`)
        .setColor(0x9370db);

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error('Error in rename command:', error);
      await interaction.editReply({
        content: 'An error occurred while renaming the pet.',
      });
    }
  },
};
