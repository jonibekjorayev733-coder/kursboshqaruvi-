import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Edit, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  type: 'delete' | 'edit';
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, type, title, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              type === 'delete' ? 'bg-red-500/20 border border-red-500/40' : 'bg-cyan-500/20 border border-cyan-500/40'
            }`}>
              {type === 'delete'
                ? <Trash2 className="w-7 h-7 text-red-400" />
                : <Edit className="w-7 h-7 text-cyan-400" />
              }
            </div>

            {/* Title */}
            <h3 className="text-white font-black text-xl text-center mb-2">
              {type === 'delete' ? 'O\'chirishni tasdiqlang' : 'Tahrirlashni tasdiqlang'}
            </h3>

            {/* Subtitle */}
            <p className="text-slate-400 text-sm text-center mb-6">
              {type === 'delete'
                ? <>Rostdan ham <span className="text-red-300 font-black">o'chirasizmi</span>? Bu amalni bekor qilib bo'lmaydi.</>
                : <>Ushbu ma'lumotni <span className="text-cyan-300 font-black">tahrirlashni</span> xohlaysizmi?</>
              }
              {title && <><br/><span className="text-white font-semibold mt-1 block">"{title}"</span></>}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-black text-sm uppercase transition-colors"
              >
                Bekor
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-xl text-white font-black text-sm uppercase transition-all ${
                  type === 'delete'
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:shadow-lg hover:shadow-red-500/40'
                    : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/40'
                }`}
              >
                {type === 'delete' ? "Ha, o'chirish" : 'Ha, tahrirlash'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
