// Business logic per il profilo utente: modifica dati personali.

const UtenteRepository = require('../repositories/utente-repository');

class ProfiloService {

  modifica(utenteId, data) {
    const utente = UtenteRepository.findById(utenteId);
    if (!utente) {
      const err = new Error('Utente non trovato');
      err.status = 404;
      throw err;
    }

    // Verifica unicita' email se cambiata
    if (data.email.trim().toLowerCase() !== utente.email.toLowerCase()) {
      const esisteEmail = UtenteRepository.findByEmail(data.email.trim().toLowerCase());
      if (esisteEmail && esisteEmail.id !== utenteId) {
        const err = new Error('Email gia\' in uso da un altro account');
        err.status = 409;
        throw err;
      }
    }

    UtenteRepository.update(utenteId, {
      nome:  data.nome.trim(),
      email: data.email.trim().toLowerCase(),
      bio:   data.bio ? data.bio.trim() : '',
    });

    return UtenteRepository.findById(utenteId);
  }
}

module.exports = new ProfiloService();
