// Data access per la tabella tag: CRUD, find-or-create, associazioni sogni.

const db = require('../config/database');

// --- Prepared statements ---
const stmtFindById      = db.prepare('SELECT * FROM tag WHERE id = ?');
const stmtFindByNome    = db.prepare('SELECT * FROM tag WHERE nome = ?');
const stmtFindAll       = db.prepare('SELECT * FROM tag ORDER BY nome');
const stmtCreate        = db.prepare('INSERT INTO tag (nome) VALUES (?)');
const stmtFindBySogno   = db.prepare(`
  SELECT t.*
  FROM tag t
  JOIN sogni_tag st ON st.tag_id = t.id
  WHERE st.sogno_id = ?
  ORDER BY t.nome
`);
const stmtAssocia       = db.prepare('INSERT OR IGNORE INTO sogni_tag (sogno_id, tag_id) VALUES (?, ?)');
const stmtDeassociaTutti = db.prepare('DELETE FROM sogni_tag WHERE sogno_id = ?');

class TagRepository {

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

  associa(sognoId, tagId) {
    stmtAssocia.run(sognoId, tagId);
  }

  deassociaTutti(sognoId) {
    stmtDeassociaTutti.run(sognoId);
  }
}

module.exports = new TagRepository();
