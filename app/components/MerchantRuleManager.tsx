'use client'

import { useState } from 'react'
import { Category, MerchantRule } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type MerchantRuleManagerProps = {
    rules: MerchantRule[]
    categories: Category[]
    onUpdate: () => void
    onTransactionsUpdated: () => void
}

export default function MerchantRuleManager({
    rules,
    categories,
    onUpdate,
    onTransactionsUpdated
}: MerchantRuleManagerProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [pattern, setPattern] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [applyToExisting, setApplyToExisting] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleAdd = async () => {
        if (!pattern.trim() || !selectedCategory) return

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // 1. Crea la regola
            const { error: insertError } = await supabase
                .from('merchant_rules')
                .insert({
                    merchant_pattern: pattern.trim(),
                    category_id: selectedCategory
                })

            if (insertError) throw insertError

            // 2. Se richiesto, applica a transazioni esistenti
            if (applyToExisting) {
                const { data: transactions, error: fetchError } = await supabase
                    .from('transactions')
                    .select('id, description')
                    .ilike('description', `%${pattern.trim()}%`)

                if (fetchError) throw fetchError

                if (transactions && transactions.length > 0) {
                    const { error: updateError } = await supabase
                        .from('transactions')
                        .update({ category_id: selectedCategory })
                        .in('id', transactions.map(t => t.id))

                    if (updateError) throw updateError

                    setSuccess(`✅ Regola creata e applicata a ${transactions.length} transazioni!`)
                    onTransactionsUpdated()
                } else {
                    setSuccess('✅ Regola creata! Nessuna transazione esistente corrispondente.')
                }
            } else {
                setSuccess('✅ Regola creata!')
            }

            setPattern('')
            setSelectedCategory('')
            setIsAdding(false)
            onUpdate()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa regola?')) return

        try {
            const { error } = await supabase
                .from('merchant_rules')
                .delete()
                .eq('id', id)

            if (error) throw error
            onUpdate()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const getCategoryInfo = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    🔗 Regole Auto-categorizzazione
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    {isAdding ? '✕ Annulla' : '+ Nuova'}
                </button>
            </div>

            <p className="text-gray-500 text-sm mb-4">
                Associa automaticamente le transazioni contenenti una parola chiave a una categoria.
            </p>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                    {success}
                </div>
            )}

            {/* Add form */}
            {isAdding && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parola chiave (ente/merchant)
                        </label>
                        <input
                            type="text"
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder="Es: AMAZON, SPOTIFY, UBER..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tutte le transazioni che contengono questa parola verranno categorizzate.
                        </p>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleziona categoria...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyToExisting}
                                onChange={(e) => setApplyToExisting(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                Applica anche alle transazioni esistenti
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !pattern.trim() || !selectedCategory}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Regola'}
                    </button>
                </div>
            )}

            {/* Rules list */}
            <div className="space-y-2">
                {rules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        Nessuna regola. Crea una regola per auto-categorizzare le transazioni!
                    </p>
                ) : (
                    rules.map((rule) => {
                        const cat = getCategoryInfo(rule.category_id)
                        return (
                            <div
                                key={rule.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group border"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                        {rule.merchant_pattern}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    {cat && (
                                        <span
                                            className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                                        >
                                            {cat.icon} {cat.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    🗑️
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
