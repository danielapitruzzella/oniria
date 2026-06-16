// Popola il database con dati di sviluppo. NON eseguire in produzione.

require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  console.error('ERRORE: il seed non puo\' essere eseguito in produzione.');
  process.exit(1);
}

const db     = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS    = 12;
const PASSWORD_DEFAULT = 'Test1234!';

const seedTransaction = db.transaction(() => {

  // --- Pulizia (ordine rispetta FK) ---
  db.exec('DELETE FROM sogni_correlati');
  db.exec('DELETE FROM sogni_emozioni');
  db.exec('DELETE FROM sogni_tag');
  db.exec('DELETE FROM sogni');
  db.exec('DELETE FROM tag');
  db.exec('DELETE FROM emozioni');
  db.exec('DELETE FROM utenti');

  // --- Utenti ---
  const hash       = bcrypt.hashSync(PASSWORD_DEFAULT, SALT_ROUNDS);
  const stmtUtente = db.prepare('INSERT INTO utenti (username, email, nome, bio, password) VALUES (?, ?, ?, ?, ?)');

  const utenti = [
    { username: 'elena',  email: 'elena@test.it',  nome: 'Elena Rossi',   bio: 'Sognatrice seriale' },
    { username: 'marco',  email: 'marco@test.it',  nome: 'Marco Bianchi', bio: '' },
    { username: 'giulia', email: 'giulia@test.it', nome: 'Giulia Verdi',  bio: 'Amo i sogni lucidi' },
  ];

  const utenteIds = [];
  for (const u of utenti) {
    const info = stmtUtente.run(u.username, u.email, u.nome, u.bio, hash);
    utenteIds.push(info.lastInsertRowid);
  }

  // --- Tag ---
  const stmtTag = db.prepare('INSERT INTO tag (nome) VALUES (?)');
  const tagNomi = ['mare', 'scala', 'volare', 'esame', 'porta', 'treno', 'notte', 'casa', 'foresta', 'acqua', 'luce', 'cadere', 'correre', 'animale', 'specchio'];
  const tagIds  = {};
  for (const nome of tagNomi) {
    const info = stmtTag.run(nome);
    tagIds[nome] = info.lastInsertRowid;
  }

  // --- Emozioni ---
  const stmtEmozione = db.prepare('INSERT INTO emozioni (nome) VALUES (?)');
  const emoNomi = ['ansia', 'gioia', 'paura', 'nostalgia', 'stupore', 'tristezza', 'serenita', 'confusione', 'euforia', 'rabbia'];
  const emoIds  = {};
  for (const nome of emoNomi) {
    const info = stmtEmozione.run(nome);
    emoIds[nome] = info.lastInsertRowid;
  }

  // --- Sogni ---
  const stmtSogno    = db.prepare('INSERT INTO sogni (utente_id, titolo, descrizione, data_sogno, intensita, pubblico) VALUES (?, ?, ?, ?, ?, ?)');
  const stmtSognoTag = db.prepare('INSERT INTO sogni_tag (sogno_id, tag_id) VALUES (?, ?)');
  const stmtSognoEmo = db.prepare('INSERT INTO sogni_emozioni (sogno_id, emozione_id) VALUES (?, ?)');

  const sogni = [
    {
      utente: 0,
      titolo: 'La scala infinita',
      desc: 'Salivo una scala a chiocciola che non finiva mai. I gradini diventavano sempre più stretti. In cima c\'era una porta chiusa a chiave.',
      data: '2026-06-01', intensita: 4, pubblico: 1,
      tag: ['scala', 'notte', 'casa', 'porta'], emozioni: ['ansia', 'confusione'],
    },
    {
      utente: 0,
      titolo: 'Volo sul mare',
      desc: 'Volavo sopra un mare calmo e azzurro. Le onde erano lente. Ad un certo punto ho iniziato a scendere ma non avevo paura.',
      data: '2026-06-05', intensita: 2, pubblico: 1,
      tag: ['mare', 'volare', 'acqua'], emozioni: ['serenita', 'stupore'],
    },
    {
      utente: 0,
      titolo: 'L\'esame impossibile',
      desc: 'Ero in un\'aula universitaria. Il foglio dell\'esame era scritto in una lingua sconosciuta. Tutti gli altri scrivevano tranquillamente.',
      data: '2026-06-08', intensita: 5, pubblico: 0,
      tag: ['esame', 'porta'], emozioni: ['ansia', 'paura'],
    },
    {
      utente: 0,
      titolo: 'La porta in cima alla scala',
      desc: 'Salivo una scala strettissima fino a una porta illuminata. Ogni piano sembrava uguale al precedente e avevo la sensazione di essere già stata lì.',
      data: '2026-06-09', intensita: 4, pubblico: 0,
      tag: ['scala', 'porta', 'casa'], emozioni: ['ansia', 'stupore'],
    },
    {
      utente: 1,
      titolo: 'Il treno senza destinazione',
      desc: 'Ero su un treno che attraversava una pianura infinita. Non c\'erano fermate segnalate. I passeggeri dormivano tutti.',
      data: '2026-06-02', intensita: 3, pubblico: 1,
      tag: ['treno', 'notte'], emozioni: ['nostalgia', 'confusione'],
    },
    {
      utente: 1,
      titolo: 'La foresta luminosa',
      desc: 'Camminavo in una foresta dove gli alberi emettevano luce propria. C\'era un sentiero dorato che portava ad una radura.',
      data: '2026-06-10', intensita: 2, pubblico: 1,
      tag: ['foresta', 'luce'], emozioni: ['stupore', 'gioia'],
    },
    {
      utente: 2,
      titolo: 'Caduta infinita',
      desc: 'Cadevo da un palazzo altissimo ma non arrivavo mai a terra. L\'aria era calda. Vedevo le finestre sfilare una dopo l\'altra.',
      data: '2026-06-03', intensita: 4, pubblico: 0,
      tag: ['cadere', 'casa'], emozioni: ['paura', 'ansia'],
    },
    {
      utente: 2,
      titolo: 'Lo specchio parlante',
      desc: 'Mi guardavo allo specchio ma il riflesso faceva cose diverse da me. Ad un certo punto ha iniziato a parlare.',
      data: '2026-06-07', intensita: 3, pubblico: 1,
      tag: ['specchio', 'casa'], emozioni: ['stupore', 'confusione'],
    },
    {
      utente: 2,
      titolo: 'Correre senza muoversi',
      desc: 'Correvo più veloce che potevo ma restavo sempre nello stesso punto. Il pavimento era di sabbia.',
      data: '2026-06-11', intensita: 5, pubblico: 1,
      tag: ['correre', 'mare'], emozioni: ['ansia', 'rabbia'],
    },
  ];

  const sognoIds = [];
  for (const s of sogni) {
    const info = stmtSogno.run(utenteIds[s.utente], s.titolo, s.desc, s.data, s.intensita, s.pubblico);
    const sognoId = info.lastInsertRowid;
    sognoIds.push(sognoId);
    for (const t of s.tag) stmtSognoTag.run(sognoId, tagIds[t]);
    for (const e of s.emozioni) stmtSognoEmo.run(sognoId, emoIds[e]);
  }

  // --- Correlazione di esempio: sogno 0 (scala) <-> sogno 2 (esame) ---
  const minId = Math.min(sognoIds[0], sognoIds[2]);
  const maxId = Math.max(sognoIds[0], sognoIds[2]);
  db.prepare('INSERT OR IGNORE INTO sogni_correlati (sogno_id, correlato_id) VALUES (?, ?)').run(minId, maxId);

  console.log('✓ Seed completato:');
  console.log('  ' + utenti.length + ' utenti (password: ' + PASSWORD_DEFAULT + ')');
  console.log('  ' + sogni.length + ' sogni');
  console.log('  ' + tagNomi.length + ' tag');
  console.log('  ' + emoNomi.length + ' emozioni');
  console.log('\nAccount di test:');
  for (const u of utenti) {
    console.log('  ' + u.username + ' / ' + PASSWORD_DEFAULT);
  }
});

seedTransaction();
