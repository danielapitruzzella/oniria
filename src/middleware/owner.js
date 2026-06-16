// Middleware ownership: verifica che il sogno appartenga all'utente corrente.

const SognoRepository = require('../repositories/sogno-repository');

function requireOwner(req, res, next) {
  const sognoId = parseInt(req.params.id, 10);
  if (isNaN(sognoId)) return res.status(404).render('errors/404');

  const sogno = SognoRepository.findById(sognoId);
  if (!sogno) return res.status(404).render('errors/404');
  if (sogno.utente_id !== req.session.userId) return res.status(403).render('errors/403');

  req.sogno = sogno; // passa il sogno al controller evitando doppia query
  next();
}

module.exports = { requireOwner };
