export enum AssetType {
  FixedDeposit = 'Fixed Deposit',
  Stock = 'Stock',
  REIT = 'REIT',
  Property = 'Property',
  EPF = 'EPF',
  Other = 'Other',
}

export enum AssetStatus {
  Active = 'Active',
  Mature = 'Mature',
  Sold = 'Sold',
}

export interface AssetRecord {
  id: string;
  date: string; // Stored as YYYY-MM-DD for sorting, displayed formatted
  type: AssetType;
  name: string;
  action: string;
  unitPrice?: number;
  quantity?: number;
  amount: number; // The Total Amount
  fee?: number;
  interestRate?: number; // Annual Interest Rate (%)
  interestDividend?: number;
  maturityDate?: string;
  status: AssetStatus;
  remarks?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  theme: 'light' | 'dark';
  language: 'en' | 'zh' | 'ms';
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  created_at: string;
  changed_by: string;
}