'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Transaction, Category, MerchantRule, MonthlyBalance } from '@/lib/types'
import ExcelUploader from './components/ExcelUploader'
import CategoryManager from './components/CategoryManager'
import MerchantRuleManager from './components/MerchantRuleManager'
import TransactionForm from './components/TransactionForm'
import MonthlyBalanceCard from './components/MonthlyBalanceCard'
import MonthlyReport from './components/MonthlyReport'
import TrendChart from './components/TrendChart'

type Tab = 'transactions' | 'import' | 'settings'

type LogEntry = {
  time: string
  type: 'info' | 'success' | 'error'
  message: string
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<MerchantRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('transactions')
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(true)

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const time = new Date().toLocaleTimeString('it-IT')
    setLogs(prev => [...prev, { time, type, message }].slice(-50))
  }, [])

  // New state for month filtering
  const [selectedDate, setSelectedDate] = useState(new Date())

  const changeMonth = (increment: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + increment)
      return newDate
    })
  }

  // New state for balance filtering
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([])

  const deleteTransaction = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa transazione?')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      addLog('success', '🗑️ Transazione eliminata')
      // Update local state immediately
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      addLog('error', `❌ Errore eliminazione: ${err.message}`)
    }
  }

  const fetchTransactions = useCallback(async () => {
    addLog('info', '📥 Fetching transactions...')
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(id, name, icon, color)')
        .order('date', { ascending: false })

      if (error) {
        addLog('error', `❌ Transactions error: ${error.message} (Code: ${error.code})`)
        throw error
      }

      addLog('success', `✅ Loaded ${data?.length || 0} transactions`)
      setTransactions(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('❌ Errore:', err)
    }
  }, [addLog])

  const fetchCategories = useCallback(async () => {
    addLog('info', '📥 Fetching categories...')
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        addLog('error', `❌ Categories error: ${error.message} (Code: ${error.code})`)
        throw error
      }
      addLog('success', `✅ Loaded ${data?.length || 0} categories`)
      setCategories(data || [])
    } catch (err: any) {
      console.error('❌ Errore categorie:', err)
    }
  }, [addLog])

  const fetchRules = useCallback(async () => {
    addLog('info', '📥 Fetching merchant rules...')
    try {
      const { data, error } = await supabase
        .from('merchant_rules')
        .select('*, categories(id, name, icon, color)')
        .order('created_at', { ascending: false })

      if (error) {
        addLog('error', `❌ Rules error: ${error.message} (Code: ${error.code})`)
        throw error
      }
      addLog('success', `✅ Loaded ${data?.length || 0} rules`)
      setRules(data || [])
    } catch (err: any) {
      console.error('❌ Errore regole:', err)
    }
  }, [addLog])

  const fetchMonthlyBalances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')

      if (error) throw error
      setMonthlyBalances(data || [])
    } catch (err) {
      console.error('Error fetching monthly balances:', err)
    }
  }, [])

  useEffect(() => {
    addLog('info', '🚀 App started, loading data...')
    Promise.all([fetchTransactions(), fetchCategories(), fetchRules(), fetchMonthlyBalances()])
      .finally(() => setLoading(false))
  }, [fetchTransactions, fetchCategories, fetchRules, fetchMonthlyBalances, addLog])

  const updateTransactionCategory = async (transaction: Transaction, categoryId: string | null) => {
    try {
      // 1. Aggiorna la singola transazione
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transaction.id)

      if (error) throw error

      setEditingTransaction(null)
      fetchTransactions()

      // 2. Se abbiamo selezionato una categoria, chiedi se applicare a tutte
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId)
        if (category && confirm(`Vuoi applicare la categoria "${category.name}" a tutte le transazioni future di "${transaction.description}"?`)) {
          addLog('info', `🔄 Applicazione regola per "${transaction.description}"...`)

          // Crea regola per il futuro
          const { error: ruleError } = await supabase
            .from('merchant_rules')
            .upsert({
              merchant_pattern: transaction.description,
              category_id: categoryId
            }, { onConflict: 'merchant_pattern' })
            .select()

          if (!ruleError) {
            // Applica a tutte le transazioni passate con la stessa descrizione
            await supabase
              .from('transactions')
              .update({ category_id: categoryId })
              .eq('description', transaction.description)
              .is('category_id', null) // Aggiorna solo quelle non categorizzate? O tutte? Meglio tutte per coerenza.

            // Rimuovo il filtro .is('category_id', null) per forzare l'aggiornamento su tutte
            await supabase
              .from('transactions')
              .update({ category_id: categoryId })
              .eq('description', transaction.description)

            addLog('success', `✅ Regola creata e applicata a tutte le transazioni di "${transaction.description}"`)
            fetchTransactions()
            fetchRules()
          } else {
            console.error('Errore creazione regola:', ruleError)
            addLog('error', `❌ Errore creazione regola: ${ruleError.message}`)
          }
        }
      }

    } catch (err: any) {
      console.error('❌ Errore update:', err)
      addLog('error', `❌ Errore aggiornamento: ${err.message}`)
    }
  }

  const createRuleFromTransaction = async (description: string) => {
    // Estrae la parte significativa della descrizione
    const pattern = description.split(' ').slice(0, 2).join(' ').toUpperCase()

    const categoryId = prompt('Inserisci l\'ID della categoria (puoi copiarlo dalla sezione Impostazioni)')
    if (!categoryId) return

    try {
      const { error } = await supabase
        .from('merchant_rules')
        .insert({ merchant_pattern: pattern, category_id: categoryId })

      if (error) throw error

      // Applica a transazioni esistenti
      await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .ilike('description', `%${pattern}%`)

      fetchTransactions()
      fetchRules()
      alert(`✅ Regola creata: tutte le transazioni contenenti "${pattern}" saranno categorizzate!`)
    } catch (err: any) {
      console.error('❌ Errore regola:', err)
      alert('Errore nella creazione della regola')
    }
  }

  const getCategoryForTransaction = (transaction: any) => {
    if (transaction.categories) {
      return transaction.categories
    }
    if (transaction.category_id) {
      return categories.find(c => c.id === transaction.category_id)
    }
    return null
  }



  // Filter transactions for selected month
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    return tDate.getMonth() === selectedDate.getMonth() &&
      tDate.getFullYear() === selectedDate.getFullYear()
  })

  // Calculate totals based on filtered transactions
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)


  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header with Month Navigation */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              💰 Finance Tracker
            </h1>
            <p className="text-slate-400 mt-2">Gestisci le tue finanze con semplicità</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              ◀️
            </button>
            <h2 className="text-xl font-bold text-white min-w-[160px] text-center capitalize">
              {selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              ▶️
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-6 rounded-2xl">
            <p className="text-red-300 text-sm font-medium">Totale Spese</p>
            <p className="text-4xl font-bold text-white mt-1">
              €{totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-500/20 p-6 rounded-2xl">
            <p className="text-green-300 text-sm font-medium">Totale Entrate</p>
            <p className="text-4xl font-bold text-white mt-1">
              €{totalIncome.toFixed(2)}
            </p>
          </div>
          <div className={`bg-gradient-to-br backdrop-blur-sm border p-6 rounded-2xl ${totalIncome - totalExpenses >= 0
            ? 'from-blue-500/20 to-blue-600/10 border-blue-500/20'
            : 'from-orange-500/20 to-orange-600/10 border-orange-500/20'
            }`}>
            <p className={`text-sm font-medium ${totalIncome - totalExpenses >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
              Bilancio
            </p>
            <p className="text-4xl font-bold text-white mt-1">
              €{(totalIncome - totalExpenses).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Reports Section (only in Transactions tab) */}
        {!loading && !error && activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MonthlyReport
              transactions={filteredTransactions}
              categories={categories}
            />
            <TrendChart
              transactions={transactions}
              currentDate={selectedDate}
              monthlyBalances={monthlyBalances}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl w-fit">
          {[
            { id: 'transactions', label: '📋 Transazioni', icon: '' },
            { id: 'settings', label: '⚙️ Impostazioni', icon: '' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Debug Log Panel */}
        <div className="mb-6">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-2"
          >
            {showLogs ? '🔽' : '▶️'} Debug Log ({logs.length})
          </button>
          {showLogs && (
            <div className="mt-2 bg-slate-900/80 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-500">Nessun log...</p>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`py-1 ${log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                        'text-slate-400'
                      }`}
                  >
                    <span className="text-slate-600">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl text-center border border-slate-700">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 mt-4">Caricamento...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl mb-6">
            ❌ Errore: {error}
          </div>
        )}

        {!loading && !error && activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Manual Transaction Form */}
            <TransactionForm
              categories={categories}
              onSuccess={(date) => {
                fetchTransactions()
                if (date) {
                  setSelectedDate(date)
                  setActiveTab('transactions')
                  addLog('info', `📅 Vista aggiornata: ${date.toLocaleString('it-IT', { month: 'long' })}`)
                }
              }}
            />

            {/* Transactions List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Transazioni ({filteredTransactions.length})
                </h2>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nessuna transazione trovata. Importa un file Excel o aggiungi manualmente!
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredTransactions.map((t) => {
                    const cat = getCategoryForTransaction(t)
                    return (
                      <div key={t.id} className="px-6 py-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">
                                {t.description || 'Nessuna descrizione'}
                              </p>
                              {t.is_manual && (
                                <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                                  manuale
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 text-sm">
                              <span className="text-slate-400">
                                📅 {new Date(t.date).toLocaleDateString('it-IT')}
                              </span>

                              {/* Category Display/Edit */}
                              {editingTransaction === t.id ? (
                                <select
                                  value={t.category_id || ''}
                                  onChange={(e) => updateTransactionCategory(t, e.target.value || null)}
                                  onBlur={() => setEditingTransaction(null)}
                                  autoFocus
                                  className="bg-slate-700 text-white px-2 py-0.5 rounded text-sm border border-slate-600"
                                >
                                  <option value="">Nessuna categoria</option>
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon} {c.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  onClick={() => setEditingTransaction(t.id)}
                                  className={`px-2 py-0.5 rounded text-sm transition-colors ${cat
                                    ? ''
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                    }`}
                                  style={cat ? {
                                    backgroundColor: cat.color + '30',
                                    color: cat.color
                                  } : undefined}
                                >
                                  {cat ? `${cat.icon} ${cat.name}` : '+ Categoria'}
                                </button>
                              )}
                            </div>
                          </div>


                          <div className="text-right ml-4 flex flex-col items-end">
                            <p className={`text-xl font-bold ${t.type === 'expense' ? 'text-red-400' : 'text-green-400'
                              }`}>
                              {t.type === 'expense' ? '-' : '+'}€{Math.abs(t.amount).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-500">{t.currency}</p>
                              <button
                                onClick={() => deleteTransaction(t.id)}
                                className="text-slate-600 hover:text-red-400 transition-colors"
                                title="Elimina transazione"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}



        {!loading && !error && activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CategoryManager
                categories={categories}
                onUpdate={() => fetchCategories()}
              />
              <MerchantRuleManager
                rules={rules}
                categories={categories}
                onUpdate={() => fetchRules()}
                onTransactionsUpdated={() => fetchTransactions()}
              />
            </div>
            <div className="space-y-6">
              <MonthlyBalanceCard
                transactionsTotal={{ income: totalIncome, expense: totalExpenses }}
                onUpdate={fetchMonthlyBalances}
              />

              {/* Danger Zone */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  ☢️ Zona Pericolo
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Queste azioni sono irreversibili. Procedi con cautela.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('SEI SICURO? Questa azione cancellerà TUTTE le transazioni dal database. Non si può annullare.')) {
                      addLog('info', '🗑️ Eliminazione di tutte le transazioni...')
                      try {
                        const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                        if (error) throw error
                        addLog('success', '✅ Tutte le transazioni eliminate')
                        fetchTransactions()
                      } catch (err: any) {
                        addLog('error', `❌ Errore eliminazione: ${err.message}`)
                      }
                    }
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  🗑️ Elimina TUTTE le transazioni
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
