import { AssetRecord, AssetStatus, AssetType } from './types';

// Helper to generate IDs
const uid = () => Math.random().toString(36).substr(2, 9);

// Data parsed from the user's provided CSV text for the initial state
export const INITIAL_DATA: AssetRecord[] = [
  // Block 1: Gold/Other
  {
    id: uid(),
    date: '2025-08-24',
    type: AssetType.Other,
    name: 'Buy Gold',
    action: 'Buy',
    unitPrice: 4850,
    quantity: 1,
    amount: 4850,
    status: AssetStatus.Active,
    remarks: 'Gold price: RM485/100g 999 Gold 10gram'
  },
  // Block 2: Fixed Deposits
  { id: uid(), date: '2025-07-01', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 11000, interestDividend: 203.5, maturityDate: '2026-01-07', status: AssetStatus.Active, remarks: 'Rate: 3.7%, Tenure: 6m' },
  { id: uid(), date: '2025-10-31', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 3000, interestDividend: 37.5, maturityDate: '2026-01-31', status: AssetStatus.Active, remarks: 'Rate: 5%, Tenure: 3m' },
  { id: uid(), date: '2025-08-06', type: AssetType.FixedDeposit, name: 'RHB', action: 'Deposit', amount: 5000, interestDividend: 86.25, maturityDate: '2026-02-06', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-08-28', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 5000, interestDividend: 86.25, maturityDate: '2026-02-28', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-05', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 15000, interestDividend: 258.75, maturityDate: '2026-03-05', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-12', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 8000, interestDividend: 138, maturityDate: '2026-03-12', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-20', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 6000, interestDividend: 106.5, maturityDate: '2026-03-20', status: AssetStatus.Active, remarks: 'Rate: 3.55%, Tenure: 6m' },
  { id: uid(), date: '2025-09-26', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 7000, interestDividend: 120.75, maturityDate: '2026-03-26', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-28', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 10000, interestDividend: 172.5, maturityDate: '2026-03-28', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-10-02', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 12000, interestDividend: 207, maturityDate: '2026-04-02', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-11-08', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 12000, interestDividend: 222, maturityDate: '2026-05-08', status: AssetStatus.Active, remarks: 'Rate: 3.7%, Tenure: 6m' },

  // Block 3: Property (Assuming negative pay is outflow, but for asset tracking we often track Equity or Value. 
  // For this list, we'll record them but maybe filtered in charts if negative)
  // Converting dates 27-11-2025 to 2025-11-27
  { id: uid(), date: '2025-11-27', type: AssetType.Property, name: 'The Skies', action: 'Pay', unitPrice: 110.1, quantity: 1, amount: 110.1, status: AssetStatus.Active, remarks: 'MLTA Dec 2025' },
  { id: uid(), date: '2025-08-01', type: AssetType.Property, name: 'The Skies', action: 'Pay', unitPrice: 1000, quantity: 1, amount: 1000, status: AssetStatus.Active, remarks: 'Downpay for 1 time' },

  // Block 4: EPF/Stock/REIT
  { id: uid(), date: '2025-11-27', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-11-07', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 1334, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-11-06', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-30', type: AssetType.Stock, name: 'KOPI', action: 'Buy', unitPrice: 1.4, quantity: 200, amount: 280, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-29', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-15', type: AssetType.REIT, name: 'SUNWAY', action: 'Buy', unitPrice: 5.54, quantity: 100, amount: 554, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-17', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 2.42, quantity: 200, amount: 484, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-15', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 2.4, quantity: 200, amount: 480, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-09', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 1380, quantity: 1, status: AssetStatus.Active },
  
  // Dividends (Usually Action: Dividend, Amount is 0 in the user CSV but Fee/Interest has value. I will normalize Amount to the Interest Value for tracking purpose if 0)
  { id: uid(), date: '2025-09-26', type: AssetType.Stock, name: 'PBBANK', action: 'Dividend', amount: 10.5, interestDividend: 10.5, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-25', type: AssetType.Stock, name: 'AMWAY', action: 'Dividend', amount: 10, interestDividend: 10, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Dividend', amount: 120, interestDividend: 120, status: AssetStatus.Active },
  
  { id: uid(), date: '2025-09-25', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-17', type: AssetType.REIT, name: 'SUNREIT', action: 'Buy', unitPrice: 2.05, quantity: 200, amount: 410, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-12', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 3312, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-10', type: AssetType.REIT, name: 'PAVREIT', action: 'Buy', unitPrice: 1.75, quantity: 100, amount: 175, status: AssetStatus.Active },

  // Aug 26 Stock Spree
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'AMWAY', action: 'Buy', unitPrice: 6.83, quantity: 200, amount: 1366, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'BIMB', action: 'Buy', unitPrice: 2.47, quantity: 100, amount: 247, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 1.47, quantity: 200, amount: 294, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'GENTING', action: 'Buy', unitPrice: 4.14, quantity: 100, amount: 414, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'KOPI', action: 'Buy', unitPrice: 0.867, quantity: 200, amount: 173.4, status: AssetStatus.Mature, remarks: 'Rakuten Trade' }, // Status Mature in CSV
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Buy', unitPrice: 9.7, quantity: 100, amount: 970, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PADINI', action: 'Buy', unitPrice: 2.18, quantity: 100, amount: 218, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PBBANK', action: 'Buy', unitPrice: 4.36, quantity: 100, amount: 436, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'SIME', action: 'Buy', unitPrice: 2.22, quantity: 100, amount: 222, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'BIMB', action: 'Buy', unitPrice: 2.33, quantity: 200, amount: 466, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Buy', unitPrice: 9.92, quantity: 400, amount: 3968, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PBBANK', action: 'Buy', unitPrice: 4.335, quantity: 200, amount: 867, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'RHBBANK', action: 'Buy', unitPrice: 6.15, quantity: 100, amount: 615, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'TM', action: 'Buy', unitPrice: 6.62, quantity: 200, amount: 1324, status: AssetStatus.Active, remarks: 'M+ Global' },

  // Big EPF entry
  { id: uid(), date: '2025-08-24', type: AssetType.EPF, name: 'EPF', action: 'Balance', amount: 62824.81, quantity: 1, status: AssetStatus.Active, remarks: 'EPF by far' },

  // Older EPF
  { id: uid(), date: '2025-08-06', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-07-24', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-06-13', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 500, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-05-16', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
];

export const COLORS: Record<AssetType, string> = {
  [AssetType.Stock]: '#3b82f6', // blue-500
  [AssetType.FixedDeposit]: '#10b981', // emerald-500
  [AssetType.EPF]: '#8b5cf6', // violet-500
  [AssetType.REIT]: '#f59e0b', // amber-500
  [AssetType.Property]: '#ef4444', // red-500
  [AssetType.Other]: '#64748b', // slate-500
};
