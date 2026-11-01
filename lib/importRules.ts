// Regole condivise per l'import degli estratti conto Revolut (CSV/Excel e PDF)

export type ParsedTransaction = {
  date: string
  description: string
  amount: number
  currency: string
  type: 'expense' | 'income'
  revolut_id: string
}

/**
 * Ritorna true se la transazione va esclusa dall'import:
 * interessi, spostamenti interni (risparmi, pocket, conto deposito, ricariche) e prelievi ATM.
 */
export function isExcludedTransaction(description: string, type = ''): boolean {
  const desc = description.toUpperCase()
  const t = type.toUpperCase()

  // 1. Escludi interessi
  const isInterest = desc.includes('INTERESSI') || desc.includes('INTEREST')

  // 2. Escludi spostamenti interni (risparmi, salvadanai, etc)
  const isInternalTransfer =
    desc.includes('SAVINGS') ||
    desc.includes('RISPARMI') ||
    desc.includes('SALVADANAIO') ||
    desc.includes('POCKET') ||
    desc.includes('VAULT') ||
    desc.includes('TO MY ACCOUNT') ||
    desc.includes('FROM MY ACCOUNT') ||
    desc.includes('CONTO DEPOSITO') ||
    desc.includes('RICARICA DI')

  // 3. Escludi prelievi contanti (ATM)
  const isCashWithdrawal =
    t === 'ATM' ||
    desc.includes('ATM') ||
    desc.includes('PRELIEVO') ||
    desc.includes('CASH WITHDRAWAL') ||
    desc.includes('SPORTELLO')

  return isInterest || isInternalTransfer || isCashWithdrawal
}
