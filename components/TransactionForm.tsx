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
  // Use local date instead of UTC to prevent 'yesterday' bug in Asian timezones
  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
  };

  const [formData, setFormData] = useState<Partial<AssetRecord>>({
    date: getTodayDate(),
    type: AssetType.Stock,
    status: AssetStatus.Active,
    action: 'Buy',
    amount: 0,
    unitPrice: 0,
    quantity: 0,
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Reset form on new entry
      setFormData({
        date: getTodayDate(),
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
    // Clear errors when opening/changing record
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    // Mandatory fields check
    if (!formData.date) newErrors.date = true;
    if (!formData.type) newErrors.type = true;
    if (!formData.name?.trim()) newErrors.name = true;
    if (!formData.action) newErrors.action = true;
    if (!formData.status) newErrors.status = true;
    
    // Ensure numbers are entered (allow 0 if specifically needed, but usually we want > 0, 
    // checking for undefined or null here essentially)
    if (formData.unitPrice === undefined || formData.unitPrice === null || formData.unitPrice === 0 && formData.action !== 'Dividend') { 
       // Note: Allowing 0 for unit price might be valid for gifts/airdrops, but let's strict validate based on request
       // Keeping simple check for empty/undefined mainly.
    }
    
    // Check strict numeric requirement if user wants 'filled in'
    if (formData.unitPrice === undefined || String(formData.unitPrice) === '') newErrors.unitPrice = true;
    if (formData.quantity === undefined || String(formData.quantity) === '') newErrors.quantity = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData as Omit<AssetRecord, 'id'>);
      onClose();
    }
  };

  // Helper to handle numeric inputs and auto-calc amount
  const handleNumericChange = (field: 'unitPrice' | 'quantity', value: string) => {
    const numValue = parseFloat(value);
    
    // Update the specific field
    const updatedData = {
      ...formData,
      [field]: isNaN(numValue) ? 0 : numValue
    };

    // Auto calculate Total Amount = Price * Qty
    const price = field === 'unitPrice' ? (isNaN(numValue) ? 0 : numValue) : (updatedData.unitPrice || 0);
    const qty = field === 'quantity' ? (isNaN(numValue) ? 0 : numValue) : (updatedData.quantity || 0);
    
    updatedData.amount = parseFloat((price * qty).toFixed(2));

    setFormData(updatedData);
    
    // Clear error if exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-shadow";
    if (errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-200`;
    }
    return `${baseClass} border-slate-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500`;
  };

  const MandatoryMark = () => <span className="text-red-500 ml-1">*</span>;

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
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-20">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {initialData ? 'Edit Record' : 'New Record'}
              </h2>
              <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Row 1: Date & Type - Stack on mobile, Side-by-side on tablet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Date <MandatoryMark />
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => {
                      setFormData({ ...formData, date: e.target.value });
                      if (errors.date) setErrors({ ...errors, date: false });
                    }}
                    className={`${getInputClass('date')} block w-full min-w-full`}
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Type <MandatoryMark />
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => {
                      const newType = e.target.value as AssetType;
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        action: newType === AssetType.Property ? 'Pay' : 'Buy'
                      });
                      if (errors.type) setErrors({ ...errors, type: false });
                    }}
                    className={getInputClass('type')}
                  >
                    {Object.values(AssetType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name - Always full width */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Name / Identifier <MandatoryMark />
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maybank, EPF, Gold"
                  value={formData.name || ''}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: false });
                  }}
                  className={getInputClass('name')}
                />
              </div>

              {/* Row 3: Action & Status - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Action <MandatoryMark />
                  </label>
                  {formData.type === AssetType.Property ? (
                    <select
                      value={formData.action || ''}
                      onChange={e => {
                        setFormData({ ...formData, action: e.target.value });
                        if (errors.action) setErrors({ ...errors, action: false });
                      }}
                      className={getInputClass('action')}
                    >
                      <option value="Pay">Pay</option>
                      <option value="Rent">Rent</option>
                      <option value="Sold">Sold</option>
                      <option value="Renovation">Renovation</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  ) : (
                    <select
                      value={formData.action || ''}
                      onChange={e => {
                        setFormData({ ...formData, action: e.target.value });
                        if (errors.action) setErrors({ ...errors, action: false });
                      }}
                      className={getInputClass('action')}
                    >
                      <option value="Buy">Buy</option>
                      <option value="Sold">Sold</option>
                      <option value="Dividend">Dividend</option>
                    </select>
                  )}
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Status <MandatoryMark />
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      setFormData({ ...formData, status: e.target.value as AssetStatus });
                      if (errors.status) setErrors({ ...errors, status: false });
                    }}
                    className={getInputClass('status')}
                  >
                    {Object.values(AssetStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Price, Qty, Total Amount - Stack all on mobile, 3-col on Tablet */}
              {/* Logic: Unit Price * Qty = Total Amount (Auto Calculated) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Unit Price <MandatoryMark />
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.unitPrice || ''}
                    onChange={e => handleNumericChange('unitPrice', e.target.value)}
                    className={getInputClass('unitPrice')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Quantity <MandatoryMark />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity || ''}
                    onChange={e => handleNumericChange('quantity', e.target.value)}
                    className={getInputClass('quantity')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    value={formData.amount}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-not-allowed font-semibold focus:outline-none"
                    title="Auto-calculated: Unit Price * Quantity"
                  />
                </div>
              </div>

              {/* Row 5: Interest & Maturity - Stack on mobile */}
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

              {/* Row 6: Remarks - Always full width */}
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