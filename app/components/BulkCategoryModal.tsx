import React, { useState } from 'react';
import { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { X, Check, Calendar, Tag, Search } from 'lucide-react';
import { getCategoryIcon } from '@/app/lib/categoryIcons';

interface BulkCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSuccess: () => void;
}

export default function BulkCategoryModal({ isOpen, onClose, categories, onSuccess }: BulkCategoryModalProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState<number | null>(null);

    if (!isOpen) return null;

    const handlePreview = async () => {
        if (!startDate || !endDate) return;

        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .gte('date', new Date(startDate).toISOString())
            .lte('date', new Date(endDate).toISOString());

        if (keyword.trim()) {
            query = query.ilike('description', `%${keyword.trim()}%`);
        }

        const { count } = await query;
        setCount(count || 0);
    }

    const handleSubmit = async () => {
        if (!startDate || !endDate || !categoryId) return;
        setLoading(true);

        try {
            let query = supabase
                .from('transactions')
                .update({ category_id: categoryId })
                .gte('date', new Date(startDate).toISOString())
                .lte('date', new Date(endDate).toISOString());

            if (keyword.trim()) {
                query = query.ilike('description', `%${keyword.trim()}%`);
            }

            const { error } = await query;

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Errore aggiornamento massivo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white border-b border-slate-700">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50">
                        <X size={20} />
                    </button>
                    <h2 className="font-semibold flex items-center gap-2">
                        <Tag size={18} className="text-purple-400" /> Categorizzazione Massiva
                    </h2>
                    <div className="w-9"></div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">

                        {/* Keyword Filter */}
                        <div>
                            <label className="text-xs text-slate-400 ml-1 mb-1 block">Filtra per Esercente (Opzionale)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        setCount(null);
                                    }}
                                    placeholder="Es. Amazon, Bar, ecc."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 ml-1">
                                Lascia vuoto per modificare TUTTE le transazioni nel periodo.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400 ml-1 mb-1 block">Dal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCount(null);
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 ml-1 mb-1 block">Al</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCount(null);
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        {startDate && endDate && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center text-sm text-slate-300">
                                {count === null ? (
                                    <button onClick={handlePreview} className="text-purple-400 hover:text-purple-300 underline">
                                        Verifica quante transazioni
                                    </button>
                                ) : (
                                    <span>Verranno aggiornate <b>{count}</b> transazioni</span>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-slate-400 ml-1 mb-2 block">Applica Categoria</label>
                            <div className="grid grid-cols-4 gap-2">
                                {categories.map((cat) => {
                                    const Icon = getCategoryIcon(cat.name);
                                    const isSelected = categoryId === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategoryId(cat.id)}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${isSelected
                                                ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-[9px] truncate w-full text-center">{cat.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !startDate || !endDate || !categoryId}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Elaborazione...' : <><Check size={20} /> Applica Modifiche</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
