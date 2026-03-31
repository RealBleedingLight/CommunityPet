# Community Pet Discord Bot — Design Specification

**Date**: 2026-03-31
**Status**: Approved for Implementation
**Scope**: MVP Launch Phase

---

## 1. Overview

**Community Pet** is a Discord bot that simulates a virtual pet living in a server. The pet has dynamic moods, stats, and personality. Users interact through slash commands and buttons; the pet occasionally posts randomly in channels. The bot creates sustained engagement through responsive care mechanics and unpredictable personality.

**Success Criteria**:
- Launches on 1-2 test servers within 2 weeks
- Users return daily to feed/play/interact
- Pet feels alive and responsive (instant interactions, natural background behavior)
- Scales to thousands of servers as interest grows

---

## 2. System Architecture

### Tech Stack
- **Discord Bot**: discord.js (Node.js)
- **Hosting**: Vercel Serverless Functions + Cron
- **Database**: Neon Postgres (via Vercel Marketplace)
- **Message Generation**: Pre-written templates (MVP), AI SDK for context-aware messages (future)
- **HTTP Client**: `node-fetch` or `undici` (NOT axios — security vulnerability)

### Request Flow

#### Interactive Path (Instant)
```
User: /feed, /play, /talk, /pet, /status, @mention
    ↓
Discord Webhook → Vercel Function
    ↓
Query pet state from Postgres
    ↓
Update state (apply interaction effect)
    ↓
Generate response with button UI
    ↓
Send ephemeral message (visible only to user)
    ↓
Complete in <500ms
```

#### Passive Path (Background Tick)
```
Vercel Cron Job triggers every 5-10 minutes
    ↓
Apply stat decay (hunger +~5%, energy +~2%, happiness -~1%)
    ↓
Roll for random events (5-15% chance per tick)
    ↓
Generate posts for primary channel or wandering channels
    ↓
Update Postgres with new pet state
    ↓
Post messages to Discord
```

### Separation of Concerns
- **Instant interactions** (user-triggered) respond immediately
- **Background ticks** (passive decay, random events) happen independently on a schedule
- Both write to the same database, no conflicts

---

## 3. Pet State & Mechanics

### Core Stats
| Stat | Range | Meaning | Decay Rate |
|------|-------|---------|-----------|
| `hunger` | 0-100 | Fullness level. 0 = starving, 100 = very full | +5% per tick |
| `happiness` | 0-100 | Emotional state. Affected by interactions | -1% per tick (no interaction) |
| `energy` | 0-100 | Stamina. Depleted by play, restored by rest | +2-3% per tick |

### Mood System (Derived)
Pet's mood is calculated from stats:
- `hunger > 70`: "Starving" → won't play, demands food
- `happiness < 30`: "Sad" → posts melancholy messages, needs interaction
- `energy < 20`: "Exhausted" → sleepy, slow responses
- `energy > 80`: "Playful" → energetic, seeks interaction
- `hunger 30-70, happiness > 50, energy 30-70`: "Content" → happy idle state

Mood affects:
- ASCII art representation (different moods show visually)
- Message tone and behavior
- Whether pet will engage with interactions

### Stat Mechanics

**Feeding** (`/feed` command):
- Reduce `hunger` by 30 (cap at 0)
- Increase `happiness` by 15 (overfed pets get extra happy)
- Cooldown: 2 minutes per user
- Response: "Pet munch munch! 🍖" + buttons for next action

**Playing** (`/play` command):
- Reduce `energy` by 25 (cap at 0)
- Increase `happiness` by 30
- Cooldown: 3 minutes per user
- Response: "Pet zooms around! 🏃" + ASCII art

**Talking** (`/talk` command):
- Increase `happiness` by 10
- Generate contextual response (pre-written template)
- Cooldown: 1 minute
- Response: "Pet listens intently" + cute message

**Petting** (`/pet` command):
- Increase `happiness` by 5
- Cooldown: 30 seconds
- Response: "Pet purrs happily 😻"

**Status** (`/status` command):
- Display current stats as progress bars
- Show mood and last interaction time
- No cooldown, no state change

### Random Events
Every 5-10 minute tick, roll random events (independent of stat thresholds):
- 5-15% chance of a random event occurring
- Event types: "pet gets grumpy", "pet finds a pebble", "pet naps", "pet wants attention"
- Events generate visual posts or mood shifts
- Create surprise and life-like behavior

### Naming & Identity
- Mod command: `/rename <petname>`
- Pet name stored in database per server
- Default name: "Pet" (until mod renames)
- Pet name appears in all responses and messages
- Users tag pet by name: `@Whiskers`, `@Sprout`, etc.

---

## 4. Interaction Model & User Experience

### Slash Commands (Primary Interface)
All slash commands return **ephemeral messages** (visible only to the user) with button UIs for chaining actions.

**Command List:**
- `/feed` — Feed the pet (reduce hunger, boost happiness)
- `/play` — Play with pet (consume energy, high happiness boost)
- `/talk` — Talk to pet (small happiness boost, contextual response)
- `/pet` — Pet the animal (small happiness boost)
- `/status` — Check pet's current stats and mood

**Buttons on Responses:**
After any command, ephemeral message includes buttons:
```
[Feed] [Play] [Pet] [Talk] [Status]
```
User can chain interactions without typing new commands.

### Chat Commands (Alternative)
Users can also type in plain English:
```
pet feed
pet play
pet talk
```
Same behavior as slash commands, returns ephemeral response.

### Mention Interactions (`@petname`)
- User mentions the pet anywhere: `@Whiskers, how are you?`
- Bot posts a contextual response
- Counts as "attention" interaction (boosts happiness)
- Response may be ephemeral (if no permission to post in channel) or visible (if allowed)

### Mod Commands
- `/rename <name>` — Rename the pet (mod-only)
- Pet name stored and used in all future references
- Enables server customization and attachment

---

## 5. Random Behavior & Messaging

### Message Generation Strategy (Hybrid)

**MVP Phase (Launch):**
- Pre-written library of ~50-100 messages
- Organized by mood/context
- Examples:
  - Happy: "Pet does a little spin! 🌀", "Pet nuzzles you 🥰"
  - Hungry: "Pet whimpers softly...", "Pet stares longingly at food"
  - Tired: "Pet yawns widely 😴", "Pet curls up for a nap 😪"
  - Random: "Pet found a shiny pebble!", "Pet heard a mysterious sound 👀"

**Post-Launch (Week 2+):**
- Integrate AI SDK (`@ai-sdk/react` + Anthropic Claude)
- Generate context-aware messages based on channel activity
- Example: If channel is celebrating, pet joins in: "Pet celebrates with the team! 🎉"
- Requires OIDC setup via Vercel AI Gateway (automatic after `vercel env pull`)

### Random Posts (Wandering)
- Pet main residence: one dedicated channel per server
- Every 5-10 minute tick:
  - If pet is in good mood (happiness > 50)
  - Check for activity in other channels
  - 20% chance to post a random message in an active channel
  - Only posts if bot has permission to message in that channel
  - Messages are non-ephemeral (visible to all, for surprise/delight factor)

---

## 6. Data Model

### Database Schema (Neon Postgres)

**Table: `servers`**
```sql
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id BIGINT UNIQUE NOT NULL,
  pet_name VARCHAR(50) DEFAULT 'Pet',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `pet_states`**
```sql
CREATE TABLE pet_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id BIGINT UNIQUE NOT NULL REFERENCES servers(server_id),
  hunger INT DEFAULT 50,
  happiness INT DEFAULT 70,
  energy INT DEFAULT 80,
  mood VARCHAR(20) DEFAULT 'content',
  last_interaction_at TIMESTAMP DEFAULT NOW(),
  last_fed_at TIMESTAMP,
  last_played_at TIMESTAMP,
  last_talked_at TIMESTAMP,
  last_petted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `interaction_logs`** (optional, for analytics)
```sql
CREATE TABLE interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id BIGINT NOT NULL REFERENCES servers(server_id),
  user_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'feed', 'play', 'talk', 'pet'
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_pet_states_server ON pet_states(server_id);
CREATE INDEX idx_interaction_logs_server ON interaction_logs(server_id);
CREATE INDEX idx_interaction_logs_user ON interaction_logs(user_id);
```

---

## 7. Cron Jobs & Scheduled Tasks

### Background Tick Job
**Schedule**: Every 5 minutes
**Timeout**: 30 seconds
**Action**:
1. Query all active servers from `pet_states`
2. Apply stat decay to each pet
3. Roll for random events (5-15% per pet)
4. For pets in good mood, check for wandering posts
5. Update database with new state
6. Post messages to Discord as needed

**Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/tick",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Verification
- Cron endpoint requires `CRON_SECRET` header for security
- Vercel automatically injects this; verify in logs

---

## 8. Deployment Architecture

### Environment Variables
Required (auto-provisioned by Vercel Marketplace):
- `DISCORD_BOT_TOKEN` — Bot token from Discord Developer Portal
- `DATABASE_URL` — Neon Postgres connection string

Optional (for future AI features):
- `VERCEL_OIDC_TOKEN` — Auto-provisioned by `vercel env pull` after linking AI Gateway

### Vercel Setup
1. Link GitHub repo to Vercel project
2. Add Neon Postgres integration via Marketplace
3. Deploy (automatic on git push)
4. Cron jobs run automatically

### Discord Setup
1. Create bot in Discord Developer Portal
2. Copy bot token → Vercel env var `DISCORD_BOT_TOKEN`
3. Enable "Message Content Intent" in Discord Developer Portal
4. Share invite link with testers

---

## 9. MVP Scope & Launch Checklist

### Included ✅
- Core pet with hunger/happiness/energy stats
- Slash commands + button UIs + chat commands
- Ephemeral responses to keep chat clean
- Random posts in primary channel
- Wandering posts to active channels (with permission checks)
- Pre-written message library (50-100 messages)
- Mod `/rename` command
- Persistent Postgres state
- 5-minute update cycle
- Ready to scale (Vercel auto-scales)

### Excluded (Post-Launch) 🔜
- AI-generated context-aware messages
- Accessories/cosmetics system
- Payment model
- Mini-games
- Community events
- Sprite graphics (ASCII art first)
- Leaderboards/analytics
- Pet death/lifecycle

### Launch Checklist
- [ ] Discord bot created and token secured
- [ ] Vercel project linked to GitHub repo
- [ ] Neon Postgres provisioned and connected
- [ ] All slash commands implemented and tested
- [ ] Cron job running and applying decay correctly
- [ ] Random event system working
- [ ] Message templates written (50+ messages)
- [ ] Deployed to Vercel and bot is live
- [ ] Testing with 1-2 real Discord servers
- [ ] Documentation written (for yourself)

---

## 10. Future Enhancements (Post-MVP)

**Week 2-3: AI Integration**
- Add context-aware message generation via AI SDK
- Pet responds to channel activity

**Week 4: Accessories**
- Cosmetic items earned through gameplay
- Mod command to equip/list accessories
- ASCII art variations based on equipped items

**Month 2: Mini-Games**
- Simple games that boost stats or earn cosmetics
- `/minigame play` or `/game rock-paper-scissors`

**Month 3: Events**
- Server-wide events promoting interaction
- Seasonal themes
- Leaderboards for most interactive users

---

## 11. Success Metrics

**MVP Success:**
- Bot stays online and responsive (zero downtime)
- Users return daily to feed/play/interact
- Pet feels alive (random events, natural decay)
- No major bugs or data loss
- Positive feedback on personality/charm

**Growth Targets:**
- Week 1: 2 test servers
- Week 2: 5-10 servers
- Month 1: 50+ servers
- Month 3: 500+ servers (with word-of-mouth)

---

## 12. Technical Notes & Constraints

### Why Vercel?
- Auto-scaling handles growth without infra management
- Cron jobs built-in (no extra service)
- Marketplace integrations (Neon, auth, etc.)
- Environment variable management
- GitHub integration for CI/CD

### Why discord.js?
- Most mature Node.js Discord library
- Rich API for buttons, ephemeral messages, modals
- Active community
- Easy to deploy on Vercel

### Why NOT axios?
- Known security vulnerabilities
- Use `node-fetch` (builtin in Node 18+) or `undici` instead

### Database Choice: Neon Postgres
- Serverless, scales with usage
- Vercel Marketplace integration
- Free tier suitable for MVP
- Upgradeable without refactoring

### Scaling Considerations
- Database: Neon handles concurrent connections
- Functions: Vercel auto-scales
- Cron: One job per 5 min handles thousands of servers
- Rate limits: Discord API limits checked per endpoint

---

## 13. Open Questions / Decisions Made

**Decision: Ephemeral messages for interactions**
- Rationale: Keeps chat clean, improves UX
- Trade-off: Can't create a record of past interactions (but that's fine for MVP)

**Decision: 5-minute tick cycle**
- Rationale: Balanced between "pet feels alive" and "not too much server load"
- Trade-off: Short interactions may queue for next tick (acceptable)

**Decision: Pre-written messages, not AI from day 1**
- Rationale: Faster launch, lower cost, guaranteed charm
- Trade-off: Messages may repeat (mitigated by rotating 50+ templates)

**Decision: One pet per server**
- Rationale: Simpler, builds server identity
- Trade-off: Can't customize per player (acceptable, adds community element)

---

**END OF SPECIFICATION**

Approved by: User
Next Step: Write implementation plan and begin development
