// Inietta variabili globali disponibili in tutte le views EJS.

const { formatDate, formatDateTime, formatMese } = require('../helpers/date-helper');

function setLocals(req, res, next) {
  res.locals.flashMessages = {
    success: req.flash('success'),
    error:   req.flash('error'),
    info:    req.flash('info'),
  };
  res.locals.currentUser = req.session && req.session.userId ? {
    id:       req.session.userId,
    username: req.session.username,
    nome:     req.session.nome,
  } : null;
  res.locals.formatDate     = formatDate;
  res.locals.formatDateTime = formatDateTime;
  res.locals.formatMese     = formatMese;
  next();
}

module.exports = { setLocals };
