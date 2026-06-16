// Entry point dell'applicazione: middleware stack, mount routes, error handlers.

require('dotenv').config();

// database.js DEVE essere il primo require per attivare WAL (Write-Ahed logging):
// ogni modifica viene registrata in un file di log prima di essere applicata al database principale.) 
require('./config/database');

const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const session = require('express-session');
const flash   = require('connect-flash');

const SQLiteStore = require('connect-sqlite3')(session);
const { setLocals } = require('./middleware/locals');

// --- Validazione SESSION_SECRET ---
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('FATAL: SESSION_SECRET mancante o troppo corta (minimo 32 caratteri)');
  process.exit(1);
}

// --- Routes ---
const indexRoutes       = require('./routes/index');
const authRoutes        = require('./routes/auth');
const profiloRoutes     = require('./routes/profilo');
const sogniRoutes       = require('./routes/sogni');
const esploraRoutes     = require('./routes/esplora');
const statisticheRoutes = require('./routes/statistiche');

const app  = express();
const PORT = process.env.PORT || 3000;

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================
// MIDDLEWARE STACK
// ============================================================

// 1. Security headers (helmet) 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      styleSrc:    ["'self'"],
      scriptSrc:   ["'self'"],
      imgSrc:      ["'self'", 'data:'],
      fontSrc:     ["'self'"],
      connectSrc:  ["'self'"],
    },
  },
}));

// 2. Static assets
app.use(express.static(path.join(__dirname, 'public')));

// 3. Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 4. Session con connect-sqlite3 (file separato data/sessions.db)
app.use(session({
  store: new SQLiteStore({
    db:  'sessions.db',
    dir: path.join(__dirname, '..', 'data'),
    concurrentDB: true,
  }),
  name:              'oniria.sid',
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  },
}));

// 5. Flash messages (richiede sessione attiva)
app.use(flash());

// 6. Template locals (inietta currentUser, flashMessages, formatDate in tutte le views)
app.use(setLocals);

// ============================================================
// ROUTES
// ============================================================
app.use(indexRoutes);
app.use(authRoutes);
app.use(profiloRoutes);
app.use(sogniRoutes);
app.use(esploraRoutes);
app.use(statisticheRoutes);

// ============================================================
// ERROR HANDLERS
// ============================================================

// Handler 404 — nessuna route ha matchato
app.use((req, res) => {
  res.status(404).render('errors/404', { pageTitle: 'Pagina non trovata' });
});

// Global error handler (4 argomenti)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  const status  = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Si è verificato un errore del server.'
    : err.message;
  res.status(status).render('errors/500', { pageTitle: 'Errore', message });
});

// ============================================================
// AVVIO SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('Oniria avviato su http://localhost:' + PORT + ' [' + (process.env.NODE_ENV || 'development') + ']');
});

module.exports = app;
