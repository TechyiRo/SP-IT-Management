import React from 'react';
import { X, Check } from 'lucide-react';
import clsx from 'clsx';

export const EMPLOYEE_THEMES = [
    { id: 'vibrant', name: 'Vibrant', color: 'bg-gradient-to-br from-[#4f46e5] via-[#a855f7] to-[#06b6d4]' },
    { id: 'minimal', name: 'Minimal Dark', color: 'bg-black border border-white/20' },
    { id: 'soft', name: 'Soft Light', color: 'bg-slate-100 border border-slate-300' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-black border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]' },
    { id: 'midnight', name: 'Midnight', color: 'bg-slate-950 border border-blue-500/30' },
    { id: 'forest', name: 'Forest', color: 'bg-stone-950 border border-emerald-500/30' },
    { id: 'sunset', name: 'Sunset', color: 'bg-orange-950 border border-orange-500/30' },
];

export const ADMIN_THEMES = [
    { id: 'neon', name: 'Neon Cyber', color: 'bg-black border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)]' },
    { id: 'royal', name: 'Royal Glass', color: 'bg-slate-900 border border-yellow-500/30' },
    { id: 'hud', name: 'Holographic HUD', color: 'bg-cyan-950/20 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]' },
    { id: 'mars', name: 'Mars Orbit', color: 'bg-stone-950 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
];

const ThemeSelectionModal = ({ isOpen, onClose, currentTheme, onSelectTheme, themes = EMPLOYEE_THEMES }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 md:animate-in md:zoom-in-95">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">Choose Theme</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => {
                                onSelectTheme(theme.id);
                                onClose();
                            }}
                            className={clsx(
                                "group relative flex flex-col items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                currentTheme === theme.id
                                    ? "bg-white/10 border-primary shadow-lg scale-[1.02]"
                                    : "bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20"
                            )}
                        >
                            {/* Theme Preview Circle */}
                            <div className={clsx("w-16 h-16 rounded-full shadow-lg mb-1", theme.color)}></div>

                            <span className={clsx(
                                "text-sm font-medium",
                                currentTheme === theme.id ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                            )}>
                                {theme.name}
                            </span>

                            {/* Active Indicator */}
                            {currentTheme === theme.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThemeSelectionModal;
