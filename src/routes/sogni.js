// Routes per i sogni: CRUD, filtri, esportazione PDF.
// Nota: le route statiche (/sogni/nuovo, /sogni/esporta-pdf) precedono quelle parametriche (/sogni/:id).

const { Router }      = require('express');
const { body }        = require('express-validator');

const { requireAuth }  = require('../middleware/auth');
const { requireOwner } = require('../middleware/owner');
const SognoController  = require('../controllers/sogno-controller');
const PdfController    = require('../controllers/pdf-controller');

const router = Router();

// --- Validazione sogno ---
const sognoValidazione = [
  body('titolo')
    .trim()
    .notEmpty().withMessage('Titolo obbligatorio')
    .isLength({ max: 200 }).withMessage('Titolo: massimo 200 caratteri'),
  body('descrizione')
    .trim()
    .notEmpty().withMessage('Descrizione obbligatoria'),
  body('data_sogno')
    .notEmpty().withMessage('Data obbligatoria')
    .isISO8601().withMessage('Formato data non valido')
    .custom(value => {
      if (new Date(value) > new Date()) throw new Error('La data non può essere nel futuro');
      return true;
    }),
  body('intensita')
    .isInt({ min: 1, max: 5 }).withMessage('Intensità: valore da 1 a 5'),
  body('tag')
    .optional()
    .custom(value => {
      if (!value) return true;
      const tags = value.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 10) throw new Error('Massimo 10 tag per sogno');
      if (tags.some(t => t.length > 30)) throw new Error('Ogni tag: massimo 30 caratteri');
      return true;
    }),
  body('emozioni').optional(),
  body('pubblico').optional(),
];

// --- Endpoints ---
// Statiche prima delle parametriche
router.get('/sogni',              requireAuth, SognoController.lista.bind(SognoController));
router.get('/sogni/nuovo',        requireAuth, SognoController.showNuovo.bind(SognoController));
router.post('/sogni',             requireAuth, sognoValidazione, SognoController.crea.bind(SognoController));
router.get('/sogni/esporta-pdf',  requireAuth, PdfController.esporta.bind(PdfController));

// Parametriche
router.get('/sogni/:id',          requireAuth, requireOwner, SognoController.dettaglio.bind(SognoController));
router.get('/sogni/:id/modifica', requireAuth, requireOwner, SognoController.showModifica.bind(SognoController));
router.post('/sogni/:id',         requireAuth, requireOwner, sognoValidazione, SognoController.modifica.bind(SognoController));
router.post('/sogni/:id/elimina', requireAuth, requireOwner, SognoController.elimina.bind(SognoController));
router.post('/sogni/:id/correla', requireAuth, requireOwner, SognoController.confermaCorrelazione.bind(SognoController));

module.exports = router;
