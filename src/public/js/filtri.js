// Gestione form filtri: auto-submit su cambio select, reset campo.

(function () {
  'use strict';

  const form = document.getElementById('form-filtri');
  if (!form) return;

  // Auto-submit quando si cambia un select filtro
  const selects = form.querySelectorAll('select');
  selects.forEach(function (sel) {
    sel.addEventListener('change', function () {
      form.submit();
    });
  });

}());
