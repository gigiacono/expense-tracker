import { Transaction, MonthlyBalance } from '@/lib/types'

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
    const width = 100
    const height = 50
    const padding = 5

    const values = data.map(d => d.value)
    const minVal = Math.min(...values, 0)
    const maxVal = Math.max(...values, 100) // Ensure some range
    const range = maxVal - minVal || 1

    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding)
    const getY = (value: number) => height - padding - ((value - minVal) / range) * (height - 2 * padding)

    // Generate Points
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')

    // Area Path (starts at bottom left, goes to line points, down to bottom right)
    const areaPath = `
        M ${getX(0)},${height} 
        L ${points} 
        L ${getX(data.length - 1)},${height} 
        Z
    `

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                📈 Andamento Saldo {currentYear}
            </h3>

            <div className="relative h-48 w-full group">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    {/* Grid Lines (Optional) */}
                    <line x1="0" y1={getY(0)} x2={width} y2={getY(0)} stroke="#334155" strokeWidth="0.1" strokeDasharray="2" />
                    <line x1="0" y1={getY(maxVal)} x2={width} y2={getY(maxVal)} stroke="#334155" strokeWidth="0.1" strokeDasharray="2" />

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path d={areaPath} fill="url(#chartGradient)" />

                    {/* Line Stroke */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {data.map((d, i) => d.hasData && (
                        <g key={i} className="group/point hover:opacity-100">
                            <circle
                                cx={getX(i)}
                                cy={getY(d.value)}
                                r="1.5"
                                fill="#3B82F6"
                                stroke="#1e293b"
                                strokeWidth="0.5"
                                className="transition-all duration-300 ease-out group-hover/chart:r-2"
                            />
                        </g>
                    ))}
                </svg>

                {/* HTML Overlay for Tooltips & Labels */}
                <div className="absolute inset-0 flex justify-between items-end pointer-events-none">
                    {data.map((d, i) => (
                        <div key={i} className="flex flex-col items-center justify-end h-full w-8 relative group/bar pointer-events-auto">

                            {/* Hover Tooltip */}
                            <div className="absolute top-0 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs whitespace-nowrap z-10 -translate-y-full mb-1">
                                <span className={d.value >= 0 ? "text-blue-400" : "text-red-400"}>
                                    €{d.value.toFixed(2)}
                                </span>
                            </div>

                            {/* X-Axis Label */}
                            <span className="text-[9px] text-slate-500 font-bold mt-2 uppercase">
                                {d.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 bg-blue-500 rounded-full opacity-50"></span> Saldo Iniziale
            </div>
        </div>
    )
}
