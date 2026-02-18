'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Transaction, Category, MerchantRule, MonthlyBalance } from '@/lib/types'
import { Settings, LogOut, Upload, FileText, Smartphone, ChevronLeft, ChevronRight, Edit2, Filter } from 'lucide-react'

// Components
import BottomNav from './components/BottomNav'
import SpendingCard from './components/SpendingCard'
import TrendChart from './components/TrendChart'
import CategoryPieChart from './components/CategoryPieChart'
import TransactionItem from './components/TransactionItem'
import AddTransactionModal from './components/AddTransactionModal'
import BulkCategoryModal from './components/BulkCategoryModal'

// Legacy Components (kept for Account/Settings tab)
import CategoryManager from './components/CategoryManager'
import MerchantRuleManager from './components/MerchantRuleManager'
import ExcelUploader from './components/ExcelUploader'
import EditTransactionModal from './components/EditTransactionModal'

type Tab = 'home' | 'transactions' | 'recurring' | 'account'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<MerchantRule[]>([])
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([])

  // Edit State
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)

  // Category Filter State
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)

  // Fetch Logic
  const fetchData = useCallback(async () => {
    try {
      const [transRes, catsRes, rulesRes, balRes] = await Promise.all([
        supabase.from('transactions').select('*, categories(id, name, icon, color)').order('date', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('merchant_rules').select('*'),
        supabase.from('monthly_balances').select('*')
      ])

      if (transRes.data) setTransactions(transRes.data)
      if (catsRes.data) setCategories(catsRes.data)
      if (rulesRes.data) setRules(rulesRes.data)
      if (balRes.data) setMonthlyBalances(balRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Navigation Logic
  const changeMonth = (increment: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + increment)
      return newDate
    })
  }

  // Filter Transactions by Selected Month
  const currentMonth = selectedDate.getMonth()
  const currentYear = selectedDate.getFullYear()

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // Calculate Totals for Selected Month
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const currentBalance = totalIncome - totalExpense

  // --- Views ---

  const renderHome = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header with Month Nav */}
      <header className="flex justify-between items-center py-4 bg-slate-950/80 sticky top-0 z-20 backdrop-blur-md -mx-6 px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white capitalize min-w-[140px] text-center">
            {selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      <SpendingCard
        balance={currentBalance}
        income={totalIncome}
        expense={totalExpense}
      />

      <CategoryPieChart
        transactions={filteredTransactions}
        categories={categories}
      />

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-semibold text-slate-200">Recenti</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-emerald-500 text-xs font-medium hover:text-emerald-400"
          >
            Vedi tutti
          </button>
        </div>
        <div className="space-y-3">
          {filteredTransactions.slice(0, 5).map(t => (
            <TransactionItem
              key={t.id}
              transaction={t}
              category={categories.find(c => c.id === t.category_id)}
              onClick={() => setTransactionToEdit(t)}
            />
          ))}
          {filteredTransactions.length === 0 && (
            <p className="text-slate-500 text-center text-sm py-4">Nessuna transazione questo mese.</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderTransactions = () => {
    // Apply category filter
    const displayTransactions = filterCategoryId === 'uncategorized'
      ? filteredTransactions.filter(t => !t.category_id)
      : filterCategoryId
        ? filteredTransactions.filter(t => t.category_id === filterCategoryId)
        : filteredTransactions

    // Calculate totals for displayed transactions
    const displayExpense = displayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const displayIncome = displayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    // Group by date
    const grouped = displayTransactions.reduce((acc, t) => {
      const date = t.date.split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(t)
      return acc
    }, {} as Record<string, Transaction[]>)

    // Categories present in this month's transactions (for filter chips)
    const usedCategoryIds = [...new Set(filteredTransactions.map(t => t.category_id).filter(Boolean))]
    const usedCategories = categories.filter(c => usedCategoryIds.includes(c.id))

    return (
      <div className="space-y-4 pb-24 animate-in fade-in duration-300">

        {/* Header with Actions */}
        <div className="flex justify-between items-center pt-2 sticky top-0 bg-slate-950/95 py-4 z-20 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white">Transazioni</h2>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-purple-500/20"
          >
            <Edit2 size={12} /> Modifica Massiva
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 bg-slate-900 mx-auto w-fit px-4 py-2 rounded-full border border-slate-800">
          <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
          <span className="text-sm font-bold text-slate-200 capitalize w-32 text-center">
            {selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
        </div>

        {/* Totals Card */}
        <div className="flex gap-3">
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-red-400 uppercase tracking-wider font-medium">Spese</p>
            <p className="text-lg font-bold text-red-400">€{displayExpense.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Entrate</p>
            <p className="text-lg font-bold text-emerald-400">€{displayIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Category Filter Chips */}
        {usedCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            <button
              onClick={() => setFilterCategoryId(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filterCategoryId === null
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
            >
              Tutte
            </button>
            {usedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filterCategoryId === cat.id
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={() => setFilterCategoryId(filterCategoryId === 'uncategorized' ? null : 'uncategorized')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filterCategoryId === 'uncategorized'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
            >
              ❓ Non categorizzati
            </button>
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p>Nessuna transazione in questo periodo.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((sum, t) => sum + t.amount, 0)
            return (
              <div key={date}>
                <div className="flex justify-between items-center sticky top-16 bg-slate-950 py-2 z-10 opacity-90 mb-3">
                  <h3 className="text-slate-500 text-xs font-bold uppercase">
                    {new Date(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <span className={`text-xs font-bold ${dayTotal < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {dayTotal < 0 ? '' : '+'}€{Math.abs(dayTotal).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map(t => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      category={categories.find(c => c.id === t.category_id)}
                      onClick={() => setTransactionToEdit(t)}
                    />
                  ))}
                </div>
              </div>
            )
          }))}
      </div>
    )
  }

  const renderRecurring = () => {
    const recurring = transactions.filter(t => t.is_recurring)
    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-white mb-2 pt-2">Spese Ricorrenti</h2>
        <p className="text-slate-400 text-sm mb-6">Transazioni segnate come ripetitive</p>

        {recurring.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Settings className="mx-auto mb-3 opacity-20" size={48} />
            <p>Nessuna spesa ricorrente attiva</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurring.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                category={categories.find(c => c.id === t.category_id)}
                onClick={() => setTransactionToEdit(t)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAccount = () => (
    <div className="space-y-8 pb-24 animate-in fade-in duration-300">
      <header className="flex items-center gap-4 mb-8 pt-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
          LI
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Luigi Iacono</h2>
          <p className="text-slate-400 text-sm">Account Premium</p>
        </div>
      </header>

      {/* Trend Chart */}
      <section className="mb-6">
        <TrendChart
          transactions={transactions}
          currentDate={selectedDate}
          monthlyBalances={monthlyBalances}
        />
      </section>

      {/* Categories & Rules */}
      <section className="space-y-6">
        <h3 className="font-semibold text-white mb-4">Gestione</h3>
        <CategoryManager
          categories={categories}
          onUpdate={fetchData}
        />
        <MerchantRuleManager
          rules={rules}
          categories={categories}
          onUpdate={fetchData}
          onTransactionsUpdated={fetchData}
        />
      </section>

      {/* Danger Zone */}
      <section className="bg-red-900/10 rounded-2xl p-6 border border-red-900/30">
        <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
          <LogOut size={18} /> Zona Pericolo
        </h3>
        <button
          onClick={async () => {
            if (confirm('Eliminare TUTTO?')) {
              await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
              fetchData()
            }
          }}
          className="w-full py-3 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Reset Totale Database
        </button>
      </section>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      <div className="max-w-md mx-auto p-6">

        {/* View Switcher */}
        {activeTab === 'home' && renderHome()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'recurring' && renderRecurring()}
        {activeTab === 'account' && renderAccount()}

      </div>

      {/* Modals */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        categories={categories}
      />

      <BulkCategoryModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        categories={categories}
        onSuccess={fetchData}
      />

      <EditTransactionModal
        isOpen={!!transactionToEdit}
        transaction={transactionToEdit}
        categories={categories}
        onClose={() => setTransactionToEdit(null)}
        onSuccess={() => {
          fetchData()
          setTransactionToEdit(null)
        }}
        onDelete={() => {
          fetchData()
          setTransactionToEdit(null)
        }}
      />
    </main>
  )
}
