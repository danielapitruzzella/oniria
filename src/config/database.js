// Connessione SQLite singleton con WAL mode e schema DDL.
// DEVE essere il primo require in app.js per attivare WAL prima di connect-sqlite3.

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'oniria.db');

// Crea la directory data/ se non esiste
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// --- Pragma (attivati prima di qualsiasi operazione per configurazione comportamento SQLite) ---
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// --- Schema DDL (idempotente) ---
db.exec(`
  -- ============================================================
  -- UTENTI
  -- ============================================================
  CREATE TABLE IF NOT EXISTS utenti (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    nome        TEXT    NOT NULL,
    bio         TEXT    NOT NULL DEFAULT '',
    password    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_utenti_username ON utenti(username);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_utenti_email    ON utenti(email);

  -- ============================================================
  -- SOGNI
  -- ============================================================
  CREATE TABLE IF NOT EXISTS sogni (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id   INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    titolo      TEXT    NOT NULL,
    descrizione TEXT    NOT NULL,
    data_sogno  TEXT    NOT NULL,
    intensita   INTEGER NOT NULL CHECK (intensita BETWEEN 1 AND 5),
    pubblico    INTEGER NOT NULL DEFAULT 0 CHECK (pubblico IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sogni_utente   ON sogni(utente_id);
  CREATE INDEX IF NOT EXISTS idx_sogni_data     ON sogni(utente_id, data_sogno);
  CREATE INDEX IF NOT EXISTS idx_sogni_pubblico ON sogni(pubblico) WHERE pubblico = 1;

  -- ============================================================
  -- TAG (catalogo simboli/parole chiave)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS tag (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  TEXT    NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_nome ON tag(nome);

  -- ============================================================
  -- EMOZIONI (catalogo emozioni)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS emozioni (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  TEXT    NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_emozioni_nome ON emozioni(nome);

  -- ============================================================
  -- SOGNI_TAG (relazione N:M sogni <-> tag)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS sogni_tag (
    sogno_id  INTEGER NOT NULL REFERENCES sogni(id) ON DELETE CASCADE,
    tag_id    INTEGER NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
    PRIMARY KEY (sogno_id, tag_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sogni_tag_sogno ON sogni_tag(sogno_id);
  CREATE INDEX IF NOT EXISTS idx_sogni_tag_tag   ON sogni_tag(tag_id);

  -- ============================================================
  -- SOGNI_EMOZIONI (relazione N:M sogni <-> emozioni)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS sogni_emozioni (
    sogno_id    INTEGER NOT NULL REFERENCES sogni(id)    ON DELETE CASCADE,
    emozione_id INTEGER NOT NULL REFERENCES emozioni(id) ON DELETE CASCADE,
    PRIMARY KEY (sogno_id, emozione_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sogni_emozioni_sogno    ON sogni_emozioni(sogno_id);
  CREATE INDEX IF NOT EXISTS idx_sogni_emozioni_emozione ON sogni_emozioni(emozione_id);

  -- ============================================================
  -- SOGNI_CORRELATI (collegamento tra sogni simili, bidirezionale)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS sogni_correlati (
    sogno_id     INTEGER NOT NULL REFERENCES sogni(id) ON DELETE CASCADE,
    correlato_id INTEGER NOT NULL REFERENCES sogni(id) ON DELETE CASCADE,
    created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (sogno_id, correlato_id),
    CHECK (sogno_id < correlato_id)
  );
`);

module.exports = db;
