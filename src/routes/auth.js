// Routes per l'autenticazione: login, registrazione, logout, cambio password.

const { Router } = require('express');
const { body }   = require('express-validator');

const { requireAuth }    = require('../middleware/auth');
const UtenteController   = require('../controllers/utente-controller');

const router = Router();

// --- Validazione registrazione ---
const registraValidazione = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username obbligatorio')
    .isLength({ min: 3, max: 30 }).withMessage('Username: da 3 a 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: solo lettere, numeri e underscore'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email obbligatoria')
    .isEmail().withMessage('Email non valida'),
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome obbligatorio')
    .isLength({ max: 100 }).withMessage('Nome: massimo 100 caratteri'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password: minimo 8 caratteri'),
  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio: massimo 500 caratteri'),
];

// --- Validazione login ---
const loginValidazione = [
  body('username').trim().notEmpty().withMessage('Username obbligatorio'),
  body('password').notEmpty().withMessage('Password obbligatoria'),
];

// --- Validazione cambio password ---
const cambiaPasswordValidazione = [
  body('password_attuale').notEmpty().withMessage('Password attuale obbligatoria'),
  body('nuova_password')
    .isLength({ min: 8 }).withMessage('Nuova password: minimo 8 caratteri'),
  body('conferma_password').custom((value, { req }) => {
    if (value !== req.body.nuova_password) throw new Error('Le password non coincidono');
    return true;
  }),
];

// --- Endpoints ---
router.get('/auth/login',    UtenteController.showLogin.bind(UtenteController));
router.post('/auth/login',   loginValidazione, UtenteController.login.bind(UtenteController));

router.get('/auth/registra', UtenteController.showRegistra.bind(UtenteController));
router.post('/auth/registra', registraValidazione, UtenteController.registra.bind(UtenteController));

router.post('/auth/logout',  requireAuth, UtenteController.logout.bind(UtenteController));

router.get('/auth/cambia-password',  requireAuth, UtenteController.showCambiaPassword.bind(UtenteController));
router.post('/auth/cambia-password', requireAuth, cambiaPasswordValidazione, UtenteController.cambiaPassword.bind(UtenteController));

module.exports = router;
