import React, { useState, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from '../types';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<AssetRecord, 'id'>) => void;
  initialData?: AssetRecord | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<AssetRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: AssetType.Stock,
    status: AssetStatus.Active,
    action: 'Buy',
    amount: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: AssetType.Stock,
        status: AssetStatus.Active,
        action: 'Buy',
        amount: 0,
        name: '',
        quantity: 0,
        unitPrice: 0,
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 relative z-10 transition-colors duration-300"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-20">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {initialData ? 'Edit Record' : 'New Record'}
              </h2>
              <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!formData.name || !formData.amount || !formData.date) return;
              onSave(formData as Omit<AssetRecord, 'id'>);
              onClose();
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as AssetType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  >
                    {Object.values(AssetType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Name / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maybank, EPF, Gold"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Action</label>
                  {formData.type === AssetType.Property ? (
                    <select
                      value={formData.action || ''}
                      onChange={e => setFormData({ ...formData, action: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    >
                      <option value="">Select Action</option>
                      <option value="Pay">Pay</option>
                      <option value="Rent">Rent</option>
                      <option value="Buy">Buy</option>
                      <option value="Sold">Sold</option>
                      <option value="Renovation">Renovation</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        list="actions"
                        value={formData.action || ''}
                        onChange={e => setFormData({ ...formData, action: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      />
                      <datalist id="actions">
                        <option value="Buy" />
                        <option value="Sell" />
                        <option value="Dividend" />
                        <option value="Deposit" />
                        <option value="Self contribute" />
                        <option value="Employee contribute" />
                      </datalist>
                    </>
                  )}
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  >
                    {Object.values(AssetStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.unitPrice || ''}
                    onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Int/Dividend</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestDividend || ''}
                    onChange={e => setFormData({ ...formData, interestDividend: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Maturity Date</label>
                  <input
                    type="date"
                    value={formData.maturityDate || ''}
                    onChange={e => setFormData({ ...formData, maturityDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Remarks</label>
                <textarea
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm shadow-blue-900/20"
                >
                  <Save size={18} />
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionForm;