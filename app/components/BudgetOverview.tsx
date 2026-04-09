'use client'

import { useMemo } from 'react'
import { Transaction, Category, BudgetConfig, CategoryMacroMapping, MacroCategory } from '@/lib/types'

type BudgetOverviewProps = {
    transactions: Transaction[]     // filtered for current month
    categories: Category[]
    budgetConfigs: BudgetConfig[]
    categoryMappings: CategoryMacroMapping[]
    monthlyIncome: number
}

const MACRO_INFO: Record<MacroCategory, { label: string; icon: string; barColor: string; bgColor: string; borderColor: string; textColor: string }> = {
    necessita: { label: 'Necessità', icon: '🏠', barColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400' },
    sfizi: { label: 'Sfizi', icon: '✨', barColor: 'bg-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', textColor: 'text-amber-400' },
    investimenti: { label: 'Investimenti', icon: '📈', barColor: 'bg-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', textColor: 'text-purple-400' },
}

const MACROS: MacroCategory[] = ['necessita', 'sfizi', 'investimenti']

export default function BudgetOverview({
    transactions,
    categories,
    budgetConfigs,
    categoryMappings,
    monthlyIncome,
}: BudgetOverviewProps) {
    const budgetData = useMemo(() => {
        // Build mapping: category_id -> macro_category
        const catToMacro: Record<string, MacroCategory> = {}
        categoryMappings.forEach(cm => {
            catToMacro[cm.category_id] = cm.macro_category
        })

        // Build percentage map
        const percentages: Record<MacroCategory, number> = { necessita: 50, sfizi: 30, investimenti: 20 }
        budgetConfigs.forEach(bc => {
            percentages[bc.macro_category] = Number(bc.percentage)
        })

        // Calculate spent per macro-category (only expenses)
        const spent: Record<MacroCategory, number> = { necessita: 0, sfizi: 0, investimenti: 0 }
        let unassignedSpent = 0

        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const macro = t.category_id ? catToMacro[t.category_id] : undefined
                if (macro) {
                    spent[macro] += Math.abs(t.amount)
                } else {
                    unassignedSpent += Math.abs(t.amount)
                }
            })

        return MACROS.map(macro => {
            const budget = (monthlyIncome * percentages[macro]) / 100
            const spentAmount = spent[macro]
            const remaining = budget - spentAmount
            const progress = budget > 0 ? Math.min((spentAmount / budget) * 100, 100) : 0

            return {
                macro,
                info: MACRO_INFO[macro],
                percentage: percentages[macro],
                budget,
                spent: spentAmount,
                remaining,
                progress,
                isOver: remaining < 0,
            }
        })
    }, [transactions, budgetConfigs, categoryMappings, monthlyIncome])

    // Don't render if no budget configured or no income
    if (budgetConfigs.length === 0 || monthlyIncome <= 0) return null

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <h3 className="font-semibold text-slate-200 mb-4 text-sm">Budget Mensile</h3>

            <div className="space-y-4">
                {budgetData.map(({ macro, info, budget, spent, remaining, progress, isOver }) => (
                    <div key={macro}>
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{info.icon}</span>
                                <span className={`text-xs font-semibold ${info.textColor}`}>{info.label}</span>
                            </div>
                            <span className={`text-xs font-bold ${isOver ? 'text-red-400' : info.textColor}`}>
                                {isOver ? '-' : ''}€{Math.abs(remaining).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {isOver ? 'sforato' : 'rimanenti'}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : info.barColor}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Bottom stats */}
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-500">
                                €{spent.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} spesi
                            </span>
                            <span className="text-[10px] text-slate-500">
                                €{budget.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} budget
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
