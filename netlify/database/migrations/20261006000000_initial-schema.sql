-- Schema inicial: users, boards (de un usuario) y pins (fotos de Unsplash guardadas en un board).
-- No modificar una migración ya aplicada: para cambios, crear una nueva con
-- `netlify database migrations new --description "..."`.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boards_owner_id_idx ON boards(owner_id);

CREATE TABLE IF NOT EXISTS pins (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  unsplash_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pins_board_id_idx ON pins(board_id);
