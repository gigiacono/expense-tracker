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
                className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
                title="Aggiungi Transazione"
            >
                <span className="text-2xl">➕</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-slideUp">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        ✏️ Nuova Transazione
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <span className="text-gray-500 text-xl">✕</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Tipo */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`py-3 rounded-xl font-bold transition-all border-2
                  ${type === 'expense'
                                    ? 'bg-red-50 border-red-500 text-red-600'
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            💸 Spesa
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`py-3 rounded-xl font-bold transition-all border-2
                  ${type === 'income'
                                    ? 'bg-green-50 border-green-500 text-green-600'
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            💰 Entrata
                        </button>
                    </div>

                    {/* Data */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Descrizione */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrizione</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Es: Cena al ristorante"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Importo */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Importo (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-bold bg-gray-50 text-gray-900 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 outline-none transition-all appearance-none"
                        >
                            <option value="">Seleziona categoria...</option>
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
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg mt-4"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Transazione'}
                    </button>
                </form>
            </div>
        </div>
    )
}
