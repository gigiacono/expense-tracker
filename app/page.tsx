'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Transaction = {
  id: string
  revolut_id: string
  date: string
  description: string
  amount: number
  currency: string
  category: string | null
  type: string
  created_at: string
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
        
        if (error) throw error
        
        setTransactions(data || [])
      } catch (err: any) {
        setError(err.message)
        console.error('❌ Errore:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          💰 Expense Tracker
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Totale Spese</p>
            <p className="text-3xl font-bold text-red-600">
              €{totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Totale Entrate</p>
            <p className="text-3xl font-bold text-green-600">
              €{totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Bilancio</p>
            <p className={`text-3xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{(totalIncome - totalExpenses).toFixed(2)}
            </p>
          </div>
        </div>

        {loading && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Caricamento transazioni...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ Errore: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Transazioni ({transactions.length})
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessuna transazione trovata.
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((t) => (
                  <div key={t.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {t.description || 'Nessuna descrizione'}
                        </p>
                        <div className="flex gap-3 mt-1 text-sm text-gray-600">
                          <span>📅 {new Date(t.date).toLocaleDateString('it-IT')}</span>
                          {t.category && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {t.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-lg font-semibold ${
                          t.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {t.type === 'expense' ? '-' : '+'}€{Math.abs(t.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{t.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
