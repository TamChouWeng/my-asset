export const fetchLiveStockPrice = async (ticker: string): Promise<number | null> => {
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(yahooUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    const contents = data; // corsproxy.io returns direct JSON without wrapping
    
    if (contents.chart && contents.chart.result && contents.chart.result.length > 0) {
      const result = contents.chart.result[0];
      const price = result.meta.regularMarketPrice;
      return price;
    }
    
    console.warn(`No price data found for ticker: ${ticker}`);
    return null;
  } catch (error) {
    console.error(`Error fetching live price for ${ticker}:`, error);
    return null;
  }
};
