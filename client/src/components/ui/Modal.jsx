import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 pt-4 sm:pt-10 pb-10" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="glass-card w-full max-w-lg relative flex flex-col shrink-0 mb-10 overflow-hidden"
                    style={{ maxHeight: 'calc(100% - 2rem)' }}
                >
                    <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 shrink-0">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">{title}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                        {children}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default Modal;
