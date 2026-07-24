export interface PriceLookup {
    ticker: string;
    exchange?: string;
}

import { fetchLiveStockPrice } from './yahooFinanceUtils';

// ponytail: reads the key directly at call time (mirrors Chatbot.tsx's process.env.API_KEY
// usage) rather than caching it, since Vite already inlines import.meta.env at build time.
const getApiKey = () => (import.meta as any).env?.VITE_TWELVEDATA_API_KEY;

/**
 * Fetches current market prices from Twelve Data for the given tickers.
 * Returns a map keyed by ticker (not by "ticker:exchange"). Missing/failed
 * symbols are simply absent from the result rather than throwing.
 * Automatically falls back to Yahoo Finance for missing symbols.
 */
export const fetchLivePrices = async (symbols: PriceLookup[]): Promise<Record<string, number>> => {
    const apiKey = getApiKey();
    const result: Record<string, number> = {};

    if (symbols.length === 0) return result;

    if (apiKey) {
        const symbolParams = symbols.map(s => (s.exchange ? `${s.ticker}:${s.exchange}` : s.ticker));
        const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbolParams.join(','))}&apikey=${apiKey}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                symbols.forEach((s, i) => {
                    const entry = symbols.length === 1 ? data : data[symbolParams[i]];
                    const price = entry && !entry.code ? parseFloat(entry.price) : NaN;
                    if (!isNaN(price)) result[s.ticker] = price;
                });
            } else {
                console.warn(`Twelve Data network response was not ok: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching live prices from Twelve Data:', error);
        }
    } else {
        console.warn('VITE_TWELVEDATA_API_KEY is not set; Twelve Data skipped.');
    }

    // Fallback to Yahoo Finance for missing tickers
    const missingTickers = symbols.filter(s => result[s.ticker] === undefined);
    if (missingTickers.length > 0) {
        console.log('Fetching fallback prices from Yahoo Finance for:', missingTickers.map(s => s.ticker));
        await Promise.all(missingTickers.map(async (s) => {
            // Attempt to query Yahoo Finance
            // For typical Malaysian tickers in this app, append .KL if it has no dot.
            let tickerQuery = s.ticker;
            if (!tickerQuery.includes('.')) {
                tickerQuery += '.KL';
            }
            
            let price = await fetchLiveStockPrice(tickerQuery);
            
            // If .KL failed, fallback to the bare ticker just in case
            if (price === null && tickerQuery !== s.ticker) {
                price = await fetchLiveStockPrice(s.ticker);
            }
            
            if (price !== null) {
                result[s.ticker] = price;
            }
        }));
    }

    return result;
};
