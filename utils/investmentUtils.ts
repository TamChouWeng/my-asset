import { AssetRecord, AssetType, AssetStatus } from '../types';
import { ACTION_MULTIPLIERS } from '../constants';

export interface Lot {
    id: string;
    date: string;
    quantity: number;
    purchasePrice: number;
}

export interface Holding {
    key: string; // ticker if known, else name (grouping key)
    name: string;
    ticker?: string;
    exchange?: string;
    type: AssetType.Stock | AssetType.ETF;
    currency: string;
    quantity: number;
    avgBuyPrice: number;
    lots: Lot[]; // FIFO-remaining purchase lots still held
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
    const groups = new Map<string, AssetRecord[]>();

    records.forEach(record => {
        if ((record.currency || 'MYR') !== currency) return;
        if (record.type !== AssetType.Stock && record.type !== AssetType.ETF) return;
        if (assetClass !== 'All' && record.type !== assetClass) return;
        if (record.status !== AssetStatus.Active && record.status !== AssetStatus.Sold) return;

        const key = record.ticker || record.name;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(record);
    });

    const result: Holding[] = [];

    groups.forEach((groupRecords, key) => {
        const sorted = [...groupRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let currentQty = 0;
        let avgBuyPrice = 0;
        let name = sorted[0].name;
        let ticker = sorted.find(r => r.ticker)?.ticker;
        let exchange = sorted.find(r => r.exchange)?.exchange;
        let type = sorted[0].type as AssetType.Stock | AssetType.ETF;
        // FIFO queue of still-held purchase lots, built alongside the moving-average
        // avgBuyPrice below from the same chronological Buy/Sold walk.
        let lotQueue: Lot[] = [];

        sorted.forEach(record => {
            if (record.name && !name) name = record.name;
            if (record.ticker && !ticker) ticker = record.ticker;
            if (record.exchange && !exchange) exchange = record.exchange;

            const isSold = record.status === AssetStatus.Sold || record.action.toLowerCase() === 'sold';
            const qty = record.quantity || 0;

            if (isSold) {
                if (qty >= currentQty) {
                    currentQty = 0;
                    avgBuyPrice = 0;
                    lotQueue = [];
                } else {
                    currentQty -= qty;
                    let toConsume = qty;
                    while (toConsume > 0.000001 && lotQueue.length > 0) {
                        const front = lotQueue[0];
                        if (front.quantity <= toConsume + 0.000001) {
                            toConsume -= front.quantity;
                            lotQueue.shift();
                        } else {
                            front.quantity -= toConsume;
                            toConsume = 0;
                        }
                    }
                }
            } else {
                const buyCost = record.amount;
                const buyPrice = qty > 0 ? buyCost / qty : (record.unitPrice || 0);
                const newQty = currentQty + qty;
                if (newQty > 0) {
                    avgBuyPrice = ((currentQty * avgBuyPrice) + (qty * buyPrice)) / newQty;
                    currentQty = newQty;
                }
                if (qty > 0) {
                    lotQueue.push({ id: record.id, date: record.date, quantity: qty, purchasePrice: buyPrice });
                }
            }
        });

        if (currentQty > 0.000001) {
            // ponytail: moving average cost basis calculated chronologically; reset on full sell.
            result.push({
                key,
                name,
                ticker,
                exchange,
                type,
                currency,
                quantity: currentQty,
                avgBuyPrice,
                lots: lotQueue,
            });
        }
    });

    return result.sort((a, b) => (b.quantity * b.avgBuyPrice) - (a.quantity * a.avgBuyPrice));
};
