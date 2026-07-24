export interface PriceLookup {
    ticker: string;
    exchange?: string;
}

import { fetchLiveStockPrice } from './yahooFinanceUtils';

// ponytail: static mapping for popular Bursa Malaysia tickers to Yahoo 4-digit codes (.KL)
const KLSE_TICKER_MAP: Record<string, string> = {
    'MAYBANK': '1155.KL',
    'PBBANK': '1295.KL',
    'PUBLICBANK': '1295.KL',
    'TM': '4863.KL',
    'TELEKOM': '4863.KL',
    'AMWAY': '6351.KL',
    'SUNWAY': '5211.KL',
    'CIMB': '1023.KL',
    'TNB': '5347.KL',
    'TENAGA': '5347.KL',
    'IHH': '5225.KL',
    'GENTING': '3182.KL',
    'RHBBANK': '1066.KL',
    'HLBANK': '5819.KL',
    'MISC': '3816.KL',
    'PCHEM': '5183.KL',
    'PETDAG': '5681.KL',
    'PETGAS': '6033.KL',
    'MAXIS': '6012.KL',
    'AXIATA': '6888.KL',
    'SIME': '4197.KL',
    'SIMEDARBY': '4197.KL',
    'IOICORP': '1961.KL',
    'KLK': '2445.KL',
    'PPB': '4065.KL',
    'NESTLE': '4707.KL',
    'DLADY': '3026.KL',
    'HEINEKEN': '3255.KL',
    'CARLSBG': '2836.KL',
    'YTL': '4677.KL',
    'GAMUDA': '5398.KL',
    'INARI': '0166.KL',
    'FRONTKN': '0128.KL',
    'MYEG': '0138.KL',
};

const resolveYahooTicker = (rawTicker: string): string => {
    const clean = rawTicker.trim().toUpperCase();
    if (KLSE_TICKER_MAP[clean]) {
        return KLSE_TICKER_MAP[clean];
    }
    if (clean.endsWith('.KL')) {
        return clean;
    }
    if (/^\d{4}$/.test(clean)) {
        return `${clean}.KL`;
    }
    return clean;
};

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
                // Check if Twelve Data returned a global error object (e.g. code 429 rate limit)
                if (!data.code || data.code === 200) {
                    symbols.forEach((s, i) => {
                        const entry = symbols.length === 1 ? data : data[symbolParams[i]];
                        const price = entry && !entry.code ? parseFloat(entry.price) : NaN;
                        if (!isNaN(price)) result[s.ticker] = price;
                    });
                } else {
                    console.warn(`Twelve Data API returned code ${data.code}: ${data.message}`);
                }
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
        await Promise.all(missingTickers.map(async (s) => {
            const targetYahooTicker = resolveYahooTicker(s.ticker);
            const price = await fetchLiveStockPrice(targetYahooTicker);
            if (price !== null && !isNaN(price)) {
                result[s.ticker] = price;
            }
        }));
    }

    return result;
};
