import React, { useState, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from '../types';
import { X, Save } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.date) return;
    
    onSave(formData as Omit<AssetRecord, 'id'>);
    onClose();
  };

  const handleChange = (field: keyof AssetRecord, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputClasses = "w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">
            {initialData ? 'Edit Record' : 'New Record'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => handleChange('date', e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Type</label>
              <select
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
                className={inputClasses}
              >
                {Object.values(AssetType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Name / Identifier</label>
            <input
              type="text"
              required
              placeholder="e.g. Maybank, EPF, Gold"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Action</label>
              <input
                type="text"
                list="actions"
                value={formData.action || ''}
                onChange={e => handleChange('action', e.target.value)}
                className={inputClasses}
              />
              <datalist id="actions">
                <option value="Buy" />
                <option value="Sell" />
                <option value="Dividend" />
                <option value="Deposit" />
                <option value="Self contribute" />
                <option value="Employee contribute" />
              </datalist>
            </div>
             <div>
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
                className={inputClasses}
              >
                {Object.values(AssetStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div>
              <label className={labelClasses}>Total Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                className={`${inputClasses} font-semibold`}
              />
            </div>
            <div>
              <label className={labelClasses}>Unit Price</label>
              <input
                type="number"
                step="0.001"
                value={formData.unitPrice || ''}
                onChange={e => handleChange('unitPrice', parseFloat(e.target.value))}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity || ''}
                onChange={e => handleChange('quantity', parseFloat(e.target.value))}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Int/Dividend</label>
              <input
                type="number"
                step="0.01"
                value={formData.interestDividend || ''}
                onChange={e => handleChange('interestDividend', parseFloat(e.target.value))}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Maturity Date</label>
              <input
                type="date"
                value={formData.maturityDate || ''}
                onChange={e => handleChange('maturityDate', e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Remarks</label>
            <textarea
              rows={3}
              value={formData.remarks || ''}
              onChange={e => handleChange('remarks', e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm shadow-blue-900/20"
            >
              <Save size={18} />
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;