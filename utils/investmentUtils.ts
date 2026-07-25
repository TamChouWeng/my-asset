import { AssetRecord, AssetType, AssetStatus } from '../types';
import { ACTION_MULTIPLIERS } from '../constants';

export interface Holding {
    key: string; // ticker if known, else name (grouping key)
    name: string;
    ticker?: string;
    exchange?: string;
    type: AssetType.Stock | AssetType.ETF;
    currency: string;
    quantity: number;
    avgBuyPrice: number;
}

/**
 * Groups active Stock/ETF records by ticker (falling back to name when no
 * ticker was entered) and derives net quantity + weighted average buy price.
 */
export const aggregateHoldings = (
    records: AssetRecord[],
    currency: string,
    assetClass: 'All' | AssetType.Stock | AssetType.ETF = 'All'
): Holding[] => {
    const map = new Map<string, Holding & { totalBuyCost: number; totalBuyQty: number }>();

    records.forEach(record => {
        if ((record.currency || 'MYR') !== currency) return;
        if (record.type !== AssetType.Stock && record.type !== AssetType.ETF) return;
        if (assetClass !== 'All' && record.type !== assetClass) return;
        if (record.status !== AssetStatus.Active && record.status !== AssetStatus.Sold) return;

        const key = record.ticker || record.name;
        if (!map.has(key)) {
            map.set(key, {
                key,
                name: record.name,
                ticker: record.ticker,
                exchange: record.exchange,
                type: record.type,
                currency: record.currency || 'MYR',
                quantity: 0,
                avgBuyPrice: 0,
                totalBuyCost: 0,
                totalBuyQty: 0,
            });
        }

        const holding = map.get(key)!;
        if (!holding.ticker && record.ticker) holding.ticker = record.ticker;
        if (!holding.exchange && record.exchange) holding.exchange = record.exchange;

        const isSold = record.status === AssetStatus.Sold || record.action.toLowerCase() === 'sold';
        const multiplier = isSold ? -1 : (ACTION_MULTIPLIERS[record.action.toLowerCase()] ?? 1);
        const qty = record.quantity || 0;

        holding.quantity += qty * multiplier;

        if (!isSold && multiplier > 0 && qty > 0) {
            holding.totalBuyCost += record.amount;
            holding.totalBuyQty += qty;
        }
    });

    const result: Holding[] = [];
    map.forEach(holding => {
        if (holding.quantity <= 0.000001) return;
        holding.avgBuyPrice = holding.totalBuyQty > 0 ? holding.totalBuyCost / holding.totalBuyQty : 0;
        result.push(holding);
    });

    return result.sort((a, b) => (b.quantity * b.avgBuyPrice) - (a.quantity * a.avgBuyPrice));
};
