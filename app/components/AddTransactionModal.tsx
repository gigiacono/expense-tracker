import React, { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { X, Check, Upload, PenTool } from 'lucide-react';
import { getCategoryIcon } from '@/app/lib/categoryIcons';
import ExcelUploader from './ExcelUploader';
import NumericKeyboard from './NumericKeyboard';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: Category[];
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess, categories }: AddTransactionModalProps) {
    const [mode, setMode] = useState<'manual' | 'import'>('manual');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState<string>('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [loading, setLoading] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setMode('manual');
            setDescription('');
            setAmount('');
            setType('expense');
            setDate(new Date().toISOString().split('T')[0]);
            setCategoryId('');
            setIsRecurring(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        setLoading(true);
        try {
            const finalAmount = parseFloat(amount.replace(',', '.'));
            const finalDescription = description.trim() || 'Nuova transazione';

            const { error } = await supabase.from('transactions').insert({
                revolut_id: `manual_${crypto.randomUUID()}`,
                description: finalDescription,
                amount: type === 'expense' ? -Math.abs(finalAmount) : Math.abs(finalAmount),
                date: new Date(date).toISOString(),
                type,
                category_id: categoryId || null,
                is_manual: true,
                is_recurring: isRecurring,
                currency: 'EUR'
            });

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Supabase Error:', err);
            alert(`Errore nel salvataggio: ${err?.message || 'Errore sconosciuto'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white border-b border-slate-700/50">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50">
                        <X size={20} />
                    </button>

                    {/* Mode Switcher */}
                    <div className="flex bg-slate-900 rounded-lg p-1">
                        <button
                            onClick={() => setMode('manual')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'manual' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                        >
                            <PenTool size={12} /> Manuale
                        </button>
                        <button
                            onClick={() => setMode('import')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'import' ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-500'}`}
                        >
                            <Upload size={12} /> Excel
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || mode === 'import'}
                        className={`p-2 rounded-full text-slate-900 transition-colors ${mode === 'import' ? 'opacity-0 pointer-events-none' : 'bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50'}`}
                    >
                        <Check size={20} className="stroke-[3]" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">

                    {mode === 'import' ? (
                        <div className="py-4 space-y-4 text-center">
                            <h3 className="text-white font-semibold mb-2">Carica file Revolut/Excel</h3>
                            <p className="text-slate-400 text-sm mb-6">Carica il file .csv o .xlsx per importare le transazioni in massa.</p>
                            <ExcelUploader
                                categories={categories}
                                onImportComplete={() => { onSuccess(); onClose(); }}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Manual Form Content */}
                            <div className="mb-8 text-center">
                                <div className="flex justify-center items-center gap-2 mb-2">
                                    <button
                                        onClick={() => setType('expense')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${type === 'expense' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        Uscita
                                    </button>
                                    <button
                                        onClick={() => setType('income')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        Entrata
                                    </button>
                                </div>

                                <div className="flex justify-center items-baseline gap-1 mt-6 mb-2">
                                    <span className={`text-3xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>€</span>
                                    <div className={`text-5xl font-bold tracking-tight ${amount ? 'text-white' : 'text-slate-600'}`}>
                                        {amount || '0.00'}
                                    </div>
                                </div>
                                <NumericKeyboard value={amount} onChange={setAmount} />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 ml-1">Descrizione</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Es. Spesa Carrefour"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 ml-1">Data</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                                    <span className="text-sm text-slate-300">Si ripete ogni mese?</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-2 ml-1">Categoria</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {categories.map((cat) => {
                                            const Icon = getCategoryIcon(cat.name);
                                            const isSelected = categoryId === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategoryId(cat.id)}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${isSelected
                                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <Icon size={20} />
                                                    <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
