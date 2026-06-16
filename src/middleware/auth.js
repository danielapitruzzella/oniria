// Middleware di autenticazione: verifica sessione attiva.

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Devi effettuare il login per accedere.');
    return res.redirect('/auth/login');
  }
  next();
}

module.exports = { requireAuth };
