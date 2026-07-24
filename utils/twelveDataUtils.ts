export interface PriceLookup {
    ticker: string;
    exchange?: string;
}

// ponytail: reads the key directly at call time (mirrors Chatbot.tsx's process.env.API_KEY
// usage) rather than caching it, since Vite already inlines import.meta.env at build time.
const getApiKey = () => (import.meta as any).env?.VITE_TWELVEDATA_API_KEY;

/**
 * Fetches current market prices from Twelve Data for the given tickers.
 * Returns a map keyed by ticker (not by "ticker:exchange"). Missing/failed
 * symbols are simply absent from the result rather than throwing.
 */
export const fetchLivePrices = async (symbols: PriceLookup[]): Promise<Record<string, number>> => {
    const apiKey = getApiKey();
    if (symbols.length === 0) return {};
    if (!apiKey) {
        console.warn('VITE_TWELVEDATA_API_KEY is not set; skipping live price refresh.');
        return {};
    }

    const symbolParams = symbols.map(s => (s.exchange ? `${s.ticker}:${s.exchange}` : s.ticker));
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbolParams.join(','))}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Twelve Data network response was not ok: ${response.status}`);
        }
        const data = await response.json();

        const result: Record<string, number> = {};
        symbols.forEach((s, i) => {
            const entry = symbols.length === 1 ? data : data[symbolParams[i]];
            const price = entry && !entry.code ? parseFloat(entry.price) : NaN;
            if (!isNaN(price)) result[s.ticker] = price;
        });
        return result;
    } catch (error) {
        console.error('Error fetching live prices from Twelve Data:', error);
        return {};
    }
};
