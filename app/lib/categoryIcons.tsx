import {
    ShoppingCart,
    Utensils,
    Car,
    Home,
    Zap,
    Coffee,
    Gift,
    Briefcase,
    Plane,
    Dumbbell,
    Gamepad2,
    Stethoscope,
    GraduationCap,
    Cat,
    Smartphone,
    CreditCard,
    HelpCircle,
    Shirt,
    Music,
    Cloud,
    AlertTriangle,
    PiggyBank,
    Package,
    Armchair,
    Bike
} from 'lucide-react';
import React from 'react';

// Map of keywords to Lucide Icons
const iconMap: Record<string, React.ElementType> = {
    // User specific categories
    'fitness': Dumbbell,
    'spotify': Music,
    'icloud': Cloud,
    'motorino': Bike,
    'macchina': Car,
    'abbigliamento': Shirt,
    'imprevisti': AlertTriangle,
    'fondo pensione': PiggyBank,
    'amazon prime': Package,
    'arredo casa': Armchair,
    'spese mediche': Stethoscope,
    'pasti fuori': Utensils,
    'caffè/aperitivi': Coffee,

    // Generics
    'spesa': ShoppingCart,
    'supermercato': ShoppingCart,
    'ristorante': Utensils,
    'cibo': Utensils,
    'bar': Coffee,
    'colazione': Coffee,
    'auto': Car,
    'trasporti': Car,
    'benzina': Car,
    'casa': Home,
    'affitto': Home,
    'bollette': Zap,
    'luce': Zap,
    'gas': Zap,
    'internet': Smartphone,
    'telefono': Smartphone,
    'regali': Gift,
    'lavoro': Briefcase,
    'stipendio': Briefcase,
    'viaggi': Plane,
    'vacanza': Plane,
    'sport': Dumbbell,
    'palestra': Dumbbell,
    'svago': Gamepad2,
    'giochi': Gamepad2,
    'intrattenimento': Gamepad2,
    'salute': Stethoscope,
    'farmacia': Stethoscope,
    'medico': Stethoscope,
    'formazione': GraduationCap,
    'scuola': GraduationCap,
    'animali': Cat,
    'veterinario': Cat,
    'bonifico': CreditCard,
    'banca': CreditCard,
    'commissioni': CreditCard,
};

export const getCategoryIcon = (categoryName: string): React.ElementType => {
    if (!categoryName) return HelpCircle;

    const normalized = categoryName.toLowerCase().trim();

    // 1. Direct match
    if (iconMap[normalized]) return iconMap[normalized];

    // 2. Keyword match
    const key = Object.keys(iconMap).find(k => normalized.includes(k));
    if (key) return iconMap[key];

    // 3. Fallback
    return HelpCircle;
};

export const getCategoryColor = (categoryName: string): string => {
    // Optional: Mapping specific colors if needed, otherwise rely on DB colors
    // For now, we stick to the DB colors, but this could be an expansion point
    return '#10b981';
}
