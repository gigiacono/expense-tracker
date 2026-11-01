import type { ParsedTransaction } from './importRules'

// Parser per l'estratto conto PDF di Revolut ("Estratto conto in EUR").
// Legge solo la tabella "Transazioni del conto dal giorno ... al giorno ...":
// le sezioni stornate, Pocket e deposito vengono ignorate.

export type PdfTextItem = { str: string; x: number; y: number; width: number }

// Una "cella": testo contiguo sulla stessa riga, con la sua x di partenza
type Segment = { text: string; x: number }

type Columns = { outX: number; inX: number; balanceX: number }

const MONTHS: Record<string, number> = {
  gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12,
  jan: 1, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, dec: 12,
}

const DATE_RE = /^(\d{1,2}) (\p{L}{3})\p{L}*\.? (\d{4})$/u
const AMOUNT_RE = /^-?[\d.,]+\s?(€|[A-Z]{3})?$/
const ID_RE = /^(?:ID transazione|Transaction ID):\s*(\S+)/i
const DETAIL_RE = /^(A|Da|Carta|Riferimento|To|From|Card|Reference):/
const FOOTER_RE = /^(Segnala carta|©)/

/** Estrae il testo di ogni pagina con le coordinate, usando il modulo pdfjs passato. */
export async function extractPdfPages(
  pdfjs: typeof import('pdfjs-dist'),
  data: ArrayBuffer
): Promise<PdfTextItem[][]> {
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  const pages: PdfTextItem[][] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items: PdfTextItem[] = []
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      items.push({ str: item.str, x: item.transform[4], y: item.transform[5], width: item.width })
    }
    pages.push(items)
  }
  await loadingTask.destroy()
  return pages
}

/** Raggruppa gli elementi di una pagina in righe (dall'alto verso il basso) e poi in celle. */
function toLines(items: PdfTextItem[]): Segment[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: PdfTextItem[][] = []
  for (const item of sorted) {
    const row = rows[rows.length - 1]
    if (row && Math.abs(row[0].y - item.y) < 3) row.push(item)
    else rows.push([item])
  }

  return rows.map(row => {
    row.sort((a, b) => a.x - b.x)
    const segments: Segment[] = []
    let lastEnd = -Infinity
    for (const item of row) {
      const gap = item.x - lastEnd
      const current = segments[segments.length - 1]
      if (current && gap < 8) {
        current.text += (gap > 0.5 && !current.text.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str
      } else {
        segments.push({ text: item.str, x: item.x })
      }
      lastEnd = item.x + item.width
    }
    return segments.map(s => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }))
  })
}

function parseDate(text: string): string | null {
  const m = text.match(DATE_RE)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase()]
  if (!month) return null
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function parseAmount(text: string): number {
  let s = text.replace(/[^\d.,-]/g, '')
  // Formato italiano "1.900,00" vs inglese "1,900.00"
  if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  return Number(s)
}

export function parseRevolutStatement(pages: PdfTextItem[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  let currency = 'EUR'
  let inAccountSection = false
  let columns: Columns | null = null

  let current: {
    date: string
    description: string
    out?: number
    in?: number
    balance?: number
    id?: string
  } | null = null

  const flush = () => {
    if (!current) return
    const amount = current.out ?? current.in
    if (amount !== undefined && current.description) {
      const cents = Math.round(amount * 100)
      const descHash = current.description.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      transactions.push({
        date: current.date,
        description: current.description,
        amount,
        currency,
        type: current.out !== undefined ? 'expense' : 'income',
        // Revolut fornisce un ID univoco per ogni transazione: lo usiamo per evitare duplicati
        revolut_id: current.id
          ? `rev_${current.id}`
          : `rev_pdf_${current.date}_${cents}_${Math.round((current.balance ?? 0) * 100)}_${descHash}`,
      })
    }
    current = null
  }

  for (const page of pages) {
    for (const segments of toLines(page)) {
      const text = segments.map(s => s.text).join(' ')

      // Intestazione pagina: "Estratto conto in EUR" (un nuovo blocco per ogni valuta)
      const currencyMatch = text.match(/^Estratto conto in ([A-Z]{3})$/)
      if (currencyMatch) {
        if (currencyMatch[1] !== currency) {
          flush()
          currency = currencyMatch[1]
          inAccountSection = false
        }
        continue
      }

      // Titolo di sezione: teniamo solo le transazioni del conto corrente
      if (/^Transazioni\b/.test(text) || /^\S+ transactions from/i.test(text)) {
        flush()
        inAccountSection = /^(Transazioni del conto|Account transactions)/i.test(text)
        continue
      }

      if (!inAccountSection) continue

      // Intestazione tabella (ripetuta su ogni pagina): ricava la posizione delle colonne
      const outHeader = segments.find(s => /^(Denaro in uscita|Money out)$/i.test(s.text))
      const inHeader = segments.find(s => /^(Denaro in entrata|Money in)$/i.test(s.text))
      const balanceHeader = segments.find(s => /^(Saldo|Balance)$/i.test(s.text))
      if (outHeader && inHeader) {
        flush()
        columns = {
          outX: outHeader.x,
          inX: inHeader.x,
          balanceX: balanceHeader?.x ?? inHeader.x + 2 * (inHeader.x - outHeader.x),
        }
        continue
      }

      if (FOOTER_RE.test(text)) {
        flush()
        continue
      }

      if (!columns) continue

      const date = parseDate(segments[0].text)
      if (date) {
        flush()
        current = { date, description: '' }
        const descriptionParts: string[] = []
        for (const seg of segments.slice(1)) {
          if (seg.x >= columns.outX - 10 && AMOUNT_RE.test(seg.text)) {
            const value = parseAmount(seg.text)
            if (seg.x < (columns.outX + columns.inX) / 2) current.out = value
            else if (seg.x < (columns.inX + columns.balanceX) / 2) current.in = value
            else current.balance = value
          } else {
            descriptionParts.push(seg.text)
          }
        }
        current.description = descriptionParts.join(' ')
        continue
      }

      if (!current || current.id) continue

      const idMatch = text.match(ID_RE)
      if (idMatch) {
        current.id = idMatch[1]
      } else if (!DETAIL_RE.test(text) && segments.every(s => s.x < columns!.outX - 10)) {
        // Descrizione lunga andata a capo
        current.description = `${current.description} ${text}`.trim()
      }
    }
  }
  flush()

  return transactions
}
