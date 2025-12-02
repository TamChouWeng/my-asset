import { AssetRecord } from '../types';

export const downloadCSV = (data: AssetRecord[]) => {
  const headers = [
    'Date',
    'Type',
    'Name',
    'Action',
    'Unit Price',
    'Quantity',
    'Total Amount',
    'Fee',
    'Interest/Dividend',
    'Maturity Date',
    'Status',
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
