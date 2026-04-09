'use client'

import { useState, useEffect, useMemo } from 'react'
import { Category, BudgetConfig, CategoryMacroMapping, MacroCategory } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Check, PieChart } from 'lucide-react'
import { getCategoryIcon } from '@/app/lib/categoryIcons'

type BudgetManagerProps = {
    categories: Category[]
    budgetConfigs: BudgetConfig[]
    categoryMappings: CategoryMacroMapping[]
    onUpdate: () => void
}

const MACRO_INFO: Record<MacroCategory, { label: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
    necessita: { label: 'Necessità', icon: '🏠', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    sfizi: { label: 'Sfizi', icon: '✨', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    investimenti: { label: 'Investimenti', icon: '📈', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
}

const MACROS: MacroCategory[] = ['necessita', 'sfizi', 'investimenti']

export default function BudgetManager({ categories, budgetConfigs, categoryMappings, onUpdate }: BudgetManagerProps) {
    const [percentages, setPercentages] = useState<Record<MacroCategory, string>>({
        necessita: '50',
        sfizi: '30',
        investimenti: '20',
    })
    const [mappings, setMappings] = useState<Record<string, MacroCategory | ''>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Init from props
    useEffect(() => {
        const pcts: Record<MacroCategory, string> = { necessita: '50', sfizi: '30', investimenti: '20' }
        budgetConfigs.forEach(bc => {
            pcts[bc.macro_category] = bc.percentage.toString()
        })
        setPercentages(pcts)

        const maps: Record<string, MacroCategory | ''> = {}
        categories.forEach(c => { maps[c.id] = '' })
        categoryMappings.forEach(cm => {
            maps[cm.category_id] = cm.macro_category
        })
        setMappings(maps)
    }, [budgetConfigs, categoryMappings, categories])

    const totalPercentage = useMemo(() => {
        return MACROS.reduce((sum, m) => sum + (parseFloat(percentages[m]) || 0), 0)
    }, [percentages])

    const isValid = Math.abs(totalPercentage - 100) < 0.01

    const handleSave = async () => {
        if (!isValid) return

        setIsSaving(true)
        setSaved(false)

        try {
            // 1. Save percentages
            for (const macro of MACROS) {
                await supabase
                    .from('budget_config')
                    .upsert({
                        macro_category: macro,
                        percentage: parseFloat(percentages[macro]) || 0,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'macro_category' })
            }

            // 2. Save category mappings
            // Delete existing and re-insert
            await supabase.from('category_macro_mapping').delete().neq('id', '00000000-0000-0000-0000-000000000000')

            const mappingsToInsert = Object.entries(mappings)
                .filter(([_, macro]) => macro !== '')
                .map(([catId, macro]) => ({
                    category_id: catId,
                    macro_category: macro
                }))

            if (mappingsToInsert.length > 0) {
                await supabase.from('category_macro_mapping').insert(mappingsToInsert)
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            onUpdate()
        } catch (err: any) {
            console.error('Errore salvataggio budget:', err)
            alert('Errore nel salvataggio')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <PieChart size={16} className="text-purple-400" /> Budget
                </h3>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !isValid}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${saved
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-400 hover:bg-purple-500/25 disabled:opacity-40'
                        }`}
                >
                    <Check size={12} /> {saved ? 'Salvato!' : isSaving ? 'Salva...' : 'Salva'}
                </button>
            </div>

            {/* Percentages */}
            <div className="mb-5">
                <p className="text-xs text-slate-400 mb-3">Allocazione % delle entrate</p>
                <div className="flex gap-2">
                    {MACROS.map(macro => {
                        const info = MACRO_INFO[macro]
                        return (
                            <div key={macro} className={`flex-1 ${info.bgColor} ${info.borderColor} border rounded-xl p-3`}>
                                <p className={`text-[10px] ${info.color} font-medium mb-1`}>{info.icon} {info.label}</p>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={percentages[macro]}
                                        onChange={(e) => setPercentages(prev => ({ ...prev, [macro]: e.target.value }))}
                                        className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:border-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-slate-500 text-xs">%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {!isValid && (
                    <p className="text-red-400 text-[10px] mt-2 text-center">
                        ⚠️ Il totale deve essere 100% (attuale: {totalPercentage.toFixed(0)}%)
                    </p>
                )}
            </div>

            {/* Category Assignments */}
            <div>
                <p className="text-xs text-slate-400 mb-3">Assegna categorie</p>
                <div className="space-y-1.5">
                    {categories.map(cat => {
                        const Icon = getCategoryIcon(cat.name)
                        const currentMacro = mappings[cat.id] || ''

                        return (
                            <div key={cat.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: cat.color + '20' }}
                                >
                                    <Icon size={14} style={{ color: cat.color }} />
                                </div>
                                <span className="text-sm text-slate-300 flex-1 truncate">{cat.name}</span>

                                <div className="flex gap-1">
                                    {MACROS.map(macro => {
                                        const info = MACRO_INFO[macro]
                                        const isSelected = currentMacro === macro
                                        return (
                                            <button
                                                key={macro}
                                                onClick={() => setMappings(prev => ({
                                                    ...prev,
                                                    [cat.id]: isSelected ? '' : macro
                                                }))}
                                                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${isSelected
                                                    ? `${info.bgColor} ${info.borderColor} ${info.color}`
                                                    : 'border-slate-700/50 text-slate-600 hover:text-slate-400 hover:border-slate-600'
                                                    }`}
                                                title={info.label}
                                            >
                                                {info.icon}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
