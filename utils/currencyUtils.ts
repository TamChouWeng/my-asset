export interface CurrencyConfig {
    code: string;
    locale: string;
    symbol: string;
    name: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
    MYR: { code: 'MYR', locale: 'en-MY', symbol: 'RM', name: 'Malaysian Ringgit' },
    USD: { code: 'USD', locale: 'en-US', symbol: '$', name: 'US Dollar' },
    SGD: { code: 'SGD', locale: 'en-SG', symbol: 'S$', name: 'Singapore Dollar' },
};

export const DEFAULT_CURRENCY = 'MYR';

export const getCurrencyConfig = (currencyCode: string): CurrencyConfig => {
    return CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
};

export const formatCurrency = (amount: number, currencyCode: string = DEFAULT_CURRENCY): string => {
    const config = getCurrencyConfig(currencyCode);
    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.code,
        }).format(amount);
    } catch (error) {
        console.error(`Error formatting currency ${currencyCode}:`, error);
        return `${config.symbol}${amount.toFixed(2)}`;
    }
};

export const getCurrencyOptions = () => {
    return Object.values(CURRENCIES).map(c => ({
        value: c.code,
        label: `${c.code} - ${c.name}`
    }));
};
