// Controller per i sogni: lista, creazione, dettaglio, modifica, eliminazione, correlazioni.

const { validationResult } = require('express-validator');
const SognoService         = require('../services/sogno-service');
const TagRepository        = require('../repositories/tag-repository');
const EmozioneRepository   = require('../repositories/emozione-repository');

class SognoController {

  async lista(req, res) {
    const filtri = {
      tag:          req.query.tag          || null,
      emozione:     req.query.emozione     || null,
      parola:       req.query.q            || null,
      dataInizio:   req.query.da           || null,
      dataFine:     req.query.a            || null,
      intensitaMin: req.query.intensita_min ? parseInt(req.query.intensita_min, 10) : null,
      intensitaMax: req.query.intensita_max ? parseInt(req.query.intensita_max, 10) : null,
    };
    const { sogni, tagDisponibili, emozioniDisponibili } = SognoService.lista(req.session.userId, filtri);
    res.render('sogni/lista', { pageTitle: 'I miei sogni', sogni, filtri, tagDisponibili, emozioniDisponibili });
  }

  async showNuovo(req, res) {
    res.render('sogni/nuovo', {
      pageTitle:          'Nuovo sogno',
      fieldErrors:        {},
      formData:           {},
      tagDisponibili:     TagRepository.findAll(),
      emozioniDisponibili: EmozioneRepository.findAll(),
      pageScript:         'tag-input.js',
    });
  }

  async crea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      return res.status(400).render('sogni/nuovo', {
        pageTitle:          'Nuovo sogno',
        fieldErrors,
        formData:           req.body,
        tagDisponibili:     TagRepository.findAll(),
        emozioniDisponibili: EmozioneRepository.findAll(),
        pageScript:         'tag-input.js',
      });
    }

    try {
      const sognoId = SognoService.crea(req.body, req.session.userId);
      req.flash('success', 'Sogno registrato con successo.');
      res.redirect('/sogni/' + sognoId);
    } catch (err) {
      if (err.status) {
        req.flash('error', err.message);
        return res.redirect('/sogni/nuovo');
      }
      throw err;
    }
  }

  async dettaglio(req, res) {
    const sognoId = parseInt(req.params.id, 10);
    const { sogno, tag, emozioni, correlati, suggerimenti } = SognoService.getDettaglio(sognoId, req.session.userId);
    if (!sogno) return res.status(404).render('errors/404');
    res.render('sogni/dettaglio', { pageTitle: sogno.titolo, sogno, tag, emozioni, correlati, suggerimenti });
  }

  async showModifica(req, res) {
    const sogno    = req.sogno; // passato da requireOwner
    const tag      = TagRepository.findBySogno(sogno.id);
    const emozioni = EmozioneRepository.findBySogno(sogno.id);
    res.render('sogni/modifica', {
      pageTitle:          'Modifica sogno',
      fieldErrors:        {},
      formData:           { ...sogno, tag: tag.map(t => t.nome).join(', '), emozioni: emozioni.map(e => e.nome) },
      tagDisponibili:     TagRepository.findAll(),
      emozioniDisponibili: EmozioneRepository.findAll(),
      sogno,
      pageScript:         'tag-input.js',
    });
  }

  async modifica(req, res) {
    const sognoId = parseInt(req.params.id, 10);
    const errors  = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(e => { fieldErrors[e.path] = e.msg; });
      const sogno = req.sogno;
      return res.status(400).render('sogni/modifica', {
        pageTitle:          'Modifica sogno',
        fieldErrors,
        formData:           req.body,
        tagDisponibili:     TagRepository.findAll(),
        emozioniDisponibili: EmozioneRepository.findAll(),
        sogno,
        pageScript:         'tag-input.js',
      });
    }

    try {
      SognoService.modifica(sognoId, req.body, req.session.userId);
      req.flash('success', 'Sogno aggiornato.');
      res.redirect('/sogni/' + sognoId);
    } catch (err) {
      if (err.status) {
        req.flash('error', err.message);
        return res.redirect('/sogni/' + sognoId + '/modifica');
      }
      throw err;
    }
  }

  async elimina(req, res) {
    const sognoId = parseInt(req.params.id, 10);
    try {
      SognoService.elimina(sognoId, req.session.userId);
      req.flash('success', 'Sogno eliminato.');
      res.redirect('/sogni');
    } catch (err) {
      if (err.status) {
        req.flash('error', err.message);
        return res.redirect('/sogni');
      }
      throw err;
    }
  }

  async confermaCorrelazione(req, res) {
    const sognoId    = parseInt(req.params.id, 10);
    const correlatoId = parseInt(req.body.correlato_id, 10);

    try {
      SognoService.confermaCorrelazione(sognoId, correlatoId, req.session.userId);
      req.flash('success', 'Correlazione confermata.');
    } catch (err) {
      if (err.status) {
        req.flash('error', err.message);
      } else {
        throw err;
      }
    }
    res.redirect('/sogni/' + sognoId);
  }
}

module.exports = new SognoController();
