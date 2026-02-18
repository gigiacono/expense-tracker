'use client'

import { useState } from 'react'
import { Category, MerchantRule } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Zap, ChevronRight, Plus } from 'lucide-react'
import { getCategoryIcon } from '@/app/lib/categoryIcons'
import SmartRulesModal from './SmartRulesModal'

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
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [showAddNew, setShowAddNew] = useState(false)
    const [newPattern, setNewPattern] = useState('')
    const [newCategoryId, setNewCategoryId] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Group rules by category
    const rulesByCategory = categories
        .map(cat => ({
            category: cat,
            rules: rules.filter(r => r.category_id === cat.id)
        }))
        .filter(group => group.rules.length > 0)

    const handleQuickAdd = async () => {
        if (!newPattern.trim() || !newCategoryId) return
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('merchant_rules')
                .insert({ merchant_pattern: newPattern.trim(), category_id: newCategoryId })
            if (error) throw error

            // Apply to existing
            const { data: txs } = await supabase
                .from('transactions')
                .select('id')
                .ilike('description', `%${newPattern.trim()}%`)

            if (txs && txs.length > 0) {
                await supabase
                    .from('transactions')
                    .update({ category_id: newCategoryId })
                    .in('id', txs.map(t => t.id))
                onTransactionsUpdated()
            }

            setNewPattern('')
            setNewCategoryId('')
            setShowAddNew(false)
            onUpdate()
        } catch (err: any) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        Regole Smart
                    </h3>
                    <button
                        onClick={() => setShowAddNew(!showAddNew)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${showAddNew
                                ? 'bg-slate-800 border-slate-700 text-slate-400'
                                : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
                            }`}
                    >
                        <Plus size={12} /> Nuova
                    </button>
                </div>
                <p className="text-slate-500 text-xs mb-4">
                    Tocca una categoria per gestire le sue keyword.
                </p>

                {/* Quick Add */}
                {showAddNew && (
                    <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                        <input
                            type="text"
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.target.value)}
                            placeholder="Keyword (es: AMAZON)"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-yellow-500 outline-none placeholder-slate-500"
                        />
                        <select
                            value={newCategoryId}
                            onChange={(e) => setNewCategoryId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-yellow-500 outline-none"
                        >
                            <option value="">Seleziona categoria...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleQuickAdd}
                            disabled={isLoading || !newPattern.trim() || !newCategoryId}
                            className="w-full bg-yellow-500 text-slate-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Salvataggio...' : 'Aggiungi Regola'}
                        </button>
                    </div>
                )}

                {/* Category list with rule counts */}
                <div className="space-y-1.5">
                    {rulesByCategory.length === 0 ? (
                        <p className="text-slate-500 text-center text-xs py-4">
                            Nessuna regola. Usa il pulsante + per crearne una.
                        </p>
                    ) : (
                        rulesByCategory.map(({ category: cat, rules: catRules }) => {
                            const Icon = getCategoryIcon(cat.name)
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors group text-left"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: cat.color + '20' }}
                                    >
                                        <Icon size={16} style={{ color: cat.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200 font-medium">{cat.name}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {catRules.map(r => r.merchant_pattern).join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                            {catRules.length}
                                        </span>
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedCategory && (
                <SmartRulesModal
                    category={selectedCategory}
                    rules={rules.filter(r => r.category_id === selectedCategory.id)}
                    onClose={() => setSelectedCategory(null)}
                    onUpdate={onUpdate}
                    onTransactionsUpdated={onTransactionsUpdated}
                />
            )}
        </>
    )
}
