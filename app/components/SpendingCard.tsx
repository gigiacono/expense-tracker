import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface SpendingCardProps {
    balance: number;
    income: number;
    expense: number;
}

export default function SpendingCard({ balance, income, expense }: SpendingCardProps) {
    return (
        <div className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-2xl shadow-emerald-900/20 text-white relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                        <Wallet size={12} />
                        <span>Conto Principale</span>
                    </div>
                    {/* Chip visual */}
                    <div className="w-8 h-6 bg-yellow-200/80 rounded flex items-center justify-center opacity-80">
                        <div className="w-5 h-4 border border-yellow-600/30 rounded-sm"></div>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-emerald-50 text-xs font-medium mb-1 opacity-80 uppercase tracking-wider">Spese del Mese</p>
                    <h2 className="text-4xl font-bold tracking-tight">
                        € {expense.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 bg-black/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 text-emerald-100 mb-1">
                            <div className="p-1 bg-emerald-400/20 rounded-full">
                                <TrendingDown size={10} />
                            </div>
                            <span className="text-xs font-medium">Saldo</span>
                        </div>
                        <p className="font-semibold text-sm">€ {balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="flex-1 bg-black/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 text-emerald-100 mb-1">
                            <div className="p-1 bg-emerald-400/20 rounded-full">
                                <TrendingUp size={10} />
                            </div>
                            <span className="text-xs font-medium">Entrate</span>
                        </div>
                        <p className="font-semibold text-sm">€ {income.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
