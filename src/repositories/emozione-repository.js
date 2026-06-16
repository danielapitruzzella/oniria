// Data access per la tabella emozioni: CRUD, find-or-create, associazioni sogni.

const db = require('../config/database');

// --- Prepared statements ---
const stmtFindById       = db.prepare('SELECT * FROM emozioni WHERE id = ?');
const stmtFindByNome     = db.prepare('SELECT * FROM emozioni WHERE nome = ?');
const stmtFindAll        = db.prepare('SELECT * FROM emozioni ORDER BY nome');
const stmtCreate         = db.prepare('INSERT INTO emozioni (nome) VALUES (?)');
const stmtFindBySogno    = db.prepare(`
  SELECT e.*
  FROM emozioni e
  JOIN sogni_emozioni se ON se.emozione_id = e.id
  WHERE se.sogno_id = ?
  ORDER BY e.nome
`);
const stmtAssocia        = db.prepare('INSERT OR IGNORE INTO sogni_emozioni (sogno_id, emozione_id) VALUES (?, ?)');
const stmtDeassociaTutti = db.prepare('DELETE FROM sogni_emozioni WHERE sogno_id = ?');

class EmozioneRepository {

  findById(id) {
    return stmtFindById.get(id);
  }

  findByNome(nome) {
    return stmtFindByNome.get(nome.toLowerCase());
  }

  findAll() {
    return stmtFindAll.all();
  }

  findBySogno(sognoId) {
    return stmtFindBySogno.all(sognoId);
  }

  create(nome) {
    const info = stmtCreate.run(nome.toLowerCase());
    return info.lastInsertRowid;
  }

  findOrCreate(nome) {
    const nomeLower = nome.toLowerCase().trim();
    const existing  = stmtFindByNome.get(nomeLower);
    if (existing) return existing.id;
    const info = stmtCreate.run(nomeLower);
    return info.lastInsertRowid;
  }

  associa(sognoId, emozioneId) {
    stmtAssocia.run(sognoId, emozioneId);
  }

  deassociaTutti(sognoId) {
    stmtDeassociaTutti.run(sognoId);
  }
}

module.exports = new EmozioneRepository();
