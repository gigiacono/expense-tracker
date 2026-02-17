import React from 'react';
import { Transaction, Category } from '@/lib/types';
import { getCategoryIcon } from '@/app/lib/categoryIcons';
import { ChevronRight } from 'lucide-react';

interface TransactionItemProps {
    transaction: Transaction;
    category?: Category;
    onClick?: () => void;
}

export default function TransactionItem({ transaction, category, onClick }: TransactionItemProps) {
    // Use our utility to get the icon component
    const Icon = getCategoryIcon(category?.name || transaction.description);

    const isExpense = transaction.type === 'expense';
    const displayAmount = Math.abs(transaction.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 });
    const date = new Date(transaction.date);
    const dateStr = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 active:bg-slate-800 transition-colors cursor-pointer group"
        >
            {/* Icon Circle */}
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors shrink-0">
                <Icon size={20} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-100 truncate text-sm md:text-base">
                    {transaction.description || 'Nessuna descrizione'}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{category?.name || 'Non categorizzato'}</p>
                    <span className="text-slate-600">•</span>
                    <p className="text-xs text-slate-500">{dateStr}</p>
                    {transaction.is_recurring && (
                        <>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                Ricorsivo
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
                <p className={`font-bold font-mono ${isExpense ? 'text-slate-200' : 'text-emerald-400'}`}>
                    {isExpense ? '-' : '+'}€{displayAmount}
                </p>
            </div>

            <ChevronRight size={16} className="text-slate-600" />
        </div>
    );
}
