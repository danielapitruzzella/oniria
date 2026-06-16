// Data access per la tabella sogni: CRUD, ricerca con filtri dinamici, correlazioni.

const db = require('../config/database');

// --- Prepared statements (compilati una volta all'avvio) ---
const stmtFindById     = db.prepare('SELECT * FROM sogni WHERE id = ?');
const stmtFindByUtente = db.prepare('SELECT * FROM sogni WHERE utente_id = ? ORDER BY data_sogno DESC');
const stmtCreate       = db.prepare(`
  INSERT INTO sogni (utente_id, titolo, descrizione, data_sogno, intensita, pubblico)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const stmtUpdate       = db.prepare(`
  UPDATE sogni
  SET titolo = ?, descrizione = ?, data_sogno = ?, intensita = ?, pubblico = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = ?
`);
const stmtDelete       = db.prepare('DELETE FROM sogni WHERE id = ?');
const stmtFindPubblici = db.prepare(`
  SELECT id, titolo, descrizione, data_sogno, intensita, created_at
  FROM sogni
  WHERE pubblico = 1
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`);
const stmtCountPubblici = db.prepare('SELECT COUNT(*) AS totale FROM sogni WHERE pubblico = 1');
const stmtCorrelati    = db.prepare(`
  SELECT s.*
  FROM sogni s
  JOIN sogni_correlati sc ON (s.id = sc.correlato_id OR s.id = sc.sogno_id)
  WHERE (sc.sogno_id = ? OR sc.correlato_id = ?) AND s.id != ?
`);
const stmtInsertCorrelazione = db.prepare(`
  INSERT OR IGNORE INTO sogni_correlati (sogno_id, correlato_id)
  VALUES (?, ?)
`);
const stmtDeleteCorrelazione = db.prepare(`
  DELETE FROM sogni_correlati
  WHERE (sogno_id = ? AND correlato_id = ?) OR (sogno_id = ? AND correlato_id = ?)
`);
const stmtSuggerimenti = db.prepare(`
  SELECT s2.id, s2.titolo, COUNT(*) AS tag_comuni
  FROM sogni_tag st1
  JOIN sogni_tag st2 ON st2.tag_id = st1.tag_id AND st2.sogno_id != st1.sogno_id
  JOIN sogni s2 ON s2.id = st2.sogno_id
  WHERE st1.sogno_id = ?
    AND s2.utente_id = ?
    AND s2.id != ?
    AND NOT EXISTS (
      SELECT 1 FROM sogni_correlati
      WHERE (sogno_id = ? AND correlato_id = s2.id)
         OR (sogno_id = s2.id AND correlato_id = ?)
    )
  GROUP BY s2.id
  HAVING tag_comuni >= 2
  ORDER BY tag_comuni DESC
  LIMIT 5
`);

class SognoRepository {

  findById(id) {
    return stmtFindById.get(id);
  }

  findByUtente(utenteId) {
    return stmtFindByUtente.all(utenteId);
  }

  create(data) {
    const info = stmtCreate.run(
      data.utente_id, data.titolo, data.descrizione,
      data.data_sogno, data.intensita, data.pubblico
    );
    return info.lastInsertRowid;
  }

  update(id, data) {
    stmtUpdate.run(data.titolo, data.descrizione, data.data_sogno, data.intensita, data.pubblico, id);
  }

  delete(id) {
    stmtDelete.run(id);
  }

  findPubblici(limit = 20, offset = 0) {
    return stmtFindPubblici.all(limit, offset);
  }

  countPubblici() {
    return stmtCountPubblici.get().totale;
  }

  findCorrelati(sognoId) {
    return stmtCorrelati.all(sognoId, sognoId, sognoId);
  }

  inserisciCorrelazione(sognoId, correlatoId) {
    // Garantisce sogno_id < correlato_id per il CHECK del DB
    const minId = Math.min(sognoId, correlatoId);
    const maxId = Math.max(sognoId, correlatoId);
    stmtInsertCorrelazione.run(minId, maxId);
  }

  eliminaCorrelazione(sognoId, correlatoId) {
    stmtDeleteCorrelazione.run(sognoId, correlatoId, correlatoId, sognoId);
  }

  findSuggerimentiCorrelazione(sognoId, utenteId) {
    return stmtSuggerimenti.all(sognoId, utenteId, sognoId, sognoId, sognoId);
  }

  // Ricerca dinamica con filtri (query costruita a runtime)
  cerca(utenteId, filtri) {
    let sql = 'SELECT DISTINCT s.* FROM sogni s';
    const joins      = [];
    const conditions = ['s.utente_id = ?'];
    const params     = [utenteId];

    if (filtri.tag) {
      joins.push('JOIN sogni_tag st ON st.sogno_id = s.id JOIN tag t ON t.id = st.tag_id');
      conditions.push('t.nome = ?');
      params.push(filtri.tag.toLowerCase());
    }
    if (filtri.emozione) {
      joins.push('JOIN sogni_emozioni se ON se.sogno_id = s.id JOIN emozioni e ON e.id = se.emozione_id');
      conditions.push('e.nome = ?');
      params.push(filtri.emozione.toLowerCase());
    }
    if (filtri.intensitaMin) {
      conditions.push('s.intensita >= ?');
      params.push(filtri.intensitaMin);
    }
    if (filtri.intensitaMax) {
      conditions.push('s.intensita <= ?');
      params.push(filtri.intensitaMax);
    }
    if (filtri.dataInizio) {
      conditions.push('s.data_sogno >= ?');
      params.push(filtri.dataInizio);
    }
    if (filtri.dataFine) {
      conditions.push('s.data_sogno <= ?');
      params.push(filtri.dataFine);
    }
    if (filtri.parola) {
      conditions.push('(s.titolo LIKE ? OR s.descrizione LIKE ?)');
      params.push('%' + filtri.parola + '%', '%' + filtri.parola + '%');
    }

    if (joins.length > 0) sql += ' ' + joins.join(' ');
    sql += ' WHERE ' + conditions.join(' AND ') + ' ORDER BY s.data_sogno DESC';
    return db.prepare(sql).all(...params);
  }

  // Ricerca sogni pubblici con filtri (usata da /esplora)
  cercaPubblici(filtri) {
    let sql = 'SELECT DISTINCT s.id, s.titolo, s.descrizione, s.data_sogno, s.intensita, s.created_at FROM sogni s';
    const joins      = [];
    const conditions = ['s.pubblico = 1'];
    const params     = [];

    if (filtri.tag) {
      joins.push('JOIN sogni_tag st ON st.sogno_id = s.id JOIN tag t ON t.id = st.tag_id');
      conditions.push('t.nome = ?');
      params.push(filtri.tag.toLowerCase());
    }
    if (filtri.emozione) {
      joins.push('JOIN sogni_emozioni se ON se.sogno_id = s.id JOIN emozioni e ON e.id = se.emozione_id');
      conditions.push('e.nome = ?');
      params.push(filtri.emozione.toLowerCase());
    }
    if (filtri.intensitaMin) {
      conditions.push('s.intensita >= ?');
      params.push(filtri.intensitaMin);
    }
    if (filtri.intensitaMax) {
      conditions.push('s.intensita <= ?');
      params.push(filtri.intensitaMax);
    }
    if (filtri.parola) {
      conditions.push('(s.titolo LIKE ? OR s.descrizione LIKE ?)');
      params.push('%' + filtri.parola + '%', '%' + filtri.parola + '%');
    }

    if (joins.length > 0) sql += ' ' + joins.join(' ');
    sql += ' WHERE ' + conditions.join(' AND ') + ' ORDER BY s.created_at DESC LIMIT 30';
    return db.prepare(sql).all(...params);
  }
}

module.exports = new SognoRepository();
