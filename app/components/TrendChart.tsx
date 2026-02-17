import { MonthlyBalance, Transaction } from '@/lib/types'

type TrendChartProps = {
    transactions: Transaction[] // Keeping for compatibility
    currentDate: Date
    monthlyBalances?: MonthlyBalance[]
}

export default function TrendChart({ currentDate, monthlyBalances = [] }: TrendChartProps) {
    const currentYear = currentDate.getFullYear()

    // 1. Prepare Data
    const data = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(currentYear, i, 1)
        const balanceRecord = monthlyBalances.find(mb =>
            mb.month === i + 1 && mb.year === currentYear
        )
        return {
            label: d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase(),
            value: balanceRecord?.starting_balance || 0,
            hasData: balanceRecord?.starting_balance !== undefined && balanceRecord.starting_balance !== null
        }
    })

    // 2. SVG Calculations
    const width = 300
    const height = 150
    const padding = { top: 20, right: 10, bottom: 20, left: 10 } // Reduced left padding

    const values = data.map(d => d.value)
    const rawMin = Math.min(...values, 0)
    const rawMax = Math.max(...values, 100)

    const tickStep = 500
    const minScale = Math.floor(rawMin / tickStep) * tickStep
    const maxScale = Math.ceil(rawMax / tickStep) * tickStep
    const finalMax = maxScale === minScale ? minScale + tickStep : maxScale
    const range = finalMax - minScale

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right)
    const getY = (value: number) => height - padding.bottom - ((value - minScale) / range) * (height - padding.top - padding.bottom)

    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')

    // Bezier curve smoothing for nicer look
    const smoothPoints = points; // Placeholder for now, keeping linear for simplicity but could add bezier

    const areaPath = `
        M ${getX(0)},${height - padding.bottom} 
        L ${points} 
        L ${getX(data.length - 1)},${height - padding.bottom} 
        Z
    `

    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 px-2 uppercase tracking-wider">
                Andamento {currentYear}
            </h3>

            <div className="relative h-48 w-full">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path d={areaPath} fill="url(#chartGradient)" />

                    {/* Line Stroke */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Active Data Points */}
                    {data.map((d, i) => d.hasData && (
                        <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r="3"
                            fill="#0f172a"
                            stroke="#10B981"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* Touch Overlay */}
                <div className="absolute inset-0 flex" style={{ paddingLeft: `${(padding.left / width) * 100}%`, paddingRight: `${(padding.right / width) * 100}%` }}>
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 relative group/col h-full flex flex-col justify-end pb-2 cursor-pointer touch-none">
                            {/* Tooltip */}
                            <div className="absolute bottom-[80%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/col:opacity-100 transition-opacity z-20 pointer-events-none">
                                <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-center min-w-[60px]">
                                    <div className="text-[9px] text-slate-400">{d.label}</div>
                                    <div className="text-xs font-bold text-emerald-400">€{d.value}</div>
                                </div>
                            </div>

                            {/* X-Label */}
                            <div className="text-center">
                                <span className={`text-[9px] font-bold uppercase transition-colors ${d.hasData ? 'text-slate-400 group-hover/col:text-emerald-400' : 'text-slate-700'}`}>
                                    {d.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
