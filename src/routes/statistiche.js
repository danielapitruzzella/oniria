// Routes per le statistiche personali.

const { Router }         = require('express');
const { requireAuth }    = require('../middleware/auth');
const StatisticaController = require('../controllers/statistica-controller');

const router = Router();

router.get('/statistiche', requireAuth, StatisticaController.index.bind(StatisticaController));

module.exports = router;
