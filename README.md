# Community Pet Discord Bot

A Discord bot that simulates a virtual pet for your server. Feed it, play with it, and watch it develop personality!

## Features

- 🐾 **Interactive Pet** - Feed, play, talk to, and pet your server's pet
- 🎭 **Dynamic Moods** - Pet's mood changes based on stats and random events
- ✨ **Persistent State** - Pet's stats survive bot restarts
- 🎮 **Button UI** - Easy-to-use ephemeral button interface
- 🌀 **Background Activity** - Pet wanders channels and posts random messages
- 👑 **Customizable** - Mods can rename the pet to their liking

## Commands

- `/feed` - Feed the pet
- `/play` - Play with the pet
- `/talk` - Talk to the pet
- `/pet` - Pet the animal
- `/status` - Check pet's current stats
- `/rename <name>` - Rename the pet (mods only)

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- A Discord bot token
- Neon Postgres database

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd dbots
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` with your credentials
```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_PUBLIC_KEY=your_public_key_here
DATABASE_URL=your_postgres_connection_string
CRON_SECRET=your_secret_for_cron_jobs
NODE_ENV=production
```

4. Build and start
```bash
npm run build
npm run dev
```

## Deployment

See [SETUP.md](docs/SETUP.md) for detailed step-by-step deployment instructions to Vercel.

## Tech Stack

- **Runtime**: Node.js 20.x
- **Language**: TypeScript
- **Discord Integration**: discord.js, discord-interactions
- **Database**: Neon Postgres (pg driver)
- **Hosting**: Vercel Serverless Functions
- **Testing**: Vitest
- **Utilities**: Zod for validation, dotenv for environment variables

## Project Structure

```
src/
├── api/              # Vercel API routes
│   ├── webhook.ts    # Discord webhook handler
│   └── cron/         # Scheduled tasks
├── bot/              # Discord bot initialization
├── db/               # Database client and queries
├── commands/         # Slash command handlers
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and messages
```

## Development

### Local Development
```bash
npm run dev
```
Watches for changes and automatically rebuilds.

### Testing
```bash
npm run test         # Run all tests
npm run test:ui      # Run tests with UI
```

### Build
```bash
npm run build
npm run start
```

## Features in Detail

### Pet State Management
The bot tracks pet stats over time:
- **Hunger**: Increases over time, decreased by feeding
- **Happiness**: Affected by playtime and interactions
- **Energy**: Consumed by activities, recovered during idle time
- **Hygiene**: Decreases over time, improved by petting

### Dynamic Moods
Pet moods change based on current stats and create different interaction messages:
- Happy, Sad, Sleepy, Hungry, Playful, Annoyed

### Background Activity
Every 5 minutes, the bot's cron job runs to:
- Update pet stats
- Trigger random events
- Post periodic messages to keep the pet "alive"
- Change the bot's status

### Slash Commands
All commands use Discord's slash command interface for easy access:
- Interactive buttons for quick responses
- Ephemeral messages for private feedback
- Real-time stat updates

## Environment Variables

All required environment variables are listed in `.env.example`:

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Bot's client ID |
| `DISCORD_PUBLIC_KEY` | Public key for verifying Discord requests |
| `DATABASE_URL` | Postgres connection string (Neon) |
| `CRON_SECRET` | Secret token for cron endpoint authentication |
| `NODE_ENV` | Set to `production` for deployment |

## License

ISC

## Support

For issues and questions:
1. Check the [troubleshooting section in SETUP.md](docs/SETUP.md#troubleshooting)
2. Review your environment variables
3. Check bot logs in Vercel dashboard
4. Ensure database connection is active

## Contributing

This project was built with the Community Pet framework. Feel free to extend with additional commands, pet types, or stats tracking!
