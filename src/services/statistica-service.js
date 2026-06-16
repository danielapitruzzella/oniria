// Business logic per le statistiche personali: aggregazioni mensili e dati community.

const StatisticaRepository = require('../repositories/statistica-repository');
const SognoRepository      = require('../repositories/sogno-repository');
const { formatMese }       = require('../helpers/date-helper');

function meseCorrente() {
  return new Date().toISOString().slice(0, 7);
}

function meseValido(mese) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mese || '');
}

class StatisticaService {

  getStatistichePersonali(utenteId, meseRichiesto) {
    const meseDefault = meseCorrente();
    const meseSelezionato = meseValido(meseRichiesto) ? meseRichiesto : meseDefault;

    const mesiDisponibili = StatisticaRepository.mesiDisponibiliUtente(utenteId).map(row => row.mese);
    const mesiOpzioni = mesiDisponibili.includes(meseSelezionato)
      ? mesiDisponibili
      : [meseSelezionato, ...mesiDisponibili.filter(m => m !== meseSelezionato)];

    const totale = StatisticaRepository.contaSogniMese(utenteId, meseSelezionato);
    const intensitaMedia = StatisticaRepository.intensitaMediaMese(utenteId, meseSelezionato);
    const tagUsati = StatisticaRepository.contaTagDiversiMese(utenteId, meseSelezionato);
    const emozioniRegistrate = StatisticaRepository.contaEmozioniDiverseMese(utenteId, meseSelezionato);
    const tagFrequenti = StatisticaRepository.tagFrequentiMese(utenteId, meseSelezionato, 10);
    const emozioniFrequenti = StatisticaRepository.emozioniFrequentiMese(utenteId, meseSelezionato, 10);
    const tagEmergenti = StatisticaRepository.tagEmergentiMese(utenteId, meseSelezionato);
    const visibilita = StatisticaRepository.visibilitaMese(utenteId, meseSelezionato);
    const sognoRecente = StatisticaRepository.sognoRecenteMese(utenteId, meseSelezionato);
    const giornoIntenso = StatisticaRepository.giornoIntensoMese(utenteId, meseSelezionato);

    return {
      filtro: {
        mese: meseSelezionato,
        label: formatMese(meseSelezionato),
        opzioni: mesiOpzioni.map(mese => ({
          value: mese,
          label: formatMese(mese),
        })),
      },
      riepilogo: {
        totale,
        intensitaMedia,
        tagUsati,
        emozioniRegistrate,
      },
      tagFrequenti,
      emozioniFrequenti,
      tagEmergenti,
      visibilita,
      sognoRecente,
      giornoIntenso,
      haDati: totale > 0,
    };
  }

  getDatiCommunity() {
    const tagSettimana       = StatisticaRepository.tagSettimanaCommunity(10);
    const emozioneComuneSett = StatisticaRepository.emozioneComuneSettimana();
    const sogniPubblici      = SognoRepository.findPubblici(6, 0);

    return { tagSettimana, emozioneComuneSett, sogniPubblici };
  }
}

module.exports = new StatisticaService();
