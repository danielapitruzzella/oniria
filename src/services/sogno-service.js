// Business logic per i sogni: creazione, modifica, eliminazione, gestione tag/emozioni, correlazioni.

const db                  = require('../config/database');
const SognoRepository     = require('../repositories/sogno-repository');
const TagRepository       = require('../repositories/tag-repository');
const EmozioneRepository  = require('../repositories/emozione-repository');

class SognoService {

  lista(utenteId, filtri) {
    const haFiltri = filtri && Object.values(filtri).some(v => v !== null && v !== '');
    const sogni = haFiltri
      ? SognoRepository.cerca(utenteId, filtri)
      : SognoRepository.findByUtente(utenteId);

    const tagDisponibili       = TagRepository.findAll();
    const emozioniDisponibili  = EmozioneRepository.findAll();

    return { sogni, tagDisponibili, emozioniDisponibili };
  }

  crea(data, utenteId) {
    return this._transazioneCrea(data, utenteId);
  }

  _transazioneCrea = db.transaction((data, utenteId) => {
    const sognoId = SognoRepository.create({
      utente_id:   utenteId,
      titolo:      data.titolo,
      descrizione: data.descrizione,
      data_sogno:  data.data_sogno,
      intensita:   parseInt(data.intensita, 10),
      pubblico:    data.pubblico === 'on' || data.pubblico === true || data.pubblico === '1' ? 1 : 0,
    });

    // Gestisci tag
    if (data.tag && data.tag.length > 0) {
      const tagList = Array.isArray(data.tag)
        ? data.tag
        : data.tag.split(',').map(t => t.trim()).filter(Boolean);
      for (const nome of tagList) {
        if (!nome) continue;
        const tagId = TagRepository.findOrCreate(nome.toLowerCase());
        TagRepository.associa(sognoId, tagId);
      }
    }

    // Gestisci emozioni
    if (data.emozioni && data.emozioni.length > 0) {
      const emoList = Array.isArray(data.emozioni) ? data.emozioni : [data.emozioni];
      for (const nome of emoList) {
        if (!nome) continue;
        const emoId = EmozioneRepository.findOrCreate(nome.toLowerCase());
        EmozioneRepository.associa(sognoId, emoId);
      }
    }

    return sognoId;
  });

  modifica(sognoId, data, utenteId) {
    const sogno = SognoRepository.findById(sognoId);
    if (!sogno) {
      const err = new Error('Sogno non trovato');
      err.status = 404;
      throw err;
    }
    if (sogno.utente_id !== utenteId) {
      const err = new Error('Non autorizzato');
      err.status = 403;
      throw err;
    }
    return this._transazioneModifica(sognoId, data);
  }

  _transazioneModifica = db.transaction((sognoId, data) => {
    SognoRepository.update(sognoId, {
      titolo:      data.titolo,
      descrizione: data.descrizione,
      data_sogno:  data.data_sogno,
      intensita:   parseInt(data.intensita, 10),
      pubblico:    data.pubblico === 'on' || data.pubblico === true || data.pubblico === '1' ? 1 : 0,
    });

    // Rimpiazza tag
    TagRepository.deassociaTutti(sognoId);
    if (data.tag && data.tag.length > 0) {
      const tagList = Array.isArray(data.tag)
        ? data.tag
        : data.tag.split(',').map(t => t.trim()).filter(Boolean);
      for (const nome of tagList) {
        if (!nome) continue;
        const tagId = TagRepository.findOrCreate(nome.toLowerCase());
        TagRepository.associa(sognoId, tagId);
      }
    }

    // Rimpiazza emozioni
    EmozioneRepository.deassociaTutti(sognoId);
    if (data.emozioni && data.emozioni.length > 0) {
      const emoList = Array.isArray(data.emozioni) ? data.emozioni : [data.emozioni];
      for (const nome of emoList) {
        if (!nome) continue;
        const emoId = EmozioneRepository.findOrCreate(nome.toLowerCase());
        EmozioneRepository.associa(sognoId, emoId);
      }
    }
  });

  elimina(sognoId, utenteId) {
    const sogno = SognoRepository.findById(sognoId);
    if (!sogno) {
      const err = new Error('Sogno non trovato');
      err.status = 404;
      throw err;
    }
    if (sogno.utente_id !== utenteId) {
      const err = new Error('Non autorizzato');
      err.status = 403;
      throw err;
    }
    SognoRepository.delete(sognoId);
  }

  getDettaglio(sognoId, utenteId) {
    const sogno = SognoRepository.findById(sognoId);
    if (!sogno || sogno.utente_id !== utenteId) return { sogno: null };

    const tag          = TagRepository.findBySogno(sognoId);
    const emozioni     = EmozioneRepository.findBySogno(sognoId);
    const correlati    = SognoRepository.findCorrelati(sognoId);
    const suggerimenti = SognoRepository.findSuggerimentiCorrelazione(sognoId, utenteId);

    // Arricchisci correlati con tag
    const correlatiArricchiti = correlati.map(s => ({
      ...s,
      tag: TagRepository.findBySogno(s.id),
    }));

    return { sogno, tag, emozioni, correlati: correlatiArricchiti, suggerimenti };
  }

  confermaCorrelazione(sognoId, correlatoId, utenteId) {
    const sogno    = SognoRepository.findById(sognoId);
    const correlato = SognoRepository.findById(correlatoId);

    if (!sogno || sogno.utente_id !== utenteId) {
      const err = new Error('Sogno non trovato');
      err.status = 404;
      throw err;
    }
    if (!correlato || correlato.utente_id !== utenteId) {
      const err = new Error('Sogno correlato non trovato o non autorizzato');
      err.status = 404;
      throw err;
    }
    if (sognoId === correlatoId) {
      const err = new Error('Un sogno non puo\' essere correlato con se stesso');
      err.status = 400;
      throw err;
    }

    SognoRepository.inserisciCorrelazione(sognoId, correlatoId);
  }
}

module.exports = new SognoService();
