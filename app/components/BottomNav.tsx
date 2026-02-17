import React from 'react';
import { Home, Layers, Plus, Repeat, User } from 'lucide-react';

type Tab = 'home' | 'transactions' | 'recurring' | 'account';

interface BottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onAddClick: () => void;
}

export default function BottomNav({ activeTab, onTabChange, onAddClick }: BottomNavProps) {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'transactions', icon: Layers, label: 'Transazioni' },
        { id: 'add', icon: Plus, label: '', isFab: true },
        { id: 'recurring', icon: Repeat, label: 'Ricorrenti' },
        { id: 'account', icon: User, label: 'Account' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-end max-w-md mx-auto">
                {navItems.map((item) => {
                    if (item.id === 'add') {
                        return (
                            <div key={item.id} className="relative -top-5">
                                <button
                                    onClick={onAddClick}
                                    className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform active:scale-95"
                                >
                                    <Plus size={28} strokeWidth={2.5} />
                                </button>
                            </div>
                        )
                    }

                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id as Tab)}
                            className={`flex flex-col items-center gap-1 py-3 w-16 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
