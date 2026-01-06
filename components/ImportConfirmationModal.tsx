import React, { useMemo } from 'react';
import { AssetRecord } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, FileText } from 'lucide-react';

interface ImportConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    candidates: AssetRecord[];
    isImporting: boolean;
}

const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    candidates,
    isImporting
}) => {
    // Calculate summary stats
    const summary = useMemo(() => {
        const totalAmountMYR = candidates
            .filter(r => (r.currency || 'MYR') === 'MYR')
            .reduce((sum, r) => sum + r.amount, 0);

        const totalAmountUSD = candidates
            .filter(r => r.currency === 'USD')
            .reduce((sum, r) => sum + r.amount, 0);

        const types = new Set(candidates.map(r => r.type));

        return {
            count: candidates.length,
            myrTotal: totalAmountMYR,
            usdTotal: totalAmountUSD,
            typesCount: types.size
        };
    }, [candidates]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="text-blue-500" />
                                Confirm Import
                            </h3>
                            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-800 dark:text-blue-200">
                                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-semibold mb-1">Review Import Data</p>
                                    <p>You are about to import <span className="font-bold">{summary.count}</span> records. Please valid the summary below before proceeding.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Total Records</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.count}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Asset Types</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.typesCount}</p>
                                </div>
                                {summary.myrTotal > 0 && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center col-span-2">
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Total Value (MYR)</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(summary.myrTotal)}
                                        </p>
                                    </div>
                                )}
                                {summary.usdTotal > 0 && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center col-span-2">
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Total Value (USD)</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.usdTotal)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Preview (First 3)</p>
                                {candidates.slice(0, 3).map((rec, idx) => (
                                    <div key={idx} className="text-xs flex justify-between py-1 border-b border-slate-200 dark:border-slate-800 last:border-0 text-slate-600 dark:text-slate-300">
                                        <span>{rec.date} - {rec.name}</span>
                                        <span className="font-mono">{rec.amount}</span>
                                    </div>
                                ))}
                                {candidates.length > 3 && <p className="text-xs text-slate-400 mt-2 text-center italic">+ {candidates.length - 3} more...</p>}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950">
                            <button
                                onClick={onClose}
                                disabled={isImporting}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Discard
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isImporting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all shadow-sm shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isImporting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Confirm Import
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ImportConfirmationModal;
