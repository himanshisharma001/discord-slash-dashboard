# Discord Slash-Command Bot
## 🚀 Live Demo

[Open Live Application](https://discord-slash-dashboard-client.onrender.com/login)

A full-stack Discord slash-command bot with an admin dashboard for receiving, processing, logging, and monitoring Discord reports.

The application supports `/report` and `/status` slash commands, persistent PostgreSQL logging, optional Gemini AI analysis, configurable command behavior, and notifications to a secondary Discord channel.

## Features

- Discord `/report <text>` slash command
- Discord `/status` slash command
- Discord interaction signature verification
- Discord PING/PONG verification
- Fast interaction acknowledgement using deferred responses
- Duplicate interaction protection
- PostgreSQL database for persistent logs and configuration
- Admin authentication with password hashing
- Protected React dashboard
- Command configuration from the Settings page
- Optional Gemini AI analysis for reports
- Automatic report summary and category
- Secondary Discord channel notifications
- Error handling for AI and notification failures
- Dashboard statistics and recent command logs
- Responsive React UI
- Environment-based secret configuration

## Application Flow

```text
Discord User
     |
     | /report or /status
     v
Discord Interaction Endpoint
     |
     | Signature Verification
     v
Express Backend
     |
     +--------------------+
     |                    |
     v                    v
PostgreSQL            Gemini AI
     |                    |
     |                    |
     +---------+----------+
               |
               v
       Discord Follow-up
               |
       +-------+-------+
       |               |
       v               v
Main Channel     Mirror Channel

Admin
  |
  v
React Dashboard
  |
  v
Express REST API
  |
  v
PostgreSQL
```

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Vite
- JavaScript

### Backend

- Node.js
- Express.js
- JavaScript / ES Modules
- JWT authentication
- bcrypt
- REST APIs

### Database

- PostgreSQL
- Neon PostgreSQL

### Integrations

- Discord API
- Discord Interactions API
- Gemini API

## Discord Commands

### `/report`

Used by Discord users to submit an issue or report.

Example:

```text
/report text: Login button is not working correctly
```

The backend:

1. Receives the Discord interaction.
2. Verifies the Discord signature.
3. Immediately acknowledges the interaction.
4. Checks command configuration.
5. Prevents duplicate processing using the interaction ID.
6. Stores the command information.
7. Optionally sends the report to Gemini.
8. Stores the AI summary and category.
9. Sends the result back to Discord.
10. Optionally sends a notification to the configured mirror channel.

### `/status`

Returns the current bot status through Discord and records the command in the dashboard logs.

## AI Report Analysis

Gemini AI is used as an optional processing feature for `/report`.

The AI analyzes the submitted report and returns:

```json
{
  "summary": "Short report summary",
  "tag": "bug"
}
```

Supported categories are:

- `bug`
- `incident`
- `question`
- `feature`
- `other`

Gemini can be enabled or disabled from the dashboard Settings page.

If Gemini is unavailable, the application records the error rather than silently losing the report.

More details are available in [`AI_NOTES.md`](./AI_NOTES.md).

## Admin Dashboard

The dashboard provides:

- Admin login
- Dashboard statistics
- Recent Discord commands
- Command status
- AI-generated summary and category
- Command configuration
- Gemini AI toggle
- Mirror notification toggle
- Command enable/disable controls

## Authentication

The dashboard is protected by authentication.

Passwords are stored using bcrypt hashing rather than plain text.

Authentication uses an HTTP-only authentication cookie containing the JWT.

Protected dashboard routes verify the authenticated user before returning dashboard information.

## Database Structure

The application uses PostgreSQL with the following main tables:

### `users`

Stores administrator accounts.

Important fields:

```text
id
email
password_hash
created_at
```

### `servers`

Stores Discord server configuration.

Important fields:

```text
user_id
discord_guild_id
discord_guild_name
primary_channel_id
mirror_channel_id
```

### `command_configs`

Stores command behavior.

Important fields:

```text
server_id
command_name
enabled
use_ai
mirror_enabled
```

### `command_logs`

Stores Discord interaction history.

Important fields:

```text
interaction_id
server_id
discord_guild_id
discord_channel_id
discord_user_id
discord_username
command_name
command_text
status
action_taken
ai_summary
ai_tag
error_message
created_at
processed_at
```

## Duplicate Protection

Each Discord interaction has a unique interaction ID.

The database contains a unique constraint on:

```text
interaction_id
```

This prevents the same `/report` interaction from being processed multiple times.

## Discord Security

The Discord interaction endpoint verifies the Ed25519 signature provided by Discord before processing the request.

The endpoint also handles Discord PING requests and returns the required PONG response.

Secrets such as the Discord bot token, Discord public key, database URL, Gemini API key, and JWT secret are stored in environment variables.

They are not included in the frontend application or source-controlled `.env` files.

## Environment Variables

Create a local `server/.env` file using the structure below:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=

DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_BOT_TOKEN=

GEMINI_API_KEY=

JWT_SECRET=

CLIENT_URL=http://localhost:5173
```

A safe template is provided at:

```text
server/.env.example
```

Do not commit `server/.env` to GitHub.

## Local Development

### Backend

Open a terminal:

```powershell
cd server
npm install
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```powershell
cd client
npm install
npm run dev
```

The frontend runs locally using Vite.

### Discord Local Development

During local development, a public HTTPS tunnel such as Cloudflare Tunnel can be used to expose the Discord interaction endpoint.

The Discord endpoint follows:

```text
/api/discord/interactions
```

For production, the endpoint should use the deployed backend URL instead of a local tunnel.

## Production Deployment

The application can be deployed as two services:

```text
React/Vite frontend
        |
        v
Static hosting

Node/Express backend
        |
        +---- Neon PostgreSQL
        +---- Discord API
        +---- Gemini API
```

Production environment variables must be configured through the hosting provider rather than committed to GitHub.

After deployment, configure Discord's Interaction Endpoint URL as:

```text
https://<backend-domain>/api/discord/interactions
```

The Discord endpoint must be publicly accessible over HTTPS.

## Security Considerations

- `.env` files are excluded from Git.
- API keys are stored as backend environment variables.
- Discord requests are signature-verified.
- Passwords are bcrypt-hashed.
- Authentication uses HTTP-only cookies.
- Discord bot credentials are never exposed to the frontend.
- Gemini API credentials remain server-side.
- Database credentials remain server-side.
- Duplicate Discord interactions are protected by a unique database constraint.

## Error Handling

The application handles failures from external services.

Examples include:

- Gemini API failure
- Gemini response parsing failure
- Discord API failure
- Mirror notification failure
- Database errors
- Authentication errors

Errors are logged and relevant failures are stored in the command log where appropriate.

## Project Structure

```text
discord-slash-dashboard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── AI_NOTES.md
└── README.md
```

## Future Improvements

Possible future enhancements include:

- Multiple Discord server support
- Role-based dashboard permissions
- Advanced analytics
- Real-time dashboard updates using WebSockets
- More configurable report rules
- Additional notification integrations
- Production observability and monitoring
- Background job processing for long-running tasks

## Author

Himanshi Sharma

Full-Stack Developer | React.js Specialist
