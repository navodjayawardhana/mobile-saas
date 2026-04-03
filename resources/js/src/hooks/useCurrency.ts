import { useMemo } from 'react';
import { useGetCurrenciesQuery } from '../store/api/settingsApi';

interface CurrencyHookResult {
    symbol: string;
    code: string;
    formatCurrency: (amount: number | string | null | undefined) => string;
    isLoading: boolean;
}

export const useCurrency = (): CurrencyHookResult => {
    const { data, isLoading } = useGetCurrenciesQuery();

    const defaultCurrency = useMemo(() => {
        if (!data?.currencies) return null;
        return data.currencies.find((c) => c.is_default) || data.currencies[0] || null;
    }, [data]);

    const symbol = defaultCurrency?.symbol || '$';
    const code = defaultCurrency?.code || 'USD';

    const formatCurrency = useMemo(() => {
        return (amount: number | string | null | undefined): string => {
            const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
            if (isNaN(num)) return `${symbol}0.00`;

            const formatted = Math.abs(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
        };
    }, [symbol]);

    return {
        symbol,
        code,
        formatCurrency,
        isLoading,
    };
};

export default useCurrency;
