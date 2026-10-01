CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discord_guild_id VARCHAR(50) NOT NULL,
    discord_guild_name VARCHAR(255),
    primary_channel_id VARCHAR(50),
    mirror_channel_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, discord_guild_id)
);

CREATE TABLE IF NOT EXISTS command_configs (
    id SERIAL PRIMARY KEY,
    server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    command_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    use_ai BOOLEAN DEFAULT TRUE,
    mirror_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(server_id, command_name)
);

CREATE TABLE IF NOT EXISTS command_logs (
    id SERIAL PRIMARY KEY,

    interaction_id VARCHAR(50) UNIQUE NOT NULL,

    server_id INTEGER REFERENCES servers(id) ON DELETE SET NULL,

    discord_guild_id VARCHAR(50),
    discord_channel_id VARCHAR(50),
    discord_user_id VARCHAR(50),
    discord_username VARCHAR(255),

    command_name VARCHAR(100),
    command_text TEXT,

    status VARCHAR(50) DEFAULT 'received',

    action_taken TEXT,
    ai_summary TEXT,
    ai_tag VARCHAR(100),

    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);