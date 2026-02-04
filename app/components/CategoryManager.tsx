'use client'

import { useState } from 'react'
import { Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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

    const icons = ['📁', '🛒', '🚗', '🏠', '🍽️', '🛍️', '💊', '🎬', '📦', '💼', '🎮', '✈️', '🏋️', '📚', '🎁', '💡']
    const colors = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#14B8A6', '#EAB308', '#6B7280', '#EF4444', '#8B5CF6']

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
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    🏷️ Categorie
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    {isAdding ? '✕ Annulla' : '+ Nuova'}
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Add form */}
            {isAdding && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Es: Abbonamenti"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icona</label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setNewIcon(icon)}
                                    className={`w-10 h-10 rounded-lg text-xl transition-all
                    ${newIcon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Colore</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all
                    ${newColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !newName.trim()}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Categoria'}
                    </button>
                </div>
            )}

            {/* Categories list */}
            <div className="space-y-2">
                {categories.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nessuna categoria. Creane una!</p>
                ) : (
                    categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                    style={{ backgroundColor: cat.color + '20' }}
                                >
                                    {cat.icon}
                                </span>
                                <span className="font-medium text-gray-900">{cat.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
