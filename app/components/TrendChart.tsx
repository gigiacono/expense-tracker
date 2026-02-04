import { Transaction, MonthlyBalance } from '@/lib/types'

type TrendChartProps = {
    transactions: Transaction[] // Keeping for compatibility, though maybe unused now
    currentDate: Date
    monthlyBalances?: MonthlyBalance[]
}

export default function TrendChart({ transactions, currentDate, monthlyBalances = [] }: TrendChartProps) {
    // 1. Generate months for the current year (Jan - Dec)
    const currentYear = currentDate.getFullYear()
    const months = []
    for (let i = 0; i < 12; i++) {
        const d = new Date(currentYear, i, 1)
        months.push(d)
    }

    // 2. Map balances to months
    const data = months.map(month => {
        // Find balance for this specific month/year
        const balanceRecord = monthlyBalances.find(mb =>
            mb.month === month.getMonth() + 1 && // DB months are 1-12
            mb.year === month.getFullYear()
        )

        return {
            label: month.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase(),
            value: balanceRecord?.starting_balance || 0,
            hasData: balanceRecord?.starting_balance !== undefined && balanceRecord.starting_balance !== null
        }
    })

    // Find max value for scaling
    // Only consider months that actually have data to avoid skewing generic 0s?
    // But if value is 0 it is 0.
    const maxValue = Math.max(
        ...data.map(d => d.value),
        100 // Minimum scale
    )

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                📈 Andamento Saldo {currentYear}
            </h3>

            <div className="h-48 flex items-end justify-between gap-2">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        {/* Bars Container */}
                        <div className="w-full flex justify-center items-end gap-1 h-full relative">
                            {/* Values Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                <div className="text-blue-400 font-bold">€{item.value.toFixed(2)}</div>
                            </div>

                            {/* Balance Bar */}
                            <div
                                className={`w-4 rounded-t-sm transition-all relative ${item.hasData ? 'bg-blue-500 hover:bg-blue-400' : 'bg-slate-700/30'
                                    }`}
                                style={{ height: `${Math.max((item.value / maxValue) * 100, item.hasData ? 2 : 2)}%` }} // Min 2% visibility
                            >
                                {/* Indicator for missing data */}
                                {!item.hasData && (
                                    <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-500 transform -rotate-90">
                                        N/A
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Label */}
                        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Saldo Iniziale Mensile
            </div>
        </div>
    )
}
