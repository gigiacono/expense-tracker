'use client'

import { useState } from 'react'
import { Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Plus, X, Trash2 } from 'lucide-react'
import { getCategoryIcon } from '@/app/lib/categoryIcons'

type CategoryManagerProps = {
    categories: Category[]
    onUpdate: () => void
}

export default function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [newIcon, setNewIcon] = useState('📁')
    const [newColor, setNewColor] = useState('#6B7280')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const colors = ['#10b981', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#6b7280', '#ef4444', '#8b5cf6']

    const handleAdd = async () => {
        if (!newName.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('categories')
                .insert({ name: newName, icon: newIcon, color: newColor })

            if (error) throw error

            setNewName('')
            setNewIcon('📁')
            setNewColor('#6B7280')
            setIsAdding(false)
            onUpdate()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error
            onUpdate()
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-200 text-sm">🏷️ Categorie</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isAdding
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                        }`}
                >
                    {isAdding ? <><X size={12} /> Annulla</> : <><Plus size={12} /> Nuova</>}
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                    ❌ {error}
                </div>
            )}

            {/* Add form */}
            {isAdding && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Nome</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Es: Abbonamenti"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Colore</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewColor(color)}
                                    className={`w-7 h-7 rounded-full transition-all ${newColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-emerald-500 scale-110' : 'opacity-70 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !newName.trim()}
                        className="w-full bg-emerald-500 text-slate-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Categoria'}
                    </button>
                </div>
            )}

            {/* Categories list */}
            <div className="space-y-1">
                {categories.length === 0 ? (
                    <p className="text-slate-500 text-center text-sm py-4">Nessuna categoria. Creane una!</p>
                ) : (
                    categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.name)
                        return (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/50 group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: cat.color + '20' }}
                                    >
                                        <Icon size={16} style={{ color: cat.color }} />
                                    </div>
                                    <span className="text-sm text-slate-200">{cat.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
