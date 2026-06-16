// Routes per il profilo utente: visualizzazione e modifica.

const { Router } = require('express');
const { body }   = require('express-validator');

const { requireAuth }    = require('../middleware/auth');
const ProfiloController  = require('../controllers/profilo-controller');

const router = Router();

// --- Validazione profilo ---
const profiloValidazione = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome obbligatorio')
    .isLength({ max: 100 }).withMessage('Nome: massimo 100 caratteri'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email obbligatoria')
    .isEmail().withMessage('Email non valida'),
  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio: massimo 500 caratteri'),
];

// --- Endpoints ---
router.get('/profilo/modifica',  requireAuth, ProfiloController.showModifica.bind(ProfiloController));
router.post('/profilo/modifica', requireAuth, profiloValidazione, ProfiloController.modifica.bind(ProfiloController));

module.exports = router;
