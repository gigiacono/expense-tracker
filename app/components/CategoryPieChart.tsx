'use client'

import { useMemo } from 'react'
import { Transaction, Category } from '@/lib/types'
import { getCategoryIcon } from '@/app/lib/categoryIcons'

type CategoryPieChartProps = {
    transactions: Transaction[]
    categories: Category[]
}

// Beautiful color palette
const COLORS = [
    '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#a855f7',
    '#22d3ee', '#84cc16', '#e11d48', '#06b6d4', '#d946ef',
    '#facc15', '#4ade80', '#fb923c', '#818cf8', '#f472b6',
]

type Slice = {
    category: Category
    amount: number
    percentage: number
    color: string
    startAngle: number
    endAngle: number
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

export default function CategoryPieChart({ transactions, categories }: CategoryPieChartProps) {
    const { slices, totalExpense } = useMemo(() => {
        // Only expenses
        const expenses = transactions.filter(t => t.type === 'expense')
        const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

        // Group by category
        const byCat: Record<string, number> = {}
        expenses.forEach(t => {
            const catId = t.category_id || 'uncategorized'
            byCat[catId] = (byCat[catId] || 0) + Math.abs(t.amount)
        })

        // Sort by amount descending
        const sorted = Object.entries(byCat)
            .map(([catId, amount]) => ({
                category: categories.find(c => c.id === catId) || { id: catId, name: 'Altro', icon: '❓', color: '#64748b', created_at: '' },
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount)

        // Build slices with angles
        let currentAngle = 0
        const result: Slice[] = sorted.map((item, i) => {
            const sweep = (item.percentage / 100) * 360
            const slice: Slice = {
                ...item,
                color: COLORS[i % COLORS.length],
                startAngle: currentAngle,
                endAngle: currentAngle + sweep,
            }
            currentAngle += sweep
            return slice
        })

        return { slices: result, totalExpense: total }
    }, [transactions, categories])

    if (totalExpense === 0) {
        return (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 text-center">
                <p className="text-slate-500 text-sm">Nessuna spesa in questo mese.</p>
            </div>
        )
    }

    const cx = 100, cy = 100, r = 80

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <h3 className="font-semibold text-slate-200 mb-4 text-sm">Ripartizione Spese</h3>

            <div className="flex items-center gap-6">
                {/* SVG Donut */}
                <div className="w-[140px] h-[140px] shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        {slices.map((slice, i) => {
                            // Handle full circle (single category = 100%)
                            if (slice.endAngle - slice.startAngle >= 359.99) {
                                return (
                                    <circle
                                        key={i}
                                        cx={cx}
                                        cy={cy}
                                        r={r}
                                        fill={slice.color}
                                        className="drop-shadow-sm"
                                    />
                                )
                            }
                            return (
                                <path
                                    key={i}
                                    d={describeArc(cx, cy, r, slice.startAngle, slice.endAngle)}
                                    fill={slice.color}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                    className="drop-shadow-sm transition-opacity hover:opacity-80"
                                />
                            )
                        })}
                        {/* Inner circle for donut effect */}
                        <circle cx={cx} cy={cy} r={45} fill="#0f172a" />
                        <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize="14"
                            fontWeight="700"
                        >
                            €{totalExpense.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                        </text>
                        <text
                            x={cx}
                            y={cy + 10}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8"
                        >
                            TOTALE
                        </text>
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[140px]">
                    {slices.slice(0, 6).map((slice, i) => {
                        const Icon = getCategoryIcon(slice.category.name)
                        return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <Icon size={12} className="text-slate-400 shrink-0" />
                                <span className="text-slate-300 truncate flex-1">{slice.category.name}</span>
                                <span className="text-slate-500 font-medium shrink-0">{slice.percentage.toFixed(0)}%</span>
                            </div>
                        )
                    })}
                    {slices.length > 6 && (
                        <p className="text-[10px] text-slate-600">+{slices.length - 6} altre</p>
                    )}
                </div>
            </div>
        </div>
    )
}
