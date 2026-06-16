// Controller per le statistiche personali filtrabili per mese.

const StatisticaService = require('../services/statistica-service');

class StatisticaController {

  async index(req, res) {
    const stats = StatisticaService.getStatistichePersonali(req.session.userId, req.query.mese);
    res.render('statistiche/index', {
      pageTitle: 'Le mie statistiche',
      pageScript: 'filtri.js',
      ...stats,
    });
  }
}

module.exports = new StatisticaController();
