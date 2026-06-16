// Controller per la pagina pubblica: sogni anonimi, tag della settimana, emozione settimana, filtri.

const StatisticaRepository = require('../repositories/statistica-repository');
const SognoRepository      = require('../repositories/sogno-repository');
const TagRepository        = require('../repositories/tag-repository');
const EmozioneRepository   = require('../repositories/emozione-repository');

class EsploraController {

  async index(req, res) {
    // Leggi parametri filtro
    const filtri = {
      tag:          req.query.tag          || null,
      emozione:     req.query.emozione     || null,
      parola:       req.query.q            || null,
      intensitaMin: req.query.intensita_min ? parseInt(req.query.intensita_min, 10) : null,
      intensitaMax: req.query.intensita_max ? parseInt(req.query.intensita_max, 10) : null,
    };

    const haFiltri = Object.values(filtri).some(v => v !== null);

    // Sogni pubblici: filtrati o ultimi 20
    const sogniPubblici = haFiltri
      ? SognoRepository.cercaPubblici(filtri)
      : SognoRepository.findPubblici(20, 0);

    // Arricchisci ogni sogno con tag ed emozioni per le card pubbliche
    const sogniConMetadati = sogniPubblici.map(s => ({
      ...s,
      tag: TagRepository.findBySogno(s.id),
      emozioni: EmozioneRepository.findBySogno(s.id),
    }));

    // Dati community (sidebar)
    const tagSettimana       = StatisticaRepository.tagSettimanaCommunity(10);
    const emozioneComuneSett = StatisticaRepository.emozioneComuneSettimana();
    const totale             = SognoRepository.countPubblici();

    // Opzioni filtro (per le dropdown)
    const tagDisponibili       = TagRepository.findAll();
    const emozioniDisponibili  = EmozioneRepository.findAll();

    res.render('esplora/index', {
      pageTitle:        'Esplora',
      tagSettimana,
      emozioneComuneSett,
      sogniPubblici:    sogniConMetadati,
      totale,
      filtri,
      haFiltri,
      tagDisponibili,
      emozioniDisponibili,
    });
  }
}

module.exports = new EsploraController();
