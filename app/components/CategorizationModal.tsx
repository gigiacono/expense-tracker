'use client'

import { Transaction, Category } from '@/lib/types'

type CategorizationModalProps = {
    isOpen: boolean
    transaction: Transaction | null
    category: Category | null
    onClose: () => void
    onConfirm: (scope: 'single' | 'all') => void
}

export default function CategorizationModal({
    isOpen,
    transaction,
    category,
    onClose,
    onConfirm
}: CategorizationModalProps) {
    if (!isOpen || !transaction || !category) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-slideUp">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        {category.icon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Categorizzazione
                    </h2>
                    <p className="text-slate-600">
                        Hai assegnato <strong>{category.name}</strong> a:
                        <br />
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block text-sm">
                            {transaction.description}
                        </span>
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onConfirm('all')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>✨</span>
                        <div className="text-left">
                            <div className="text-sm">Applica a tutte le transazioni simili</div>
                            <div className="text-[10px] opacity-80 font-normal">Passate e future</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onConfirm('single')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-xl font-bold transition-all text-sm"
                    >
                        Solo per questa transazione
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-slate-400 hover:text-slate-600 py-2 text-xs font-medium transition-colors"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    )
}
