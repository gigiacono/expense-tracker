'use client'

import { useState } from 'react'
import { Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type TransactionFormProps = {
    categories: Category[]
    onSuccess: () => void
}

export default function TransactionForm({ categories, onSuccess }: TransactionFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [categoryId, setCategoryId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim() || !amount) return

        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    date,
                    description: description.trim(),
                    amount: parseFloat(amount),
                    type,
                    category_id: categoryId || null,
                    currency: 'EUR',
                    is_manual: true,
                    revolut_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                })

            if (error) throw error

            // Reset form
            setDescription('')
            setAmount('')
            setCategoryId('')
            setType('expense')
            setIsOpen(false)
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
                ➕ Aggiungi Transazione Manuale
            </button>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    ✏️ Nuova Transazione
                </h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`py-3 rounded-lg font-medium transition-all
              ${type === 'expense'
                                ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        💸 Spesa
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`py-3 rounded-lg font-medium transition-all
              ${type === 'income'
                                ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        💰 Entrata
                    </button>
                </div>

                {/* Data */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                    />
                </div>

                {/* Descrizione */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Es: Cena al ristorante"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                    />
                </div>

                {/* Importo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold bg-white text-gray-900"
                        required
                    />
                </div>

                {/* Categoria */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opzionale)</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                        <option value="">Nessuna categoria</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading || !description.trim() || !amount}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Salvataggio...' : '✓ Salva Transazione'}
                </button>
            </form>
        </div>
    )
}
