import { Transaction, Category } from '@/lib/types'

type MonthlyReportProps = {
    transactions: Transaction[] // Filtered transactions for the month
    categories: Category[]
}

export default function MonthlyReport({ transactions, categories }: MonthlyReportProps) {
    // 1. Group expenses by category
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const catId = t.category_id || 'uncategorized'
            acc[catId] = (acc[catId] || 0) + Math.abs(t.amount)
            return acc
        }, {} as Record<string, number>)

    // 2. Calculate total expenses for percentage
    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)

    // 3. Create sorted array for display
    const breakdown = Object.entries(expensesByCategory)
        .map(([catId, amount]) => {
            const category = categories.find(c => c.id === catId)
            return {
                id: catId,
                name: category ? category.name : (catId === 'uncategorized' ? 'Senza Categoria' : 'Sconosciuto'),
                icon: category ? category.icon : '❓',
                color: category ? category.color : '#94a3b8', // Slate-400
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
            }
        })
        .sort((a, b) => b.amount - a.amount)

    if (breakdown.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 flex items-center justify-center h-full">
                <p className="text-slate-500">Nessuna spesa in questo mese</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                📊 Spese per Categoria
            </h3>
            <div className="space-y-4">
                {breakdown.map((item) => (
                    <div key={item.id}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2 text-white">
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </span>
                            <span className="font-medium text-slate-300">
                                €{item.amount.toFixed(2)} ({item.percentage.toFixed(0)}%)
                            </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
