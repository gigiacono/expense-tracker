# 💰 Expense Tracker

Un'applicazione moderna per il tracciamento delle spese personali, costruita con Next.js 16, Supabase e TailwindCSS.

**Live Demo**: [expense-tracker-chi-gray.vercel.app](https://expense-tracker-chi-gray.vercel.app/)

![Expense Tracker Screenshot](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase) ![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)

---

## ✨ Funzionalità

### 📤 Import Excel Revolut
- Carica file Excel/CSV esportati da Revolut
- Drag & drop o click per selezionare file
- Anteprima transazioni prima dell'import
- Gestione automatica duplicati

### 🏷️ Sistema Categorie
- Crea, modifica ed elimina categorie personalizzate
- Icone e colori personalizzabili
- Categorie predefinite: Spesa, Trasporti, Casa, Ristoranti, Shopping, Salute, Intrattenimento

### 🔗 Auto-categorizzazione (Regole Enti)
- Associa parole chiave a categorie (es: "AMAZON" → Shopping)
- Applica automaticamente a transazioni esistenti
- Categorizzazione automatica su nuovi import

### ✏️ Inserimento Manuale Spese
- Form completo per transazioni manuali
- Selezione tipo: Spesa o Entrata
- Data, descrizione, importo e categoria

### 📊 Saldo Mensile
- Inserisci saldo inizio e fine mese
- Confronto variazione attesa vs reale
- Navigazione tra mesi
- Rileva discrepanze tra transazioni registrate e saldo reale

---

## 🚀 Getting Started

### Prerequisiti
- Node.js 18+
- Account Supabase
- (Opzionale) Account Vercel per deploy

### Installazione

1. **Clona il repository**
```bash
git clone https://github.com/gigiacono/expense-tracker.git
cd expense-tracker
```

2. **Installa dipendenze**
```bash
npm install
```

3. **Configura variabili d'ambiente**

Crea un file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
N8N_API_KEY=your_api_key
```

4. **Setup Database**

Esegui lo script SQL in `database/migration.sql` nel SQL Editor di Supabase.

5. **Avvia in development**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Struttura Database

### Tabelle

| Tabella | Descrizione |
|---------|-------------|
| `transactions` | Transazioni (spese/entrate) |
| `categories` | Categorie personalizzabili |
| `merchant_rules` | Regole auto-categorizzazione |
| `monthly_balances` | Saldi mensili |

### Schema
Vedi [`database/migration.sql`](database/migration.sql) per lo schema completo.

---

## 📁 Struttura Progetto

```
expense-tracker/
├── app/
│   ├── api/
│   │   └── import/          # API per import transazioni
│   ├── components/
│   │   ├── CategoryManager.tsx
│   │   ├── ExcelUploader.tsx
│   │   ├── MerchantRuleManager.tsx
│   │   ├── MonthlyBalanceCard.tsx
│   │   └── TransactionForm.tsx
│   ├── layout.tsx
│   └── page.tsx             # Pagina principale
├── lib/
│   ├── supabase.ts          # Client Supabase
│   └── types.ts             # TypeScript types
├── database/
│   └── migration.sql        # Script migrazione DB
└── public/                  # Assets statici
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS 4
- **Excel Parsing**: xlsx
- **Deploy**: Vercel
- **Language**: TypeScript

---

## 📝 Changelog

### v1.3.1 (04/02/2026)
- 📅 **Raggruppamento Giornaliero**: Lista transazioni divisa per giorno con totale netto giornaliero
- 🎨 **UI Cleanup**: Spostato Debug Log in Impostazioni per una Home più pulita
- ➖ **Formattazione**: Migliorata visualizzazione spese negative (es: -€50.00)

### v1.3.0 (04/02/2026)
- ➕ **Menu Unificato**: Nuovo FAB button per Add Manuale e Import File
- 📈 **Nuovo Chart**: Area Chart SVG per visualizzare l'andamento del saldo annuale
- 🧹 **Filtri Avanzati**: Esclusione automatica interessi e giroconti (Conto Deposito, Ricariche)
- ⚡️ **Real-time Sync**: Aggiornamento immediato dei grafici alla modifica dei saldi
- 📋 **Nuove Categorie**: Lista estesa a 20 categorie personalizzate

### v1.1.2 (04/02/2026)
- ✨ **Aggiornamento Intelligente Categorie**: Applicando una categoria, l'app propone di aggiornare tutte le transazioni simili e creare una regola futura
- 🧹 **Elimina Tutto**: Nuova "Zona Pericolo" in Impostazioni per resettare il database
- 🔍 **Rilevamento Duplicati Migliorato**: ID transazioni basati su timestamp preciso e saldo per evitare falsi positivi
- 🇮🇹 **Supporto CSV Italiano**: Riconoscimento automatico colonne Revolut in italiano
- 🎨 **Miglioramenti UI**: Input più leggibili e fix minori

### v1.1.0 (04/02/2026)
- ✅ Import Excel Revolut con drag & drop
- ✅ Sistema categorie con icone e colori
- ✅ Regole auto-categorizzazione per enti
- ✅ Inserimento manuale transazioni
- ✅ Gestione saldi mensili
- ✅ Tema scuro con gradienti
- ✅ Pannello debug log

### v1.0.0
- Dashboard base con totali
- Lista transazioni
- API import

---

## 🤝 Contributing

1. Fork il repository
2. Crea un branch (`git checkout -b feature/nuova-funzionalita`)
3. Commit (`git commit -m 'Aggiunge nuova funzionalità'`)
4. Push (`git push origin feature/nuova-funzionalita`)
5. Apri una Pull Request

---

## 📄 License

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

Sviluppato con ❤️ usando Next.js e Supabase
