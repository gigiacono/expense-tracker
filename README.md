# 💰 Expense Tracker

Un'applicazione moderna per il tracciamento delle spese personali, costruita con **Next.js 16**, **Supabase** e **TailwindCSS 4**.

**Live Demo**: [expense-tracker-chi-gray.vercel.app](https://expense-tracker-chi-gray.vercel.app/)

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase) ![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel) ![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

---

## ✨ Funzionalità Principali

### 🎨 UI Design Overhaul
- **Dark Theme**: Interfaccia scura (`Slate 950`) con accenti verde smeraldo/viola.
- **Mobile First**: Navigazione inferiore fissa (`BottomNav`) ottimizzata per l'uso a una mano.
- **Icone Dinamiche**: Integrazione `Lucide-React` con mapping automatico basato sul nome della categoria (es. Spotify 🎵, Amazon 📦, Motorino 🛵).

### 🔄 Gestione Transazioni Avanzata
- **Navigazione Mensile**: Scorri facilmente tra i mesi con le frecce `< >`.
- **Transazioni Ricorrenti**: Contrassegna le spese fisse (affitto, abbonamenti) per trovarle facilmente.
- **Modifica Massiva**: Assegna categorie a tutte le transazioni in un intervallo di date.
- **Modalità Ibrida**: Aggiungi transazioni manualmente o carica file Excel direttamente dallo stesso modale.

### 📊 Analisi e Visualizzazione
- **Spending Card**: Card riepilogativa con saldo e andamento mensile.
- **Trend Chart**: Grafico ad area con gradiente per visualizzare l'andamento del saldo nel tempo.
- **Lista Intelligente**: Priorità alla categoria per una lettura più veloce, con icone colorate.

### 📤 Import e Automazione
- **Import Excel/Revolut**: Parsing locale dei file CSV/XLSX.
- **Auto-Categorizzazione**: Regole basate su keywords per assegnare categorie automaticamente.

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
```

4. **Setup Database**
Esegui gli script SQL nella cartella `database/` nel SQL Editor di Supabase:
- `migration.sql` (Schema base)
- `add_recurring_col.sql` (Supporto ricorrenze)

5. **Avvia in development**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Struttura Progetto

```
expense-tracker/
├── app/
│   ├── components/
│   │   ├── AddTransactionModal.tsx  # Modale inserimento/upload
│   │   ├── BottomNav.tsx            # Navigazione inferiore
│   │   ├── BulkCategoryModal.tsx    # Modifica massiva
│   │   ├── SpendingCard.tsx         # Card saldo
│   │   ├── TransactionItem.tsx      # Elemento lista
│   │   └── TrendChart.tsx           # Grafico andamento
│   ├── lib/
│   │   ├── categoryIcons.tsx        # Mapping icone Lucide
│   │   └── supabase.ts              # Client DB
│   ├── layout.tsx                   # Layout globale
│   └── page.tsx                     # Dashboard principale
├── database/
│   ├── migration.sql                # Schema iniziale
│   └── add_recurring_col.sql        # Migrazione ricorrenze
└── public/
```

---

## 📝 Changelog Recente

### v2.1.0 (18/02/2026) - Nuove Funzionalità 🚀
- **Elimina Transazione**: Pulsante rosso nel modale di modifica con conferma.
- **Grafico a Torta** 🍩: Donut chart con ripartizione spese per categoria nella Home.
- **Grafico Andamento** spostato nella tab Account.
- **Tab Transazioni**:
  - Totali mensili (Spese + Entrate) in card compatte.
  - Filtro per categoria con chips scrollabili.
  - Filtro "Non categorizzati" per individuare transazioni senza categoria.
  - Totale spese giornaliero per ogni gruppo.
- **SpendingCard**: Spese del mese come numero principale, saldo in basso.
- **Tab Account - Dark Theme**: Tutti i componenti aggiornati al tema scuro.
  - Saldo Mensile con navigazione mese e variazione attesa vs reale.
  - Categorie e Regole Smart con nuovo design.
- **Regole Smart Ridisegnate**: Vista raggruppata per categoria con modale dedicato per gestire keyword (add/delete).
- **Import Excel**: Prelievi contanti (ATM) esclusi automaticamente.
- **Icona App**: Nuova icona personalizzata wallet verde su sfondo navy.

### v2.0.0 (17/02/2026) - UI Overhaul 🎨
- **Complete Redesign**: Passaggio a Dark Theme e layout mobile-app like.
- **New Features**:
  - Month Navigation (< >)
  - **Bulk Edit**: Categorizzazione massiva per data e keyword (Es. "Amazon").
  - **Smart Edit**: Opzione "Ricorda per il futuro" ⚡️ per creare regole automatiche durante la modifica.
  - Recurring Transactions Support.
  - Unified Add/Import Modal (Manuale + Excel).
- **Tech**: Aggiunta `lucide-react`, rimozione vecchi componenti UI.

### v1.3.4 (04/02/2026)
- Edit Mode e Quick Add per transazioni manuali.

---

Sviluppato con ❤️ da Luigi Iacono
