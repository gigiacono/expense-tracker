'use client'

import { useState, useEffect } from 'react'
import { MonthlyBalance, Transaction } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react'

type MonthlyBalanceCardProps = {
    transactions: Transaction[]
    onUpdate?: () => void
}

const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function MonthlyBalanceCard({ transactions, onUpdate }: MonthlyBalanceCardProps) {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [balance, setBalance] = useState<MonthlyBalance | null>(null)
    const [startingBalance, setStartingBalance] = useState('')
    const [endingBalance, setEndingBalance] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchBalance()
    }, [year, month])

    const fetchBalance = async () => {
        try {
            const { data, error } = await supabase
                .from('monthly_balances')
                .select('*')
                .eq('year', year)
                .eq('month', month)
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (data) {
                setBalance(data)
                setStartingBalance(data.starting_balance?.toString() || '')
                setEndingBalance(data.ending_balance?.toString() || '')
            } else {
                // No record for this month — check previous month's ending_balance
                const prevMonth = month === 1 ? 12 : month - 1
                const prevYear = month === 1 ? year - 1 : year
                const { data: prevData } = await supabase
                    .from('monthly_balances')
                    .select('ending_balance')
                    .eq('year', prevYear)
                    .eq('month', prevMonth)
                    .single()

                if (prevData?.ending_balance != null) {
                    // Auto-set starting balance from previous month
                    setBalance({ year, month, starting_balance: prevData.ending_balance, ending_balance: null } as MonthlyBalance)
                    setStartingBalance(prevData.ending_balance.toString())
                } else {
                    setBalance(null)
                    setStartingBalance('')
                }
                setEndingBalance('')
            }
        } catch (err: any) {
            console.error('Errore fetch balance:', err)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const parsedEnding = endingBalance ? parseFloat(endingBalance) : null

            const data = {
                year,
                month,
                starting_balance: startingBalance ? parseFloat(startingBalance) : null,
                ending_balance: parsedEnding,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('monthly_balances')
                .upsert(data, { onConflict: 'year,month' })

            if (error) throw error

            // Propagate ending balance as next month's starting balance
            if (parsedEnding != null) {
                const nextMonth = month === 12 ? 1 : month + 1
                const nextYear = month === 12 ? year + 1 : year

                // Fetch existing next month record to preserve its ending_balance
                const { data: nextData } = await supabase
                    .from('monthly_balances')
                    .select('*')
                    .eq('year', nextYear)
                    .eq('month', nextMonth)
                    .single()

                await supabase
                    .from('monthly_balances')
                    .upsert({
                        year: nextYear,
                        month: nextMonth,
                        starting_balance: parsedEnding,
                        ending_balance: nextData?.ending_balance ?? null,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'year,month' })
            }

            setIsEditing(false)
            fetchBalance()
            if (onUpdate) onUpdate()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(year - 1) }
        else setMonth(month - 1)
    }

    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(year + 1) }
        else setMonth(month + 1)
    }

    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() + 1 === month && d.getFullYear() === year
    })
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const expectedChange = income - expense

    const accountingBalance = (balance?.starting_balance ?? 0) + expectedChange
    const difference = (balance?.ending_balance ?? 0) - accountingBalance

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-200 text-sm">📊 Saldo Mensile</h3>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25"
                    >
                        <Edit2 size={12} /> {balance ? 'Modifica' : 'Inserisci'}
                    </button>
                )}
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-center gap-4 mb-5 bg-slate-800/50 mx-auto w-fit px-4 py-2 rounded-full border border-slate-700">
                <button onClick={prevMonth} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-slate-200 w-28 text-center">
                    {MONTH_NAMES[month - 1]} {year}
                </span>
                <button onClick={nextMonth} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            {error && (
                <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                    ❌ {error}
                </div>
            )}

            {isEditing ? (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Saldo Inizio Mese (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={startingBalance}
                            onChange={(e) => setStartingBalance(e.target.value)}
                            placeholder="Es: 1500.00"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 outline-none placeholder-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Saldo Fine Mese (Effettivo) (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={endingBalance}
                            onChange={(e) => setEndingBalance(e.target.value)}
                            placeholder="Es: 1200.00"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 outline-none placeholder-slate-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-slate-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                        >
                            <Check size={14} /> {isLoading ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700"
                        >
                            <X size={14} /> Annulla
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Balance Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">Inizio Mese</p>
                            <p className="text-lg font-bold text-slate-200">
                                {balance?.starting_balance != null
                                    ? `€${balance.starting_balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                                    : '—'}
                            </p>
                        </div>
                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                            <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium mb-1">Contabile</p>
                            <p className="text-lg font-bold text-blue-100">
                                {balance?.starting_balance != null
                                    ? `€${accountingBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                                    : '—'}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">Effettivo (Fine)</p>
                            <p className="text-lg font-bold text-slate-200">
                                {balance?.ending_balance != null
                                    ? `€${balance.ending_balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Expected vs Actual */}
                    {balance?.starting_balance != null && balance?.ending_balance != null && (
                        <div className="border-t border-slate-800 pt-4 space-y-3">
                            {difference !== 0 ? (
                                <div className={`p-3 rounded-xl text-xs ${difference > 0
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {difference > 0
                                        ? `🎉 Hai risparmiato €${difference.toLocaleString('it-IT', { minimumFractionDigits: 2 })} in più del previsto (Effettivo > Contabile)`
                                        : `⚠️ Mancano €${Math.abs(difference).toLocaleString('it-IT', { minimumFractionDigits: 2 })} rispetto alle transazioni registrate (Effettivo < Contabile)`}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    ✅ Il saldo effettivo corrisponde perfettamente al saldo contabile!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
