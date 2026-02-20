import React from 'react';
import { Delete } from 'lucide-react';

interface NumericKeyboardProps {
    value: string;
    onChange: (value: string) => void;
}

export default function NumericKeyboard({ value, onChange }: NumericKeyboardProps) {
    const handlePress = (key: string) => {
        if (key === 'delete') {
            onChange(value.slice(0, -1));
        } else if (key === '.') {
            if (!value.includes('.')) {
                onChange(value === '' ? '0.' : value + '.');
            }
        } else {
            // Prevent too many decimals
            if (value.includes('.') && value.split('.')[1].length >= 2) return;
            // Prevent leading zeros issues
            if (value === '0' && key !== '.') {
                onChange(key);
            } else {
                onChange(value + key);
            }
        }
    };

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0', 'delete'
    ];

    return (
        <div className="grid grid-cols-3 gap-2 mt-4 max-w-[280px] mx-auto w-full">
            {keys.map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => handlePress(key)}
                    className="h-14 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-2xl flex items-center justify-center text-2xl font-medium text-white transition-colors border border-slate-700/50"
                >
                    {key === 'delete' ? <Delete size={24} className="text-slate-400" /> : key}
                </button>
            ))}
        </div>
    );
}
