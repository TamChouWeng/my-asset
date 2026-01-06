import { AssetRecord } from '../types';

export const downloadCSV = (data: AssetRecord[]) => {
  const headers = [
    'Date',
    'Type',
    'Name',
    'Action',
    'Unit Price',
    'Quantity',
    'Amount',
    'Fee',
    'Interest/Dividend',
    'Maturity Date',
    'Status',
    'Currency',
    'Remarks'
  ];

  const rows = data.map(item => [
    item.date,
    item.type,
    `"${item.name}"`, // Quote strings to handle commas
    item.action,
    item.unitPrice || '',
    item.quantity || '',
    item.amount,
    item.fee || '',
    item.interestDividend || '',
    item.maturityDate || '',
    item.status,
    item.currency || 'MYR',
    `"${item.remarks || ''}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `my_asset_history_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';

  // Try to handle various separators: - / .
  const parts = dateStr.split(/[-/.]/);
  if (parts.length !== 3) return dateStr;

  let day, month, year;

  // Check if it's already YYYY-MM-DD
  if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    // Assume DD-MM-YY or DD-MM-YYYY
    day = parts[0];
    month = parts[1];
    year = parts[2];

    if (year.length === 2) {
      // 20xx for years < 70, 19xx for years >= 70
      year = parseInt(year) < 70 ? `20${year}` : `19${year}`;
    }
  }

  // Pad with zeros
  const pad = (s: string) => s.padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const parseCSV = async (file: File): Promise<AssetRecord[]> => {
  const text = await file.text();
  const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

  if (rows.length < 2) {
    throw new Error('CSV file is empty or missing headers');
  }

  // Basic CSV Parser that handles quotes
  const parseRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    // Remove potential surrounding quotes from values
    return result.map(val => val.replace(/^"|"$/g, '').trim());
  };

  const headers = parseRow(rows[0]);

  // Validation: Check required headers
  const requiredHeaders = ['Date', 'Type', 'Name', 'Action', 'Amount', 'Status'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const records: AssetRecord[] = [];
  const startRowIndex = 1;

  for (let i = startRowIndex; i < rows.length; i++) {
    const rawValues = parseRow(rows[i]);

    // Skip empty lines or mismatched columns
    if (rawValues.length < headers.length) continue;

    const rowObj: any = {};
    headers.forEach((header, index) => {
      rowObj[header] = rawValues[index];
    });

    // Clean and validate data types
    const parseAmount = (val: string) => parseFloat(val) || 0;
    const parseNumber = (val: string) => val ? parseFloat(val) : undefined;

    // Create new record
    const record: any = {
      // Temporary ID, will be replaced by database or uuid
      id: crypto.randomUUID(),
      date: normalizeDate(rowObj['Date']),
      type: rowObj['Type'],
      name: rowObj['Name'],
      action: rowObj['Action'],
      unitPrice: parseNumber(rowObj['Unit Price']),
      quantity: parseNumber(rowObj['Quantity']),
      amount: parseAmount(rowObj['Amount'] || rowObj['Total Amount']), // Support both for backward compatibility
      fee: parseNumber(rowObj['Fee']),
      interestDividend: parseNumber(rowObj['Interest/Dividend']),
      maturityDate: normalizeDate(rowObj['Maturity Date']),
      status: rowObj['Status'],
      currency: rowObj['Currency'] || 'MYR',
      remarks: rowObj['Remarks']
    };

    // Clean undefined keys
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);

    records.push(record);
  }

  return records;
};
