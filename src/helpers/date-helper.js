// Helper per la formattazione delle date in italiano (timezone Europe/Rome).

const LOCALE   = 'it-IT';
const TIMEZONE = 'Europe/Rome';

/**
 * Formatta una data ISO 8601 (YYYY-MM-DD o datetime) in formato dd/mm/yyyy.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  // Aggiunge T00:00:00 per evitare shift di fuso orario su date senza orario
  const dateStr = isoString.length === 10 ? isoString + 'T00:00:00' : isoString;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formatta un datetime ISO 8601 in formato dd/mm/yyyy HH:MM.
 * @param {string} isoString
 * @returns {string}
 */
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatta un mese YYYY-MM in formato leggibile (es. "Giugno 2026").
 * @param {string} meseStr  — formato YYYY-MM
 * @returns {string}
 */
function formatMese(meseStr) {
  if (!meseStr) return '';
  const [anno, mese] = meseStr.split('-');
  const date = new Date(parseInt(anno), parseInt(mese) - 1, 1);
  return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

module.exports = { formatDate, formatDateTime, formatMese };
