import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction } from './types'

/**
 * Controlla se le transazioni ricorrenti esistono già per il mese corrente.
 * Se mancano, le crea automaticamente copiando il template dalla transazione originale.
 * Ritorna true se sono state generate nuove transazioni (serve per ri-fetchare i dati).
 */
export async function ensureRecurringTransactions(
  transactions: Transaction[],
  supabase: SupabaseClient
): Promise<boolean> {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // 1. Trova tutte le transazioni ricorrenti e deduplica per descrizione+importo+tipo
  //    (tiene la più recente come template)
  const recurringTemplates = new Map<string, Transaction>()

  const recurringTxns = transactions
    .filter(t => t.is_recurring)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  for (const t of recurringTxns) {
    const key = `${t.description.toLowerCase().trim()}_${Math.abs(t.amount)}_${t.type}`
    if (!recurringTemplates.has(key)) {
      recurringTemplates.set(key, t)
    }
  }

  if (recurringTemplates.size === 0) return false

  // 2. Transazioni del mese corrente
  const currentMonthTxns = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // 3. Per ogni template, controlla se esiste già nel mese corrente
  const toInsert: any[] = []

  for (const [key, template] of recurringTemplates) {
    const alreadyExists = currentMonthTxns.some(t => {
      const sameDesc = t.description.toLowerCase().trim() === template.description.toLowerCase().trim()
      const sameAmount = Math.abs(t.amount) === Math.abs(template.amount)
      const sameType = t.type === template.type
      return sameDesc && sameAmount && sameType
    })

    if (!alreadyExists) {
      // Calcola la data: stesso giorno del template, ma nel mese corrente
      const templateDate = new Date(template.date)
      let day = templateDate.getDate()

      // Gestisci mesi con meno giorni (es. 31 in un mese da 30)
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      if (day > lastDayOfMonth) {
        day = lastDayOfMonth
      }

      const newDate = new Date(currentYear, currentMonth, day)

      // ID deterministico per evitare duplicati su ricaricamenti multipli
      const descHash = template.description.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      const amountStr = Math.abs(template.amount * 100).toFixed(0)
      const revolutId = `recurring_${currentYear}_${currentMonth + 1}_${amountStr}_${descHash}`

      toInsert.push({
        revolut_id: revolutId,
        description: template.description,
        amount: template.type === 'expense' ? -Math.abs(template.amount) : Math.abs(template.amount),
        date: newDate.toISOString(),
        type: template.type,
        category_id: template.category_id || null,
        is_manual: true,
        is_recurring: true,
        currency: template.currency || 'EUR'
      })
    }
  }

  if (toInsert.length === 0) return false

  // 4. Inserisci con upsert per sicurezza (ignoraDuplicati)
  const { error } = await supabase
    .from('transactions')
    .upsert(toInsert, {
      onConflict: 'revolut_id',
      ignoreDuplicates: true
    })

  if (error) {
    console.error('❌ Errore generazione ricorrenti:', error)
    return false
  }

  console.log(`🔄 Generate ${toInsert.length} transazioni ricorrenti per ${currentMonth + 1}/${currentYear}`)
  return true
}
