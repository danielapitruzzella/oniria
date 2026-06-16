// Genera un documento PDF con il diario dei sogni dell'utente.

const PDFDocument        = require('pdfkit');
const SognoRepository    = require('../repositories/sogno-repository');
const TagRepository      = require('../repositories/tag-repository');
const EmozioneRepository = require('../repositories/emozione-repository');
const { formatDate }     = require('../helpers/date-helper');

const BRAND_VIOLET = '#4A3D8F';
const BRAND_SOFT   = '#7C6FB0';
const COLOR_GRAY   = '#666666';
const COLOR_DARK   = '#333333';
const COLOR_LIGHT  = '#999999';

class PdfService {

  genera(utenteId, nomeUtente) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // --- Intestazione ---
    doc.fontSize(24).fillColor(BRAND_VIOLET).text('Oniria', { align: 'center' });
    doc.fontSize(14).fillColor(COLOR_GRAY).text('Archivio dei Sogni Ricorrenti', { align: 'center' });
    doc.fontSize(11).fillColor(COLOR_GRAY).text('di ' + nomeUtente, { align: 'center' });
    doc.moveDown(0.5);

    // Linea separatrice
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#DDDDDD').stroke();
    doc.moveDown(1.5);

    // --- Sogni ---
    const sogni = SognoRepository.findByUtente(utenteId);

    if (sogni.length === 0) {
      doc.fontSize(12).fillColor(COLOR_GRAY).text('Nessun sogno registrato.', { align: 'center' });
    }

    for (let i = 0; i < sogni.length; i++) {
      const sogno  = sogni[i];
      const tag    = TagRepository.findBySogno(sogno.id);
      const emozioni = EmozioneRepository.findBySogno(sogno.id);

      // Titolo sogno
      doc.fontSize(14).fillColor(COLOR_DARK).font('Helvetica-Bold').text(sogno.titolo);

      // Metadati
      const metaLine = formatDate(sogno.data_sogno) + '   |   Intensità: ' + sogno.intensita + '/5' +
        (sogno.pubblico ? '   |   Pubblico' : '');
      doc.fontSize(9).font('Helvetica').fillColor(COLOR_LIGHT).text(metaLine);
      doc.moveDown(0.4);

      // Descrizione
      doc.fontSize(10).fillColor(COLOR_DARK).text(sogno.descrizione, { lineGap: 2 });
      doc.moveDown(0.4);

      // Tag
      if (tag.length > 0) {
        doc.fontSize(9).fillColor(BRAND_VIOLET).text('Tag: ' + tag.map(t => t.nome).join(', '));
      }

      // Emozioni
      if (emozioni.length > 0) {
        doc.fontSize(9).fillColor(BRAND_SOFT).text('Emozioni: ' + emozioni.map(e => e.nome).join(', '));
      }

      doc.moveDown(1.2);

      // Linea leggera tra sogni (non dopo l'ultimo)
      if (i < sogni.length - 1) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#EEEEEE').stroke();
        doc.moveDown(1);
      }

      // Nuova pagina se spazio insufficiente
      if (doc.y > 720 && i < sogni.length - 1) doc.addPage();
    }

    // --- Footer ---
    doc.fontSize(8).fillColor(COLOR_LIGHT).text(
      'Esportato il ' + formatDate(new Date().toISOString()) + ' da Oniria',
      { align: 'center' }
    );

    return doc;
  }
}

module.exports = new PdfService();
