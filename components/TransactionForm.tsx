import React, { useState, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from '../types';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<AssetRecord, 'id'>) => void;
  initialData?: AssetRecord | null;
  defaultCurrency: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSave, initialData, defaultCurrency }) => {
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
    interestRate: 0,
    currency: defaultCurrency
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
        remarks: '',
        interestRate: 0,
        interestDividend: 0,
        currency: defaultCurrency
      });
    }
    // Clear errors when opening/changing record
    setErrors({});
  }, [initialData, isOpen]);

  // Auto-calculate FD Interest
  useEffect(() => {
    if (
      formData.type === AssetType.FixedDeposit &&
      formData.amount &&
      formData.amount > 0 &&
      formData.interestRate &&
      formData.interestRate > 0 &&
      formData.date &&
      formData.maturityDate
    ) {
      const start = new Date(formData.date);
      const end = new Date(formData.maturityDate);

      // Calculate difference in milliseconds
      const diffTime = end.getTime() - start.getTime();
      // Convert to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        // Simple Interest Formula: (Principal * Rate * Days) / (365 * 100)
        const calculatedInterest = (formData.amount * formData.interestRate * diffDays) / 36500;
        setFormData(prev => ({
          ...prev,
          interestDividend: parseFloat(calculatedInterest.toFixed(2))
        }));
      } else {
        setFormData(prev => ({ ...prev, interestDividend: 0 }));
      }
    }
  }, [formData.amount, formData.interestRate, formData.date, formData.maturityDate, formData.type]);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    // Mandatory fields check
    if (!formData.date) newErrors.date = true;
    if (!formData.type) newErrors.type = true;
    if (!formData.name?.trim()) newErrors.name = true;
    if (!formData.action) newErrors.action = true;
    if (!formData.status) newErrors.status = true;

    // Check strict numeric requirement
    if (formData.unitPrice === undefined || String(formData.unitPrice) === '') newErrors.unitPrice = true;
    if (formData.quantity === undefined || String(formData.quantity) === '') newErrors.quantity = true;

    // Fixed Deposit Specific Validation
    if (formData.type === AssetType.FixedDeposit) {
      if (!formData.maturityDate) newErrors.maturityDate = true;
    }

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
                    onKeyDown={(e) => e.preventDefault()} // Prevent typing
                    onClick={(e) => e.currentTarget.showPicker()} // Open picker on click
                    className={`${getInputClass('date')} block w-full min-w-full cursor-pointer`}
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
                      let defaultAction = 'Buy';
                      if (newType === AssetType.Property) defaultAction = 'Pay';
                      if (newType === AssetType.EPF) defaultAction = 'Self contribute';

                      setFormData({
                        ...formData,
                        type: newType,
                        action: defaultAction,
                        interestRate: 0, // Reset interest rate on type change
                        interestDividend: 0
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
                  ) : formData.type === AssetType.EPF ? (
                    <select
                      value={formData.action || ''}
                      onChange={e => {
                        setFormData({ ...formData, action: e.target.value });
                        if (errors.action) setErrors({ ...errors, action: false });
                      }}
                      className={getInputClass('action')}
                    >
                      <option value="Self contribute">Self contribute</option>
                      <option value="Employee contribute">Employee contribute</option>
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

              {/* Row 5: FD Specifics or General Interest */}
              {formData.type === AssetType.FixedDeposit && (
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Interest Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interestRate || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, interestRate: isNaN(val) ? 0 : val });
                      }}
                      placeholder="e.g. 3.5"
                      className={getInputClass('interestRate')}
                    />
                  </div>
                </div>
              )}

              {/* Row 6: Interest & Maturity - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {formData.type === AssetType.FixedDeposit ? "Expected Interest (Auto)" : "Int/Dividend"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly={formData.type === AssetType.FixedDeposit}
                    value={formData.interestDividend || ''}
                    onChange={e => {
                      if (formData.type !== AssetType.FixedDeposit) {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, interestDividend: isNaN(val) ? 0 : val });
                      }
                    }}
                    className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg outline-none transition-shadow ${formData.type === AssetType.FixedDeposit
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Maturity Date {formData.type === AssetType.FixedDeposit && <MandatoryMark />}
                  </label>
                  <input
                    type="date"
                    value={formData.maturityDate || ''}
                    onChange={e => {
                      setFormData({ ...formData, maturityDate: e.target.value });
                      if (errors.maturityDate) setErrors({ ...errors, maturityDate: false });
                    }}
                    onKeyDown={(e) => e.preventDefault()} // Prevent typing
                    onClick={(e) => e.currentTarget.showPicker()} // Open picker on click
                    className={`${getInputClass('maturityDate')} cursor-pointer`}
                  />
                </div>
              </div>

              {/* Row 7: Remarks - Always full width */}
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