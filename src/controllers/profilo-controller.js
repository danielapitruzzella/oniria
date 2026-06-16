// Controller per il profilo utente: visualizzazione e modifica.

const { validationResult } = require('express-validator');
const ProfiloService       = require('../services/profilo-service');
const UtenteRepository     = require('../repositories/utente-repository');

class ProfiloController {

  async showModifica(req, res) {
    const utente = UtenteRepository.findById(req.session.userId);
    res.render('profilo/modifica', { pageTitle: 'Il mio profilo', fieldErrors: {}, formData: utente });
  }

  async modifica(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      return res.status(400).render('profilo/modifica', { pageTitle: 'Il mio profilo', fieldErrors, formData: req.body });
    }

    try {
      const utente = ProfiloService.modifica(req.session.userId, req.body);
      // Aggiorna il nome in sessione se cambiato
      req.session.nome = utente.nome;
      req.flash('success', 'Profilo aggiornato.');
      res.redirect('/profilo/modifica');
    } catch (err) {
      if (err.status === 409) {
        return res.status(409).render('profilo/modifica', {
          pageTitle:   'Il mio profilo',
          fieldErrors: { email: err.message },
          formData:    req.body,
        });
      }
      throw err;
    }
  }
}

module.exports = new ProfiloController();
