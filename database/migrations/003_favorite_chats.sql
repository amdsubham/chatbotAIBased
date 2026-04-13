-- Favorite chats for quick access in admin chat list
CREATE TABLE IF NOT EXISTS favorite_chats (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_chats_chat_id ON favorite_chats(chat_id);
