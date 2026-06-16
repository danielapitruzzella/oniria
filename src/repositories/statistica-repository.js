// Query aggregate per statistiche personali e community.

const db = require('../config/database');

// --- Mesi disponibili per utente ---
const stmtMesiDisponibiliUtente = db.prepare(`
  SELECT DISTINCT strftime('%Y-%m', data_sogno) AS mese
  FROM sogni
  WHERE utente_id = ?
  ORDER BY mese DESC
`);

// --- Conteggi e KPI mensili ---
const stmtContaSogniMese = db.prepare(`
  SELECT COUNT(*) AS totale
  FROM sogni
  WHERE utente_id = ? AND strftime('%Y-%m', data_sogno) = ?
`);

const stmtIntensitaMediaMese = db.prepare(`
  SELECT ROUND(AVG(intensita), 1) AS media
  FROM sogni
  WHERE utente_id = ? AND strftime('%Y-%m', data_sogno) = ?
`);

const stmtContaTagDiversiMese = db.prepare(`
  SELECT COUNT(DISTINCT st.tag_id) AS totale
  FROM sogni s
  LEFT JOIN sogni_tag st ON st.sogno_id = s.id
  WHERE s.utente_id = ? AND strftime('%Y-%m', s.data_sogno) = ?
`);

const stmtContaEmozioniDiverseMese = db.prepare(`
  SELECT COUNT(DISTINCT se.emozione_id) AS totale
  FROM sogni s
  LEFT JOIN sogni_emozioni se ON se.sogno_id = s.id
  WHERE s.utente_id = ? AND strftime('%Y-%m', s.data_sogno) = ?
`);

// --- Liste ordinate mese selezionato ---
const stmtTagFrequentiMese = db.prepare(`
  SELECT t.nome, COUNT(*) AS conteggio
  FROM sogni_tag st
  JOIN tag t ON t.id = st.tag_id
  JOIN sogni s ON s.id = st.sogno_id
  WHERE s.utente_id = ? AND strftime('%Y-%m', s.data_sogno) = ?
  GROUP BY t.id
  ORDER BY conteggio DESC, t.nome ASC
  LIMIT ?
`);

const stmtEmozioniFrequentiMese = db.prepare(`
  SELECT e.nome, COUNT(*) AS conteggio
  FROM sogni_emozioni se
  JOIN emozioni e ON e.id = se.emozione_id
  JOIN sogni s ON s.id = se.sogno_id
  WHERE s.utente_id = ? AND strftime('%Y-%m', s.data_sogno) = ?
  GROUP BY e.id
  ORDER BY conteggio DESC, e.nome ASC
  LIMIT ?
`);

const stmtTagEmergentiMese = db.prepare(`
  SELECT DISTINCT t.nome
  FROM sogni_tag st
  JOIN tag t ON t.id = st.tag_id
  JOIN sogni s ON s.id = st.sogno_id
  WHERE s.utente_id = ? AND strftime('%Y-%m', s.data_sogno) = ?
    AND NOT EXISTS (
      SELECT 1
      FROM sogni_tag st_prev
      JOIN sogni s_prev ON s_prev.id = st_prev.sogno_id
      WHERE st_prev.tag_id = t.id
        AND s_prev.utente_id = s.utente_id
        AND s_prev.data_sogno < date(? || '-01')
    )
  ORDER BY t.nome ASC
  LIMIT 10
`);

// --- Insight mensili ---
const stmtVisibilitaMese = db.prepare(`
  SELECT
    SUM(CASE WHEN pubblico = 1 THEN 1 ELSE 0 END) AS pubblici,
    SUM(CASE WHEN pubblico = 0 THEN 1 ELSE 0 END) AS privati
  FROM sogni
  WHERE utente_id = ? AND strftime('%Y-%m', data_sogno) = ?
`);

const stmtSognoRecenteMese = db.prepare(`
  SELECT id, titolo, data_sogno, intensita, pubblico
  FROM sogni
  WHERE utente_id = ? AND strftime('%Y-%m', data_sogno) = ?
  ORDER BY data_sogno DESC, created_at DESC
  LIMIT 1
`);

const stmtGiornoIntensoMese = db.prepare(`
  SELECT
    data_sogno,
    ROUND(AVG(intensita), 1) AS media,
    COUNT(*) AS totale
  FROM sogni
  WHERE utente_id = ? AND strftime('%Y-%m', data_sogno) = ?
  GROUP BY data_sogno
  ORDER BY media DESC, totale DESC, data_sogno DESC
  LIMIT 1
`);

// --- Tag della settimana (community, solo sogni pubblici ultimi 7 giorni) ---
const stmtTagSettimanaCommunity = db.prepare(`
  SELECT t.nome, COUNT(*) AS conteggio
  FROM sogni_tag st
  JOIN tag t ON t.id = st.tag_id
  JOIN sogni s ON s.id = st.sogno_id
  WHERE s.pubblico = 1 AND s.created_at >= date('now', '-7 days')
  GROUP BY t.id
  ORDER BY conteggio DESC
  LIMIT ?
`);

// --- Emozione piu' comune questa settimana (community) ---
const stmtEmozioneComuneSettimana = db.prepare(`
  SELECT e.nome, COUNT(*) AS conteggio
  FROM sogni_emozioni se
  JOIN emozioni e ON e.id = se.emozione_id
  JOIN sogni s ON s.id = se.sogno_id
  WHERE s.pubblico = 1 AND s.created_at >= date('now', '-7 days')
  GROUP BY e.id
  ORDER BY conteggio DESC
  LIMIT 1
`);

class StatisticaRepository {

  mesiDisponibiliUtente(utenteId) {
    return stmtMesiDisponibiliUtente.all(utenteId);
  }

  contaSogniMese(utenteId, mese) {
    return stmtContaSogniMese.get(utenteId, mese).totale;
  }

  intensitaMediaMese(utenteId, mese) {
    return stmtIntensitaMediaMese.get(utenteId, mese).media;
  }

  contaTagDiversiMese(utenteId, mese) {
    return stmtContaTagDiversiMese.get(utenteId, mese).totale;
  }

  contaEmozioniDiverseMese(utenteId, mese) {
    return stmtContaEmozioniDiverseMese.get(utenteId, mese).totale;
  }

  tagFrequentiMese(utenteId, mese, limit = 10) {
    return stmtTagFrequentiMese.all(utenteId, mese, limit);
  }

  emozioniFrequentiMese(utenteId, mese, limit = 10) {
    return stmtEmozioniFrequentiMese.all(utenteId, mese, limit);
  }

  tagEmergentiMese(utenteId, mese) {
    return stmtTagEmergentiMese.all(utenteId, mese, mese);
  }

  visibilitaMese(utenteId, mese) {
    const row = stmtVisibilitaMese.get(utenteId, mese);
    return {
      pubblici: row.pubblici || 0,
      privati: row.privati || 0,
    };
  }

  sognoRecenteMese(utenteId, mese) {
    return stmtSognoRecenteMese.get(utenteId, mese);
  }

  giornoIntensoMese(utenteId, mese) {
    return stmtGiornoIntensoMese.get(utenteId, mese);
  }

  tagSettimanaCommunity(limit = 10) {
    return stmtTagSettimanaCommunity.all(limit);
  }

  emozioneComuneSettimana() {
    return stmtEmozioneComuneSettimana.get();
  }
}

module.exports = new StatisticaRepository();
