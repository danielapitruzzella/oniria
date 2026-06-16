// Routes per la landing pubblica: redirect a /sogni se autenticato, altrimenti esplora pubblica.

const { Router }       = require('express');
const EsploraController = require('../controllers/esplora-controller');

const router = Router();

router.get('/', (req, res, next) => {
  if (req.session && req.session.userId) return res.redirect('/sogni');
  return EsploraController.index(req, res, next);
});

module.exports = router;
