'use client'

import { useState, useEffect } from 'react'
import { Transaction, Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { X, Check, Zap } from 'lucide-react'
import { getCategoryIcon } from '@/app/lib/categoryIcons'

type EditTransactionModalProps = {
    isOpen: boolean
    transaction: Transaction | null
    categories: Category[]
    onClose: () => void
    onSuccess: (updatedTransaction: Transaction) => void
}

export default function EditTransactionModal({
    isOpen,
    transaction,
    categories,
    onClose,
    onSuccess
}: EditTransactionModalProps) {
    const [date, setDate] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<string | number>('')
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [categoryId, setCategoryId] = useState('')
    const [isRecurring, setIsRecurring] = useState(false)
    const [createRule, setCreateRule] = useState(false)

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (transaction && isOpen) {
            setDate(new Date(transaction.date).toISOString().split('T')[0])
            setDescription(transaction.description || '')
            setAmount(Math.abs(transaction.amount))
            setType(transaction.type)
            setCategoryId(transaction.category_id || '')
            setIsRecurring(transaction.is_recurring || false)
            setCreateRule(false)
        }
    }, [transaction, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !transaction) return

        setIsLoading(true)

        try {
            const finalAmount = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount))

            const { data, error } = await supabase
                .from('transactions')
                .update({
                    date: new Date(date).toISOString(),
                    description: description.trim(),
                    amount: finalAmount,
                    type,
                    category_id: categoryId || null,
                    is_recurring: isRecurring
                })
                .eq('id', transaction.id)
                .select()
                .single()

            if (error) throw error

            // Create Smart Rule if requested
            if (createRule && description && categoryId) {
                const { error: ruleError } = await supabase
                    .from('merchant_rules')
                    .insert({
                        merchant_pattern: description,
                        category_id: categoryId
                    })

                if (ruleError) console.error('Error creating smart rule:', ruleError)
            }

            onSuccess(data)
            onClose()
        } catch (err: any) {
            console.error(err)
            alert('Errore aggiornamento')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen || !transaction) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50">
                        <X size={20} />
                    </button>
                    <h2 className="font-semibold">Modifica</h2>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="p-2 rounded-full bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
                    >
                        <Check size={20} className="stroke-[3]" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Amount Input */}
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${type === 'expense' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}
                            >
                                Uscita
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
                            >
                                Entrata
                            </button>
                        </div>

                        <div className="relative inline-block w-full">
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>€</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-5xl font-bold text-center text-white placeholder-slate-600 focus:outline-none pl-8"
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1 ml-1">Descrizione</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
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
                            <span className="text-sm text-slate-300">Ricorsivo (mensile)</span>
                            <button
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        {/* Smart Rule Toggle */}
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-yellow-400" />
                                <span className="text-sm text-slate-300">Ricorda per il futuro</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateRule(!createRule)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${createRule ? 'bg-yellow-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${createRule ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        {/* Categories */}
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
                </div>
            </div>
        </div>
    )
}
