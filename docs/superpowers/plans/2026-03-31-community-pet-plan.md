# Community Pet Discord Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Discord bot that simulates a virtual pet with dynamic stats, mood, and personality. Ship MVP with slash commands, button UIs, persistent database state, and background cron jobs.

**Architecture:** Discord.js bot hosted on Vercel Serverless Functions. Instant interactions via webhook endpoints, background stat decay via 5-minute cron job. All state persists in Neon Postgres. No external AI at launch (pre-written messages only).

**Tech Stack:** Node.js 18+, discord.js, Vercel Serverless, Neon Postgres, TypeScript, vitest (testing)

---

## File Structure

```
/src
  /types
    index.ts                    # TypeScript types (Pet, Server, Interaction, etc.)
  /db
    client.ts                   # Neon Postgres connection pool
    schema.ts                   # SQL schema creation/migrations
    queries.ts                  # SQL query helpers (getServer, getPetState, etc.)
  /bot
    index.ts                    # Main Discord.js bot setup
  /commands
    feed.ts                     # /feed command handler
    play.ts                     # /play command handler
    talk.ts                     # /talk command handler
    pet.ts                      # /pet command handler
    status.ts                   # /status command handler
    rename.ts                   # /rename command handler (mod-only)
    index.ts                    # Command registry
  /handlers
    interactions.ts             # Button clicks, command interactions
    messages.ts                 # Message content detection (for chat commands)
  /utils
    pet-state.ts                # Mood calculation, stat decay logic
    messages.ts                 # Message templates (pre-written library)
    ascii-art.ts                # ASCII pet art by mood
    permissions.ts              # Check user/mod permissions
  /api
    webhook.ts                  # POST /api/webhook (Discord interactions)
    /cron
      tick.ts                   # GET /api/cron/tick (5-min background job)

/docs
  /superpowers
    /plans
      2026-03-31-community-pet-plan.md  # This plan

package.json
vercel.json                     # Cron job config
.env.example                    # Environment variables template
tsconfig.json
vitest.config.ts
```

---

## Task List

- [ ] **Task 1:** Project Setup & Dependencies
- [ ] **Task 2:** TypeScript Type Definitions
- [ ] **Task 3:** Database Connection & Schema
- [ ] **Task 4:** Database Query Helpers
- [ ] **Task 5:** Pet State Logic (Mood Calculation, Stat Decay)
- [ ] **Task 6:** Message Templates Library
- [ ] **Task 7:** Command Handlers (Feed, Play, Talk, Pet, Status, Rename)
- [ ] **Task 8:** Bot Initialization & Event Handlers
- [ ] **Task 9:** Vercel API Routes (Webhook Endpoint)
- [ ] **Task 10:** Cron Job - Background Tick
- [ ] **Task 11:** Tests & Verification
- [ ] **Task 12:** Build & Local Testing
- [ ] **Task 13:** Prepare for Vercel Deployment
- [ ] **Task 14:** Documentation & README

---

## Detailed Tasks

### Task 1: Project Setup & Dependencies

**Objective:** Initialize Node.js project with all dependencies, build config, and environment setup.

**Files to create/modify:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vercel.json`
- Create: `.env.example`
- Create: `vitest.config.ts`

**Success criteria:**
- `npm install` succeeds
- `npx tsc --noEmit` compiles with no errors
- Project is ready for TypeScript development

**Key dependencies:** discord.js, pg, dotenv, zod, typescript, vitest

---

### Task 2: TypeScript Type Definitions

**Objective:** Define all TypeScript interfaces for the application.

**Files to create:**
- Create: `src/types/index.ts`

**Types needed:**
- `Server` - Discord server metadata
- `PetState` - Pet stats and mood
- `InteractionType` - Union of feed|play|talk|pet
- `InteractionLog` - User interaction record
- `CommandContext` - Interaction context
- `PetResponse` - Command response format

**Success criteria:**
- All types compile without errors
- Types match database schema expectations
- Command handlers can import and use types

---

### Task 3: Database Connection & Schema

**Objective:** Set up Postgres connection pool and initialize schema.

**Files to create:**
- Create: `src/db/client.ts` - Connection pool
- Create: `src/db/schema.ts` - Schema initialization

**Success criteria:**
- `query()` and `queryOne()` functions work
- `initializeSchema()` creates all tables without errors
- Connection uses environment variable `DATABASE_URL`

**Tables:**
- `servers` - Server metadata (id, server_id, pet_name, timestamps)
- `pet_states` - Pet stats (id, server_id, hunger, happiness, energy, mood, timestamps)
- `interaction_logs` - User interactions (id, server_id, user_id, action, timestamp)

---

### Task 4: Database Query Helpers

**Objective:** Write reusable SQL query functions.

**Files to create:**
- Create: `src/db/queries.ts`

**Functions needed:**
- `getOrCreateServer(serverId)` - Get or create server record
- `getPetName(serverId)` - Get pet's current name
- `updatePetName(serverId, newName)` - Rename pet
- `getOrCreatePetState(serverId)` - Get or create pet state
- `updatePetState(serverId, updates)` - Update pet stats
- `logInteraction(serverId, userId, action)` - Log user interaction
- `getLastInteractionTime(serverId, userId, action)` - Get cooldown timestamp
- `getAllServers()` - Get all servers (for cron jobs)
- `getAllPetStates()` - Get all pet states (for cron jobs)

**Success criteria:**
- All queries execute without errors
- getOrCreate functions create records if missing
- updatePetState handles partial updates
- Type-safe return values

---

### Task 5: Pet State Logic (Mood Calculation, Stat Decay)

**Objective:** Implement game mechanics for pet stats and moods.

**Files to create:**
- Create: `src/utils/pet-state.ts` - State logic
- Create: `src/utils/ascii-art.ts` - ASCII art generator

**Functions in pet-state.ts:**
- `calculateMood(state): PetState['mood']` - Derive mood from stats
- `applyStatDecay(state)` - Apply time-based stat changes
- `getRandomEvent()` - Generate random events (5-15% chance)
- `shouldWanderToChannel(state)` - Check if pet should post elsewhere

**Functions in ascii-art.ts:**
- `getAsciiArt(mood)` - Return ASCII art string for mood

**Mood rules:**
- hunger > 70 → "starving"
- happiness < 30 → "sad"
- energy < 20 → "exhausted"
- energy > 80 && happiness > 60 → "playful"
- else → "content"

**Decay rates per tick (5-10 min):**
- hunger: +5%
- happiness: -1%
- energy: +3%

**Success criteria:**
- Mood calculated correctly from all stat combinations
- Stat decay follows spec (caps at 0-100)
- Random events have proper probabilities
- ASCII art exists for all moods

---

### Task 6: Message Templates Library

**Objective:** Create pre-written message library for pet responses.

**Files to create:**
- Create: `src/utils/messages.ts`

**Message categories needed:**
- `feed` - 5+ messages for feeding
- `play` - 5+ messages for playing
- `talk` - 5+ messages for talking
- `pet` - 5+ messages for petting
- `random_happy` - 5+ for happy random events
- `random_sad` - 5+ for sad random events
- `random_tired` - 5+ for tired random events

**Functions:**
- `getRandomMessage(key)` - Get random message from category
- `formatStatus(petName, hunger, happiness, energy, mood)` - Format status display

**Success criteria:**
- Each category has at least 5 messages
- `getRandomMessage()` returns random element
- `formatStatus()` returns readable bar chart
- Messages are charming and personality-driven

---

### Task 7: Command Handlers (Feed, Play, Talk, Pet, Status, Rename)

**Objective:** Implement all slash command handlers.

**Files to create:**
- Create: `src/commands/feed.ts`
- Create: `src/commands/play.ts`
- Create: `src/commands/talk.ts`
- Create: `src/commands/pet.ts`
- Create: `src/commands/status.ts`
- Create: `src/commands/rename.ts`
- Create: `src/commands/index.ts` - Command registry

**Each command needs:**
- SlashCommandBuilder definition
- Cooldown check
- Stat calculation
- Database update
- Ephemeral response with buttons
- Error handling

**Cooldowns:**
- feed: 2 minutes
- play: 3 minutes
- talk: 1 minute
- pet: 30 seconds
- status: no cooldown
- rename: no cooldown (mods only)

**Button UIs:**
All interactive commands return 4 buttons: [Feed] [Play] [Pet] [Talk] [Status]

**Success criteria:**
- All 6 commands work without errors
- Cooldowns enforced per user
- Responses are ephemeral
- Stats updated correctly
- Buttons trigger proper command execution
- Rename is mod-only

---

### Task 8: Bot Initialization & Event Handlers

**Objective:** Set up Discord.js bot and event routing.

**Files to create:**
- Create: `src/bot/index.ts` - Bot initialization
- Create: `src/handlers/interactions.ts` - Event router

**Bot setup:**
- Load environment variables
- Initialize database schema
- Register slash commands
- Set up event listeners
- Login to Discord

**Event handlers:**
- `interactionCreate` - Route slash commands and buttons
- `messageCreate` - Handle chat commands (pet feed, etc.)
- `ready` - Log successful login

**Success criteria:**
- Bot logs in successfully
- Slash commands appear in Discord
- Interactions are routed correctly
- No console errors on startup

---

### Task 9: Vercel API Routes (Webhook Endpoint)

**Objective:** Create Vercel function for Discord webhook verification.

**Files to create:**
- Create: `src/api/webhook.ts` (as Vercel Function at /api/webhook)

**Functionality:**
- Verify Discord signature (ED25519)
- Handle PING interactions
- Defer other interactions
- Return proper response format

**Success criteria:**
- Webhook endpoint responds to Discord PING
- Signature verification prevents unauthorized requests
- Proper Discord interaction response types

---

### Task 10: Cron Job - Background Tick

**Objective:** Implement 5-minute background job for stat decay and random events.

**Files to create:**
- Create: `src/api/cron/tick.ts` (as Vercel Cron Function)

**Functionality:**
- Verify CRON_SECRET header
- Query all pet states
- Apply stat decay to each
- Roll random events
- Update database
- Log updates

**Success criteria:**
- Cron job runs every 5 minutes
- All pets receive stat decay
- Random events trigger correctly
- No errors in logs
- Database updates persist

---

### Task 11: Tests & Verification

**Objective:** Write tests for pet mechanics and database operations.

**Files to create:**
- Create: `src/__tests__/integration.test.ts` - Integration tests

**Tests needed:**
- Server creation and retrieval
- Pet state initialization
- Pet renaming
- Stat decay application
- Mood calculation for all moods
- Stat capping (0-100)
- Interaction logging

**Success criteria:**
- All tests pass
- Coverage for core mechanics
- Integration tests verify end-to-end flow

---

### Task 12: Build & Local Testing

**Objective:** Compile TypeScript and verify everything builds.

**Actions:**
- Run `npm run build`
- Verify `dist/` folder created
- Create `.env.local` for testing
- Verify imports work

**Success criteria:**
- TypeScript compiles with zero errors
- No runtime import errors
- Project ready for deployment

---

### Task 13: Prepare for Vercel Deployment

**Objective:** Configure Vercel-specific settings.

**Files to create/modify:**
- Create: `.vercelignore` - Ignore build artifacts
- Modify: `vercel.json` - Function routes and cron config

**Configuration:**
- Set up Node.js runtime for functions
- Configure cron job schedule (*/5 * * * *)
- Ignore node_modules and dist from deployment

**Success criteria:**
- `vercel.json` is valid JSON
- Cron schedule is correct
- No syntax errors

---

### Task 14: Documentation & README

**Objective:** Write user and developer documentation.

**Files to create:**
- Create: `README.md` - Project overview
- Create: `docs/SETUP.md` - Deployment guide

**Content:**
- Features overview
- Command list
- Setup instructions
- Troubleshooting guide
- Tech stack info

**Success criteria:**
- README is clear and complete
- SETUP.md has step-by-step deployment
- All links work
- Grammar and spelling correct

---

## Success Metrics

After all tasks complete:
- ✅ Code compiles with zero TypeScript errors
- ✅ All tests pass
- ✅ No console errors on startup
- ✅ Ready to deploy to Vercel
- ✅ Discord bot responds to commands
- ✅ Database state persists
- ✅ Cron job runs without errors
