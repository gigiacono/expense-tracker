'use client'

import { useState } from 'react'
import { Category, MerchantRule } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Plus, X, Trash2, ArrowRight, Zap } from 'lucide-react'

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
            const { error: insertError } = await supabase
                .from('merchant_rules')
                .insert({
                    merchant_pattern: pattern.trim(),
                    category_id: selectedCategory
                })

            if (insertError) throw insertError

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

                    setSuccess(`Regola creata e applicata a ${transactions.length} transazioni!`)
                    onTransactionsUpdated()
                } else {
                    setSuccess('Regola creata! Nessuna transazione esistente corrispondente.')
                }
            } else {
                setSuccess('Regola creata!')
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
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    Regole Smart
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isAdding
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
                        }`}
                >
                    {isAdding ? <><X size={12} /> Annulla</> : <><Plus size={12} /> Nuova</>}
                </button>
            </div>

            <p className="text-slate-500 text-xs mb-4">
                Auto-categorizza le transazioni future per keyword.
            </p>

            {error && (
                <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs">
                    ✅ {success}
                </div>
            )}

            {/* Add form */}
            {isAdding && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">
                            Parola chiave
                        </label>
                        <input
                            type="text"
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder="Es: AMAZON, SPOTIFY..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-yellow-500 outline-none placeholder-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Categoria</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-yellow-500 outline-none"
                        >
                            <option value="">Seleziona categoria...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <button
                            type="button"
                            onClick={() => setApplyToExisting(!applyToExisting)}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${applyToExisting ? 'bg-yellow-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${applyToExisting ? 'translate-x-5' : ''}`}></div>
                        </button>
                        <span className="text-xs text-slate-300">Applica anche alle transazioni esistenti</span>
                    </label>

                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !pattern.trim() || !selectedCategory}
                        className="w-full bg-yellow-500 text-slate-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Regola'}
                    </button>
                </div>
            )}

            {/* Rules list */}
            <div className="space-y-1">
                {rules.length === 0 ? (
                    <p className="text-slate-500 text-center text-xs py-4">
                        Nessuna regola. Le transazioni verranno categorizzate manualmente.
                    </p>
                ) : (
                    rules.map((rule) => {
                        const cat = getCategoryInfo(rule.category_id)
                        return (
                            <div
                                key={rule.id}
                                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/50 group transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono bg-slate-800 px-2 py-1 rounded-lg text-xs text-slate-300 border border-slate-700 truncate">
                                        {rule.merchant_pattern}
                                    </span>
                                    <ArrowRight size={12} className="text-slate-600 shrink-0" />
                                    {cat && (
                                        <span
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs shrink-0"
                                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                                        >
                                            {cat.icon} {cat.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
