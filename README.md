# Oniria

Applicazione web server-rendered per archiviare sogni in un diario personale, mantenerli
privati di default, esplorare ricorrenze tramite tag ed emozioni e condividere una parte
dei contenuti in un'area pubblica anonima.

Il progetto è sviluppato come monolite Express con view EJS, persistenza SQLite e export
PDF dell'archivio personale.

---

## Demo e dati di test

In locale puoi registrare un nuovo account oppure popolare il database con dati demo:

```bash
npm run seed
```

Credenziali seed:

| Utente | Password | Note |
|--------|----------|------|
| `elena` | `Test1234!` | Profilo con sogni pubblici e privati |
| `marco` | `Test1234!` | Profilo con sogni pubblici |
| `giulia` | `Test1234!` | Profilo con sogni pubblici e privati |

Il seed crea anche tag, emozioni e una correlazione di esempio tra sogni, così l'app è
subito esplorabile sia nell'area privata sia nella sezione pubblica.

### Primo utilizzo

1. Clona il repository ed entra nella cartella del progetto
2. Installa le dipendenze con `npm install`
3. Copia `.env.example` in `.env`
4. Imposta un `SESSION_SECRET` di almeno 32 caratteri
5. Compila il CSS con `npm run build:css`
6. Avvia il server con `npm start`
7. Apri `http://localhost:3000`
8. Registrati oppure esegui `npm run seed` e accedi con un account demo

Alla root `/` l'app:

- reindirizza a `/sogni` se l'utente è autenticato
- mostra l'esplora pubblica se non esiste una sessione attiva

---

## Prerequisiti

- Node.js >= 20
- npm

---

## Installazione

```bash
git clone <url-repository>
cd oniria
npm install
cp .env.example .env
npm run build:css
```

Aggiorna poi `.env` con un segreto di sessione valido. Senza `SESSION_SECRET` di almeno
32 caratteri l'app termina all'avvio.

Se vuoi caricare dati demo:

```bash
npm run seed
```

La directory `data/` viene creata automaticamente al primo avvio del database.

---

## Avvio

- `npm start` avvia il server su `http://localhost:3000`, salvo override tramite `PORT`
- `npm run dev` avvia il server con `nodemon`
- `npm run watch:css` ricompila il CSS Tailwind in watch mode

---

## Script disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm start` | Avvia l'applicazione (`node src/app.js`) |
| `npm run dev` | Avvia l'applicazione in sviluppo con reload automatico |
| `npm run seed` | Popola il database con utenti, sogni, tag ed emozioni demo |
| `npm run build:css` | Compila Tailwind CSS in `src/public/css/output.css` |
| `npm run watch:css` | Compila Tailwind CSS in modalità watch |

---

## Configurazione

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `NODE_ENV` | `development` | Ambiente di esecuzione |
| `PORT` | `3000` | Porta HTTP del server |
| `SESSION_SECRET` | nessuno | Segreto obbligatorio per firmare la sessione |
| `DB_PATH` | `./data/oniria.db` | Percorso del database SQLite applicativo |

Dettagli runtime:

- il database SQLite usa `better-sqlite3` con `WAL`, `foreign_keys = ON` e schema creato in modo idempotente all'avvio
- le sessioni sono persistite in SQLite tramite `connect-sqlite3` nel file `data/sessions.db`
- in produzione il cookie di sessione viene marcato `secure`

---

## Funzionalità

### Area privata

- registrazione, login, logout e cambio password
- archivio personale dei sogni con visibilità privata di default
- creazione, modifica, cancellazione e visualizzazione dettaglio dei sogni
- gestione di tag ed emozioni associati a ogni sogno
- intensità del sogno su scala da 1 a 5
- marcatura opzionale dei sogni come pubblici
- correlazione manuale tra sogni simili
- export PDF dell'archivio personale

### Analisi personale

- statistiche personali accessibili in `/statistiche`
- lettura dei pattern attraverso tag, emozioni e ricorrenze nel diario

### Area pubblica

- esplorazione anonima dei sogni condivisi in `/esplora`
- landing `/` con accesso diretto all'esplora pubblica per utenti non autenticati

---

## Rotte principali

| Percorso | Descrizione |
|----------|-------------|
| `/` | Home: redirect a `/sogni` oppure esplora pubblica |
| `/auth/login` | Login |
| `/auth/registra` | Registrazione |
| `/auth/cambia-password` | Cambio password |
| `/esplora` | Archivio pubblico anonimo |
| `/sogni` | Archivio privato autenticato |
| `/sogni/nuovo` | Creazione di un nuovo sogno |
| `/sogni/:id` | Dettaglio di un sogno personale |
| `/sogni/:id/modifica` | Modifica di un sogno |
| `/sogni/esporta-pdf` | Export PDF dei sogni |
| `/statistiche` | Dashboard statistiche personali |

---

## Struttura del progetto

```text
src/
├── app.js
├── config/
├── controllers/
├── db/
├── helpers/
├── middleware/
├── public/
│   ├── css/
│   └── js/
├── repositories/
├── routes/
├── services/
└── views/
```

Organizzazione logica:

- `app.js` configura middleware, sessioni, security headers, route ed error handling
- `config/database.js` inizializza SQLite, pragma e schema DDL
- `routes/` definisce gli endpoint HTTP dell'app
- `controllers/` orchestra request, response e validazioni
- `services/` contiene logica applicativa e generazione PDF
- `repositories/` incapsula accesso e query al database
- `middleware/` gestisce autenticazione, ownership e variabili condivise per le view
- `views/` contiene template EJS e partial server-rendered
- `public/` ospita asset statici, CSS compilato e JavaScript client-side leggero
