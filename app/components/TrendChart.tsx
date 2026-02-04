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
    const width = 300 // Increased resolution for text
    const height = 150
    const padding = { top: 20, right: 10, bottom: 20, left: 40 }

    const values = data.map(d => d.value)

    // Calculate Min/Max rounded to 500
    const rawMin = Math.min(...values, 0)
    const rawMax = Math.max(...values, 100) // Ensure at least up to 100 if empty

    const tickStep = 500
    const minScale = Math.floor(rawMin / tickStep) * tickStep
    const maxScale = Math.ceil(rawMax / tickStep) * tickStep

    // Force at least 0-500 if flat
    const finalMax = maxScale === minScale ? minScale + tickStep : maxScale

    const ticks = []
    for (let i = minScale; i <= finalMax; i += tickStep) {
        ticks.push(i)
    }

    const range = finalMax - minScale

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right)
    const getY = (value: number) => height - padding.bottom - ((value - minScale) / range) * (height - padding.top - padding.bottom)

    // Generate Points
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')

    // Area Path
    const areaPath = `
        M ${getX(0)},${height - padding.bottom} 
        L ${points} 
        L ${getX(data.length - 1)},${height - padding.bottom} 
        Z
    `

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                📈 Andamento Saldo {currentYear}
            </h3>

            <div className="relative h-64 w-full">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    {/* Y-Axis Grid & Labels */}
                    {ticks.map(tick => (
                        <g key={tick}>
                            {/* Grid Line */}
                            <line
                                x1={padding.left}
                                y1={getY(tick)}
                                x2={width - padding.right}
                                y2={getY(tick)}
                                stroke="#334155"
                                strokeWidth="0.5"
                                strokeDasharray="4 2"
                            />
                            {/* Label */}
                            <text
                                x={padding.left - 5}
                                y={getY(tick)}
                                dy="3"
                                textAnchor="end"
                                fontSize="8"
                                fill="#94a3b8"
                            >
                                €{tick}
                            </text>
                        </g>
                    ))}

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
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {data.map((d, i) => d.hasData && (
                        <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r="2"
                            fill="#3B82F6"
                            stroke="#1e293b"
                            strokeWidth="0.5"
                        />
                    ))}
                </svg>

                {/* Touch/Hover Overlay */}
                <div className="absolute inset-0 flex" style={{ paddingLeft: `${(padding.left / width) * 100}%`, paddingRight: `${(padding.right / width) * 100}%` }}>
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 relative group/col h-full flex flex-col justify-end pb-2 cursor-pointer touch-none">
                            {/* Invisible touch target full height */}

                            {/* Tooltip */}
                            <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/col:opacity-100 group-active/col:opacity-100 transition-opacity z-20 pointer-events-none">
                                <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-xl text-center min-w-[80px]">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">{d.label}</div>
                                    <div className={`text-sm font-bold ${d.value >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                        €{d.value.toFixed(2)}
                                    </div>
                                </div>
                                {/* Arrow */}
                                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                            </div>

                            {/* X-Label */}
                            <div className="text-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase group-hover/col:text-blue-400 transition-colors">
                                    {d.label}
                                </span>
                            </div>

                            {/* Hover Line vertical */}
                            <div className="absolute top-0 bottom-6 left-1/2 w-px bg-blue-500/0 group-hover/col:bg-blue-500/20 transition-colors -z-10"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
