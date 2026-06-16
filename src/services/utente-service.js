// Business logic per l'autenticazione: registrazione, login, cambio password.

const bcrypt            = require('bcrypt');
const UtenteRepository  = require('../repositories/utente-repository');

const SALT_ROUNDS = 12;

class UtenteService {

  registra(data) {
    // Verifica unicita' username
    const esisteUsername = UtenteRepository.findByUsername(data.username);
    if (esisteUsername) {
      const err = new Error('Username gia\' in uso');
      err.status = 409;
      throw err;
    }

    // Verifica unicita' email
    const esisteEmail = UtenteRepository.findByEmail(data.email);
    if (esisteEmail) {
      const err = new Error('Email gia\' registrata');
      err.status = 409;
      throw err;
    }

    const passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
    const utenteId = UtenteRepository.create({
      username: data.username.trim(),
      email:    data.email.trim().toLowerCase(),
      nome:     data.nome.trim(),
      bio:      data.bio ? data.bio.trim() : '',
      password: passwordHash,
    });

    return UtenteRepository.findById(utenteId);
  }

  login(username, password) {
    const utente = UtenteRepository.findByUsername(username.trim());
    if (!utente) {
      const err = new Error('Credenziali non valide');
      err.status = 401;
      throw err;
    }

    const match = bcrypt.compareSync(password, utente.password);
    if (!match) {
      const err = new Error('Credenziali non valide');
      err.status = 401;
      throw err;
    }

    return utente;
  }

  cambiaPassword(utenteId, passwordAttuale, nuovaPassword) {
    const utente = UtenteRepository.findById(utenteId);
    if (!utente) {
      const err = new Error('Utente non trovato');
      err.status = 404;
      throw err;
    }

    const match = bcrypt.compareSync(passwordAttuale, utente.password);
    if (!match) {
      const err = new Error('Password attuale non corretta');
      err.status = 401;
      throw err;
    }

    const nuovoHash = bcrypt.hashSync(nuovaPassword, SALT_ROUNDS);
    UtenteRepository.updatePassword(utenteId, nuovoHash);
  }
}

module.exports = new UtenteService();
