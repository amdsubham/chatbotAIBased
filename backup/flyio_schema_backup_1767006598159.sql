-- Database Schema Export
-- Date: 2025-12-29T11:09:53.365Z
-- Database: chatbot_auspost_ai_support


-- Table: availability_slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id integer NOT NULL DEFAULT nextval('availability_slots_id_seq'::regclass),
  day_of_week integer NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  timezone text DEFAULT 'UTC'::text,
  enabled boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: chats
CREATE TABLE IF NOT EXISTS chats (
  id integer NOT NULL DEFAULT nextval('chats_id_seq'::regclass),
  merchant_email text NOT NULL,
  shop_name text,
  shop_domain text,
  status text DEFAULT 'active'::text,
  error_context text,
  ai_auto_response_enabled boolean,
  email_notification_sent boolean DEFAULT false,
  last_user_message_at timestamp without time zone,
  widget_open boolean DEFAULT false,
  widget_last_seen_at timestamp without time zone,
  rating integer,
  rated_at timestamp without time zone,
  feedback_text text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: knowledge_base
CREATE TABLE IF NOT EXISTS knowledge_base (
  id integer NOT NULL DEFAULT nextval('knowledge_base_id_seq'::regclass),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id integer NOT NULL DEFAULT nextval('login_attempts_id_seq'::regclass),
  email text NOT NULL,
  success boolean DEFAULT false,
  attempted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  chat_id integer NOT NULL,
  content text NOT NULL,
  sender text NOT NULL,
  image_url text,
  viewed_at timestamp without time zone,
  email_notification_sent_for_message boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id text NOT NULL,
  user_id integer NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  last_accessed timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
  id integer NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
  auto_ai_response_enabled boolean DEFAULT true,
  ai_agent_name text,
  admin_agent_name text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: shortcut_messages
CREATE TABLE IF NOT EXISTS shortcut_messages (
  id integer NOT NULL DEFAULT nextval('shortcut_messages_id_seq'::regclass),
  name text NOT NULL,
  message text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: typing_status
CREATE TABLE IF NOT EXISTS typing_status (
  id integer NOT NULL DEFAULT nextval('typing_status_id_seq'::regclass),
  chat_id integer NOT NULL,
  typer_type text NOT NULL,
  last_typing_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_passwords
CREATE TABLE IF NOT EXISTS user_passwords (
  user_id integer NOT NULL,
  password_hash text NOT NULL
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email text NOT NULL,
  display_name text NOT NULL,
  role text DEFAULT 'user'::text,
  avatar_url text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
