// Tipi condivisi per l'app

export type Transaction = {
  id: string
  revolut_id?: string
  date: string
  description: string
  amount: number
  currency: string
  category: string | null
  category_id: string | null
  type: 'expense' | 'income'
  is_manual: boolean
  created_at: string
}

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export type MerchantRule = {
  id: string
  merchant_pattern: string
  category_id: string
  category?: Category
  created_at: string
}

export type MonthlyBalance = {
  id: string
  year: number
  month: number
  starting_balance: number | null
  ending_balance: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Tipo per transazione da Excel Revolut (prima del parsing)
export type RevolutTransaction = {
  Type: string
  Product: string
  'Started Date': string
  'Completed Date': string
  Description: string
  Amount: number
  Fee: number
  Currency: string
  State: string
  Balance: number
}
