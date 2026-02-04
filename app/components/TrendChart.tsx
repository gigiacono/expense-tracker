import { Transaction } from '@/lib/types'

type TrendChartProps = {
    transactions: Transaction[] // All transactions
    currentDate: Date // To determine the 6 months window
}

export default function TrendChart({ transactions, currentDate }: TrendChartProps) {
    // 1. Generate last 6 months keys
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentDate)
        d.setMonth(d.getMonth() - i)
        months.push(d)
    }

    // 2. Aggregate data
    const data = months.map(month => {
        const monthKey = `${month.getFullYear()}-${month.getMonth()}`

        // Filter transactions for this month
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date)
            return tDate.getMonth() === month.getMonth() &&
                tDate.getFullYear() === month.getFullYear()
        })

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        return {
            label: month.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase(),
            income,
            expense
        }
    })

    // Find max value for scaling
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.income, d.expense)),
        100 // Minimum scale
    )

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                📈 Andamento (ultimi 6 mesi)
            </h3>

            <div className="h-48 flex items-end justify-between gap-2">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        {/* Bars Container */}
                        <div className="w-full flex justify-center items-end gap-1 h-full relative">
                            {/* Values Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                <div className="text-green-400">+€{item.income.toFixed(0)}</div>
                                <div className="text-red-400">-€{item.expense.toFixed(0)}</div>
                            </div>

                            {/* Income Bar */}
                            <div
                                className="w-3 bg-green-500/50 hover:bg-green-500 rounded-t-sm transition-all"
                                style={{ height: `${(item.income / maxValue) * 100}%` }}
                            />

                            {/* Expense Bar */}
                            <div
                                className="w-3 bg-red-500/50 hover:bg-red-500 rounded-t-sm transition-all"
                                style={{ height: `${(item.expense / maxValue) * 100}%` }}
                            />
                        </div>
                        {/* Label */}
                        <span className="text-xs text-slate-500 font-medium">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
