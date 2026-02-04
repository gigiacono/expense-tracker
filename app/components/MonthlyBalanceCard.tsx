'use client'

import { useState, useEffect } from 'react'
import { MonthlyBalance } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type MonthlyBalanceCardProps = {
    transactionsTotal: { income: number; expense: number }
    onUpdate?: () => void
}

const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function MonthlyBalanceCard({ transactionsTotal, onUpdate }: MonthlyBalanceCardProps) {
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

            setBalance(data)
            if (data) {
                setStartingBalance(data.starting_balance?.toString() || '')
                setEndingBalance(data.ending_balance?.toString() || '')
            } else {
                setStartingBalance('')
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
            const data = {
                year,
                month,
                starting_balance: startingBalance ? parseFloat(startingBalance) : null,
                ending_balance: endingBalance ? parseFloat(endingBalance) : null,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('monthly_balances')
                .upsert(data, { onConflict: 'year,month' })

            if (error) throw error

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
        if (month === 1) {
            setMonth(12)
            setYear(year - 1)
        } else {
            setMonth(month - 1)
        }
    }

    const nextMonth = () => {
        if (month === 12) {
            setMonth(1)
            setYear(year + 1)
        } else {
            setMonth(month + 1)
        }
    }

    // Calcoli
    const expectedChange = transactionsTotal.income - transactionsTotal.expense
    const actualChange = (balance?.ending_balance ?? 0) - (balance?.starting_balance ?? 0)
    const difference = actualChange - expectedChange

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📊 Saldo Mensile
            </h2>

            {/* Month Selector */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    ◀
                </button>
                <span className="text-lg font-medium text-gray-900">
                    {MONTH_NAMES[month - 1]} {year}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    ▶
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Balance Inputs */}
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saldo Inizio Mese (€)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={startingBalance}
                            onChange={(e) => setStartingBalance(e.target.value)}
                            placeholder="Es: 1500.00"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saldo Fine Mese (€)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={endingBalance}
                            onChange={(e) => setEndingBalance(e.target.value)}
                            placeholder="Es: 1200.00"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Salvataggio...' : '✓ Salva'}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Balance Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Saldo Inizio</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {balance?.starting_balance != null
                                    ? `€${balance.starting_balance.toFixed(2)}`
                                    : '—'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Saldo Fine</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {balance?.ending_balance != null
                                    ? `€${balance.ending_balance.toFixed(2)}`
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Expected vs Actual */}
                    {balance?.starting_balance != null && balance?.ending_balance != null && (
                        <div className="border-t pt-4 mt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Variazione Attesa</p>
                                    <p className={`font-semibold ${expectedChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {expectedChange >= 0 ? '+' : ''}€{expectedChange.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Variazione Reale</p>
                                    <p className={`font-semibold ${actualChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {actualChange >= 0 ? '+' : ''}€{actualChange.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {difference !== 0 && (
                                <div className={`mt-3 p-3 rounded-lg ${difference > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                    <p className={`text-sm ${difference > 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {difference > 0
                                            ? `🎉 Hai risparmiato €${difference.toFixed(2)} in più del previsto!`
                                            : `⚠️ Mancano €${Math.abs(difference).toFixed(2)} rispetto alle transazioni registrate.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ✏️ {balance ? 'Modifica Saldi' : 'Inserisci Saldi'}
                    </button>
                </div>
            )}
        </div>
    )
}
