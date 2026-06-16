// Gestione input tag con chip: aggiunta, rimozione, serializzazione CSV nell'hidden input.

(function () {
  'use strict';

  const container   = document.getElementById('tag-chips-container');
  const hiddenInput = document.getElementById('tag');
  const textInput   = document.getElementById('tag-input-visible');

  if (!container || !hiddenInput || !textInput) return;

  const MAX_TAGS    = 10;
  const MAX_LEN     = 30;

  // --- Stato ---
  let tags = [];

  // --- Inizializzazione da valore esistente (modifica) ---
  const initial = (hiddenInput.value || '').split(',').map(t => t.trim()).filter(Boolean);
  for (const nome of initial) addTag(nome);

  // --- Funzioni ---
  function syncHidden() {
    hiddenInput.value = tags.join(',');
  }

  function addTag(nome) {
    const normalized = nome.trim().toLowerCase();
    if (!normalized) return;
    if (normalized.length > MAX_LEN) return;
    if (tags.length >= MAX_TAGS) return;
    if (tags.includes(normalized)) return;

    tags.push(normalized);

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full px-2.5 py-0.5';
    chip.dataset.nome = normalized;
    chip.innerHTML = '<span>' + escapeHtml(normalized) + '</span>' +
      '<button type="button" class="text-brand-primary/60 hover:text-brand-primary ml-0.5 leading-none" aria-label="Rimuovi ' + escapeHtml(normalized) + '">&times;</button>';

    chip.querySelector('button').addEventListener('click', function () {
      removeTag(normalized);
    });

    container.insertBefore(chip, textInput);
    syncHidden();
  }

  function removeTag(nome) {
    tags = tags.filter(t => t !== nome);
    const chip = container.querySelector('[data-nome="' + nome + '"]');
    if (chip) chip.remove();
    syncHidden();
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- Eventi ---
  textInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(textInput.value);
      textInput.value = '';
    } else if (e.key === 'Backspace' && textInput.value === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  });

  textInput.addEventListener('blur', function () {
    if (textInput.value.trim()) {
      addTag(textInput.value);
      textInput.value = '';
    }
  });

  // Click sul container focalizza il text input
  container.addEventListener('click', function () {
    textInput.focus();
  });

  // Selezione da datalist
  textInput.addEventListener('change', function () {
    addTag(textInput.value);
    textInput.value = '';
  });

}());
