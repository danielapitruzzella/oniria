// Routes per la pagina pubblica di esplorazione community.

const { Router }       = require('express');
const EsploraController = require('../controllers/esplora-controller');

const router = Router();

router.get('/esplora', EsploraController.index.bind(EsploraController));

module.exports = router;
