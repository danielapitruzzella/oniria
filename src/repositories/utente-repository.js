// Data access per la tabella utenti: CRUD e ricerca per username/email.

const db = require('../config/database');

// --- Prepared statements ---
const stmtFindById       = db.prepare('SELECT * FROM utenti WHERE id = ?');
const stmtFindByUsername = db.prepare('SELECT * FROM utenti WHERE username = ?');
const stmtFindByEmail    = db.prepare('SELECT * FROM utenti WHERE email = ?');
const stmtCreate         = db.prepare(`
  INSERT INTO utenti (username, email, nome, bio, password)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtUpdate         = db.prepare(`
  UPDATE utenti
  SET nome = ?, email = ?, bio = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = ?
`);
const stmtUpdatePassword = db.prepare(`
  UPDATE utenti
  SET password = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = ?
`);

class UtenteRepository {

  findById(id) {
    return stmtFindById.get(id);
  }

  findByUsername(username) {
    return stmtFindByUsername.get(username);
  }

  findByEmail(email) {
    return stmtFindByEmail.get(email);
  }

  create(data) {
    const info = stmtCreate.run(data.username, data.email, data.nome, data.bio || '', data.password);
    return info.lastInsertRowid;
  }

  update(id, data) {
    stmtUpdate.run(data.nome, data.email, data.bio || '', id);
  }

  updatePassword(id, passwordHash) {
    stmtUpdatePassword.run(passwordHash, id);
  }
}

module.exports = new UtenteRepository();
