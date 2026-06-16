// Controller per l'autenticazione: registrazione, login, logout, cambio password.

const { validationResult } = require('express-validator');
const UtenteService        = require('../services/utente-service');

class UtenteController {

  async showLogin(req, res) {
    if (req.session && req.session.userId) return res.redirect('/sogni');
    res.render('auth/login', { pageTitle: 'Accedi', fieldErrors: {}, formData: {} });
  }

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      return res.status(400).render('auth/login', { pageTitle: 'Accedi', fieldErrors, formData: req.body });
    }

    try {
      const utente = UtenteService.login(req.body.username, req.body.password);

      // Session fixation: rigenera la sessione prima di salvare i dati
      req.session.regenerate((err) => {
        if (err) throw err;
        req.session.userId   = utente.id;
        req.session.username = utente.username;
        req.session.nome     = utente.nome;
        req.session.save((saveErr) => {
          if (saveErr) throw saveErr;
          res.redirect('/sogni');
        });
      });
    } catch (err) {
      if (err.status === 401) {
        return res.status(401).render('auth/login', {
          pageTitle:   'Accedi',
          fieldErrors: { username: 'Username o password non corretti' },
          formData:    req.body,
        });
      }
      throw err;
    }
  }

  async showRegistra(req, res) {
    if (req.session && req.session.userId) return res.redirect('/sogni');
    res.render('auth/registra', { pageTitle: 'Registrati', fieldErrors: {}, formData: {} });
  }

  async registra(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      return res.status(400).render('auth/registra', { pageTitle: 'Registrati', fieldErrors, formData: req.body });
    }

    try {
      const utente = UtenteService.registra(req.body);
      req.session.regenerate((err) => {
        if (err) throw err;
        req.session.userId   = utente.id;
        req.session.username = utente.username;
        req.session.nome     = utente.nome;
        req.session.save((saveErr) => {
          if (saveErr) throw saveErr;
          req.flash('success', 'Benvenuto in Oniria, ' + utente.nome + '!');
          res.redirect('/sogni');
        });
      });
    } catch (err) {
      if (err.status === 409) {
        const fieldErrors = {};
        if (err.message.includes('Username')) fieldErrors.username = err.message;
        else fieldErrors.email = err.message;
        return res.status(409).render('auth/registra', { pageTitle: 'Registrati', fieldErrors, formData: req.body });
      }
      throw err;
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error('Errore distruzione sessione:', err);
      res.clearCookie('oniria.sid');
      res.redirect('/');
    });
  }

  async showCambiaPassword(req, res) {
    res.render('auth/cambia-password', { pageTitle: 'Cambia Password', fieldErrors: {}, formData: {} });
  }

  async cambiaPassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      return res.status(400).render('auth/cambia-password', { pageTitle: 'Cambia Password', fieldErrors, formData: req.body });
    }

    try {
      UtenteService.cambiaPassword(req.session.userId, req.body.password_attuale, req.body.nuova_password);
      req.flash('success', 'Password aggiornata con successo.');
      res.redirect('/profilo/modifica');
    } catch (err) {
      if (err.status === 401) {
        return res.status(401).render('auth/cambia-password', {
          pageTitle:   'Cambia Password',
          fieldErrors: { password_attuale: err.message },
          formData:    req.body,
        });
      }
      throw err;
    }
  }
}

module.exports = new UtenteController();
