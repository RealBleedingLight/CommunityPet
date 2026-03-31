import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
  type Interaction,
} from 'discord.js';
import { initializeSchema } from '@/db/schema.js';
import { commands, commandMap } from '@/commands/index.js';
import { handleInteraction } from '@/handlers/interactions.js';

// Initialize Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Initialize the bot:
 * 1. Initialize database schema
 * 2. Register slash commands via Discord REST API
 * 3. Set up event listeners
 * 4. Login with bot token
 */
export const initializeBot = async (): Promise<Client> => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!botToken) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is not set');
  }

  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID environment variable is not set');
  }

  try {
    // Step 1: Initialize database schema
    await initializeSchema();

    // Step 2: Register slash commands via REST API
    const rest = new REST({ version: '10' }).setToken(botToken);

    const commandData = commands.map((cmd) => cmd.data.toJSON());

    console.log(`Registering ${commandData.length} slash command(s)...`);

    await rest.put(Routes.applicationCommands(clientId), {
      body: commandData,
    });

    console.log('✓ Slash commands registered');

    // Step 3: Set up event listeners
    client.on('ready', () => {
      const username = client.user?.username || 'Unknown';
      console.log(`✓ Bot logged in as ${username}`);
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
      await handleInteraction(interaction);
    });

    client.on('messageCreate', async (message) => {
      // Ignore bot messages
      if (message.author.bot) {
        return;
      }

      // Handle chat commands (pet feed, etc.)
      const content = message.content.toLowerCase().trim();

      if (!message.guild) {
        return; // Ignore DMs for now
      }

      const guildId = message.guild.id;

      // Simple chat command handling for basic pet interactions
      // Commands like "pet feed", "pet play", etc.
      if (content.startsWith('pet ')) {
        const args = content.slice(4).split(/\s+/);
        const commandName = args[0];

        if (commandName && commandMap.has(commandName)) {
          // For chat commands, we need to convert them to interactions
          // For now, we'll skip this as commands are slash commands
          // In a full implementation, you'd create an interaction-like object
        }
      }
    });

    // Step 4: Login with bot token
    await client.login(botToken);

    return client;
  } catch (error) {
    console.error('Error initializing bot:', error);
    throw error;
  }
};

/**
 * Stop the bot and destroy the client connection
 */
export const stopBot = async (): Promise<void> => {
  try {
    if (client.isReady()) {
      client.destroy();
      console.log('✓ Bot connection closed');
    }
  } catch (error) {
    console.error('Error stopping bot:', error);
    throw error;
  }
};

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeBot().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await stopBot();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await stopBot();
    process.exit(0);
  });
}

export { client };
