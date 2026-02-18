'use client'

import { useState } from 'react'
import { Category, MerchantRule } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { X, Plus, Trash2, Zap } from 'lucide-react'

type SmartRulesModalProps = {
    category: Category
    rules: MerchantRule[]
    onClose: () => void
    onUpdate: () => void
    onTransactionsUpdated: () => void
}

export default function SmartRulesModal({ category, rules, onClose, onUpdate, onTransactionsUpdated }: SmartRulesModalProps) {
    const [newPattern, setNewPattern] = useState('')
    const [applyToExisting, setApplyToExisting] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleAdd = async () => {
        if (!newPattern.trim()) return
        setIsLoading(true)
        setFeedback(null)

        try {
            const { error: insertError } = await supabase
                .from('merchant_rules')
                .insert({ merchant_pattern: newPattern.trim(), category_id: category.id })

            if (insertError) throw insertError

            if (applyToExisting) {
                const { data: txs, error: fetchError } = await supabase
                    .from('transactions')
                    .select('id')
                    .ilike('description', `%${newPattern.trim()}%`)

                if (fetchError) throw fetchError

                if (txs && txs.length > 0) {
                    const { error: updateError } = await supabase
                        .from('transactions')
                        .update({ category_id: category.id })
                        .in('id', txs.map(t => t.id))

                    if (updateError) throw updateError
                    setFeedback({ type: 'success', message: `Aggiunta e applicata a ${txs.length} transazioni` })
                    onTransactionsUpdated()
                } else {
                    setFeedback({ type: 'success', message: 'Aggiunta! Nessuna transazione esistente trovata.' })
                }
            } else {
                setFeedback({ type: 'success', message: 'Regola aggiunta!' })
            }

            setNewPattern('')
            onUpdate()
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('merchant_rules')
                .delete()
                .eq('id', id)
            if (error) throw error
            onUpdate()
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message })
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div
                className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-800 p-5 pb-8 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: category.color + '20' }}
                        >
                            {category.icon}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">{category.name}</h3>
                            <p className="text-slate-500 text-xs">{rules.length} {rules.length === 1 ? 'regola' : 'regole'} attive</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div className={`mb-4 p-3 rounded-xl text-xs border ${feedback.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
                    </div>
                )}

                {/* Existing Rules */}
                <div className="space-y-2 mb-5">
                    {rules.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">Nessuna regola per questa categoria</p>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700">
                                <span className="font-mono text-sm text-slate-300 truncate mr-3">{rule.merchant_pattern}</span>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-400 hover:text-red-300 p-1 shrink-0 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add New Rule */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                    <p className="text-xs text-slate-400 font-medium">Aggiungi nuova keyword</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.target.value)}
                            placeholder="Es: AMAZON, SPOTIFY..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-slate-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={isLoading || !newPattern.trim()}
                            className="bg-emerald-500 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors shrink-0"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <button
                            type="button"
                            onClick={() => setApplyToExisting(!applyToExisting)}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${applyToExisting ? 'bg-emerald-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${applyToExisting ? 'translate-x-5' : ''}`}></div>
                        </button>
                        <span className="text-xs text-slate-400">Applica anche alle transazioni esistenti</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
