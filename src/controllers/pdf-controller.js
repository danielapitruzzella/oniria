// Controller per l'esportazione PDF del diario sogni.

const PdfService = require('../services/pdf-service');

class PdfController {

  async esporta(req, res) {
    try {
      const doc = PdfService.genera(req.session.userId, req.session.nome);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="oniria-diario.pdf"');

      doc.pipe(res);
      doc.end();
    } catch (err) {
      req.flash('error', 'Errore durante la generazione del PDF.');
      res.redirect('/sogni');
    }
  }
}

module.exports = new PdfController();
