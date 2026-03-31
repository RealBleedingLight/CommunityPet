import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { commandMap } from '@/commands/index.js';
import { getOrCreateServer, getOrCreatePetState } from '@/db/queries.js';

/**
 * Handle all interaction types:
 * - Slash commands (ChatInputCommandInteraction)
 * - Button clicks (ButtonInteraction)
 * - Other interactions
 */
export const handleInteraction = async (interaction: Interaction): Promise<void> => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction);
    }
    // Handle button clicks
    else if (interaction.isButton()) {
      await handleButtonClick(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);

    // Send error response
    try {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('An error occurred while processing your request.')
        .setColor(0xff0000);

      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
};

/**
 * Handle slash commands
 */
async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const commandName = interaction.commandName;

  // Get command from registry
  const command = commandMap.get(commandName);

  if (!command) {
    await interaction.reply({
      content: `Unknown command: ${commandName}`,
      ephemeral: true,
    });
    return;
  }

  // Verify guild context (slash commands should only work in guilds)
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a guild.',
      ephemeral: true,
    });
    return;
  }

  const serverId = interaction.guild.id;
  const userId = interaction.user.id;

  try {
    // Get or create server and pet state
    await getOrCreateServer(serverId);
    await getOrCreatePetState(serverId);

    // Execute the command
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('Command Error')
      .setDescription(`An error occurred while executing the **/${commandName}** command.`)
      .setColor(0xff0000);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

/**
 * Handle button clicks
 * Button custom_id format: "cmd_<command_name>"
 * Example: "cmd_feed" → executes feed command
 */
async function handleButtonClick(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;

  // Extract command name from custom_id
  // Expected format: "cmd_<command_name>"
  const match = customId.match(/^cmd_(.+)$/);

  if (!match) {
    await interaction.reply({
      content: 'Invalid button configuration.',
      ephemeral: true,
    });
    return;
  }

  const commandName = match[1];

  // Get command from registry
  const command = commandMap.get(commandName);

  if (!command) {
    await interaction.reply({
      content: `Unknown command: ${commandName}`,
      ephemeral: true,
    });
    return;
  }

  // Verify guild context
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This button can only be used in a guild.',
      ephemeral: true,
    });
    return;
  }

  const serverId = interaction.guild.id;
  const userId = interaction.user.id;

  try {
    // Get or create server and pet state
    await getOrCreateServer(serverId);
    await getOrCreatePetState(serverId);

    // Convert button interaction to chat input command interaction
    // For simplicity, we'll create a mock interaction object
    const mockChatInputInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      commandName: commandName,
      options: {
        getSubcommand: () => null,
        getSubcommandGroup: () => null,
        getString: () => null,
        getNumber: () => null,
        getInteger: () => null,
        getBoolean: () => null,
        getUser: () => null,
        getMember: () => null,
        getChannel: () => null,
        getRole: () => null,
        getMentionable: () => null,
        getAttachment: () => null,
      },
    } as unknown as ChatInputCommandInteraction;

    // Execute the command
    await command.execute(mockChatInputInteraction);
  } catch (error) {
    console.error(`Error executing button command ${commandName}:`, error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('Button Command Error')
      .setDescription(`An error occurred while executing the **${commandName}** command.`)
      .setColor(0xff0000);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}
