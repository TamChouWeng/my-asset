import { AssetRecord, AssetType, AssetStatus } from '../types';
import { ACTION_MULTIPLIERS } from '../constants';

export interface AggregatedAsset {
    name: string;
    type: AssetType;
    currency: string;
    netQty: number;
    netValue: number;      // Current Value to Display
    totalBuyCost: number;
    totalSellProceeds: number;
    avgCost: number;       // Calculated Average Cost
}

/**
 * Aggregates asset records to calculate current holdings and value.
 * 
 * Logic Modified:
 * - Stocks/ETFs/REITs:
 *   - Group by Name.
 *   - Value = (Remaining Units * Average Cost).
 *   - IF Remaining Units <= 0, Value = 0 (Excluded).
 *   - This strictly filters out fully sold assets.
 * 
 * - Other Assets (Fixed Deposit, Property, etc):
 *   - Value = Net Amount (Inflows - Outflows).
 * 
 * @param records All asset records
 * @param filterType 'All' or specific AssetType
 * @param selectedCurrency Currency to filter by (default 'MYR')
 * @returns Array of aggregated asset data
 */
export const aggregateAssetData = (
    records: AssetRecord[],
    filterType: string = 'All',
    selectedCurrency: string = 'MYR'
): AggregatedAsset[] => {
    const holdings = new Map<string, AggregatedAsset>();

    // 1. Filter by Currency first
    const currencyRecords = records.filter(r => (r.currency || 'MYR') === selectedCurrency);

    // 2. Identify Active Assets (We only care about assets that are currently marked Active in at least one record?)
    // Actually, the new requirement implies we should look at NET UNITS.
    // But usually "Active" status is a good first filter. 
    // Let's stick to: If an asset has ANY "Active" record, we consider it "Active" for calculation.
    // OR, we just process ALL records and let the Net Unit = 0 logic hide it.
    // The user said: "If no more remaining unit, then should be no display this asset anymore at piechart."
    // So we should calculate Net Units for EVERYTHING.

    // However, we probably still want to filter out "Sold" or "Mature" status records if they aren't contributing to the current holding?
    // No, "Sold" records REDUCE the holding. "Active" records INCREASE it (usually).
    // So we need ALL records for a given asset name to get the true Net Quantity.

    // Let's group ALL records by name first.
    currencyRecords.forEach(record => {
        // Basic Filter: If we are filtering by Type, ignore others
        if (filterType !== 'All' && record.type !== filterType) return;

        // Allow Active and Sold records to compute net holdings
        if (!record.status || (record.status.toLowerCase() !== AssetStatus.Active.toLowerCase() && record.status.toLowerCase() !== AssetStatus.Sold.toLowerCase())) return;

        // Initialize if new
        if (!holdings.has(record.name)) {
            holdings.set(record.name, {
                name: record.name,
                type: record.type,
                currency: record.currency || 'MYR',
                netQty: 0,
                netValue: 0, // Will be calculated at the end for unit-based
                totalBuyCost: 0,
                totalSellProceeds: 0,
                avgCost: 0
            });
        }

        const current = holdings.get(record.name)!;
        const isSold = record.status.toLowerCase() === AssetStatus.Sold.toLowerCase() || record.action.toLowerCase() === 'sold';
        const multiplier = isSold ? -1 : (ACTION_MULTIPLIERS[record.action.toLowerCase()] ?? 1);

        // --- Quantity Calculation ---
        // If it has quantity, update Net Qty
        if (record.quantity) {
            // Buy = +Qty, Sell = -Qty
            current.netQty += (record.quantity * multiplier);
        }

        // --- Cost Basis Calculation for Unit-Based Assets ---
        // We need "Total Buy Cost" and "Total Buy Units" to get Average Cost.
        // Inflow: Buy, Placement, Dividend Reinvest (if qty > 0)
        // Multiplier > 0 implies Inflow or Cost.
        // Check specific actions usually: 'Buy', 'Subscription', etc.
        // For simplicity, if Multiplier > 0 and Quantity > 0, it's a Buy.
        if (multiplier > 0 && record.quantity && record.quantity > 0) {
            current.totalBuyCost += record.amount; // Amount is total cost for that txn
            // Note: We don't track totalBuyQty separately here, but we can derive AvgCost 
            // if we assume FIFO or Weighted Avg. 
            // Actually, simple Weighted Avg = Total Buy Cost / Total Buy Qty. 
            // But we are processing stream.
            // Let's stick to the prompt's requested logic:
            // "calculate the unit multiply the buying price, sum up and deduct with that of selling"
            // Wait, "deduct with that of selling" might mean Net Invested Capital?
            // Prompt: "calculate the unit multiply the buying price, sum up and deduct with that of selling"
            // This is ambiguous.
            // Interpretation A: (Total Buy Cost) - (Total Sell Proceeds). = Net Cost Remaining.
            // Interpretation B: (Remaining Units * Avg Buy Price). 
            // The prompt says: "unit multiply the buying price, sum up... deduct with that of selling".
            // "unit multiply buying price" = Buy Cost.
            // "sum up" = Total Buy Cost.
            // "deduct that of selling" = Minus Total Sell Proceeds.
            // So Value = Total Buy Cost - Total Sell Proceeds.
            // This is "Net Cost" or "Break-even Remaining Cost".
        }

        // --- Sell Proceeds ---
        // If Multiplier < 0 (Sold), Amount is proceeds.
        if (multiplier < 0) {
            current.totalSellProceeds += record.amount;
        }

        // --- Non-Unit Based Assets (FD, Property, etc) ---
        // We just sum the Net Amount.
        // For Property: Buy (Outflow) vs Rent (Inflow).
        // Usually Value = Current Market Value (not tracked here) or Net Invested.
        // For Fixed Deposits: Value = Principal.
        if (![AssetType.Stock, AssetType.ETF, AssetType.REIT].includes(record.type)) {
            current.netValue += (record.amount * multiplier);
        }
    });

    // 3. Final Value Calculation
    const result: AggregatedAsset[] = [];

    holdings.forEach(asset => {
        const isUnitBased = [AssetType.Stock, AssetType.ETF, AssetType.REIT].includes(asset.type);

        if (isUnitBased) {
            // 1. Check Remaining Units
            // If <= 0, strictly exclude.
            // Javascript floating point tolerance check might be needed.
            if (asset.netQty <= 0.000001) {
                return;
            }

            // 2. Calculate Value: Total Buy Cost - Total Sell Proceeds
            // "calculate the unit multiply the buying price, sum up and deduct with that of selling"
            let calculatedValue = asset.totalBuyCost - asset.totalSellProceeds;

            // Handle Negative Value (Profit > Cost)?
            // If you sold 50% for 200% profit, your "Net Cost" might be negative.
            // Usually in a Pie Chart (Allocation), we show "Current Market Value".
            // But user requested "deduct selling". This implies "Net Invested Capital".
            // If Net Invested is negative (you pulled out more than you put in), 
            // we usually clamp to 0 or show it? 
            // Pie Charts can't handle negatives effectively. Clamping to 0 is safest.
            asset.netValue = Math.max(0, calculatedValue);
        }

        // Only add if it has value (or if we want to show 0 value items? No, pie chart hides 0)
        if (asset.netValue > 0) {
            result.push(asset);
        }
    });

    return result.sort((a, b) => b.netValue - a.netValue);
};
