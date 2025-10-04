# Discord Mention Notifier & Moderation Bot

## Overview

This is a Discord bot built with discord.js v14 that provides three key features:

1. **Mention Notifications**: Automatically sends aesthetic DM notifications when users are mentioned in server channels with animated GIFs, IST timestamps, and jump links
2. **Moderation Commands**: Provides !kick, !ban, !unban, !timeout, !clear, and !help commands with permission validation
3. **Auto-Kick Protection**: Automatically removes bots added by non-owner members to prevent unauthorized bot additions

The bot uses richly formatted embeds with user profiles, India Standard Time timestamps, server context, and animated elements for a modern, aesthetic experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Architecture
The application uses a single-file event-driven architecture built on discord.js v14. The bot operates as a stateless service that responds to Discord Gateway events in real-time.

**Key Design Decisions:**
- **Event-driven model**: Listens to Discord Gateway events (`ClientReady`, `MessageCreate`, `GuildMemberAdd`, `Error`) to handle all bot functionality
- **Stateless operation**: No persistent data storage; all operations are transactional based on incoming events
- **Single-file structure**: Entire bot logic contained in `index.js` for simplicity given the focused scope

### Gateway Intents
The bot uses specific Discord Gateway intents to minimize data overhead and follow Discord's intent requirements:
- `Guilds`: Access to guild (server) information
- `GuildMessages`: Ability to receive message events in servers
- `MessageContent`: Privileged intent required to read actual message content and parse mentions
- `GuildMembers`: Monitor member joins for auto-kick protection feature
- `GuildModeration`: Access to moderation-related events and audit logs

**Rationale**: These intents enable the bot's mention detection, moderation commands, and auto-kick protection features.

### Core Functionality Flow
1. Bot receives `MessageCreate` event from Discord
2. Filters out bot messages and DM messages (only processes server messages)
3. Checks for user mentions in the message
4. For each mentioned user (excluding bots):
   - Converts message timestamp to India Standard Time (IST) using `Asia/Kolkata` timezone
   - Constructs a rich embed notification with:
     - Pink color theme (#FF69B4)
     - Mentioned user's profile avatar as thumbnail
     - Mentioner's username and avatar as author
     - Detailed fields showing: mentioned by, who was mentioned, server name, channel name, IST timestamp, message content, and jump link
     - Message ID in footer
   - Handles empty message content (attachments/embeds only) with fallback text
   - Attempts to send DM embed to the mentioned user
   - Logs success or failure (handles cases where users have DMs disabled)

### Error Handling
- **DM delivery failures**: Gracefully caught and logged when users have DMs disabled or have blocked the bot
- **Client errors**: Global error handler logs Discord client errors
- **Authentication failures**: Bot validates token presence and handles login failures with process exit

## External Dependencies

### Discord.js Library
- **Version**: ^14.22.1
- **Purpose**: Official Discord API wrapper for Node.js
- **Usage**: Provides Client, event handling, and Discord API interactions

### Environment Variables
- **DISCORD_BOT_TOKEN**: Required authentication token for the Discord bot
  - Must be configured in environment secrets
  - Bot exits with error if not present
  - Obtain from Discord Developer Portal

### Discord API
- **Gateway Connection**: Persistent WebSocket connection to Discord's Gateway API
- **REST API**: Used internally by discord.js for sending DMs and fetching user data
- **Required Bot Permissions**:
  - Read Messages/View Channels
  - Send Messages (in DMs and server channels)
  - View Audit Log (for auto-kick feature)
  - Kick Members (for !kick command and auto-kick)
  - Ban Members (for !ban and !unban commands)
  - Timeout Members (for !timeout command)
  - Manage Messages (for !clear command)
  - Message Content intent (privileged, requires approval for verified bots)

### Runtime Requirements
- **Node.js**: >=16.11.0 (enforced by discord.js dependencies)
- **Network**: Stable internet connection for Gateway WebSocket and API calls