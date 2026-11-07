export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUsd: number; // 1 USD = X units of this currency
  popular?: boolean;
  region: 'Asia & Pacific' | 'Europe' | 'Americas' | 'Middle East & Africa' | 'South Asia';
}

export const ALL_CURRENCIES: CurrencyInfo[] = [
  // --- South Asia & Top Travel ---
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    rateToUsd: 83.50,
    popular: true,
    region: 'South Asia',
  },
  {
    code: 'USD',
    name: 'United States Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateToUsd: 1.0,
    popular: true,
    region: 'Americas',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateToUsd: 152.40,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateToUsd: 0.92,
    popular: true,
    region: 'Europe',
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    flag: '🇬🇧',
    rateToUsd: 0.78,
    popular: true,
    region: 'Europe',
  },
  {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'د.إ',
    flag: '🇦🇪',
    rateToUsd: 3.67,
    popular: true,
    region: 'Middle East & Africa',
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    rateToUsd: 1.35,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    flag: '🇹🇭',
    rateToUsd: 36.80,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    rateToUsd: 1.52,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    rateToUsd: 1.36,
    popular: true,
    region: 'Americas',
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flag: '🇨🇭',
    rateToUsd: 0.90,
    popular: true,
    region: 'Europe',
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan Renminbi',
    symbol: '¥',
    flag: '🇨🇳',
    rateToUsd: 7.24,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    rateToUsd: 1380.00,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    flag: '🇲🇾',
    rateToUsd: 4.72,
    popular: true,
    region: 'Asia & Pacific',
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    flag: '🇮🇩',
    rateToUsd: 16250.00,
    popular: false,
    region: 'Asia & Pacific',
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    flag: '🇻🇳',
    rateToUsd: 25400.00,
    popular: false,
    region: 'Asia & Pacific',
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flag: '🇳🇿',
    rateToUsd: 1.65,
    popular: false,
    region: 'Asia & Pacific',
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    rateToUsd: 7.82,
    popular: false,
    region: 'Asia & Pacific',
  },
  {
    code: 'TWD',
    name: 'New Taiwan Dollar',
    symbol: 'NT$',
    flag: '🇹🇼',
    rateToUsd: 32.50,
    popular: false,
    region: 'Asia & Pacific',
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    flag: '🇵🇭',
    rateToUsd: 58.70,
    popular: false,
    region: 'Asia & Pacific',
  },

  // --- Middle East & Gulf ---
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    flag: '🇸🇦',
    rateToUsd: 3.75,
    popular: true,
    region: 'Middle East & Africa',
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'QR',
    flag: '🇶🇦',
    rateToUsd: 3.64,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KD',
    flag: '🇰🇼',
    rateToUsd: 0.31,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'RO',
    flag: '🇴🇲',
    rateToUsd: 0.38,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    flag: '🇹🇷',
    rateToUsd: 32.80,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    flag: '🇪🇬',
    rateToUsd: 47.90,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flag: '🇿🇦',
    rateToUsd: 18.20,
    popular: false,
    region: 'Middle East & Africa',
  },
  {
    code: 'ILS',
    name: 'Israeli New Shekel',
    symbol: '₪',
    flag: '🇮🇱',
    rateToUsd: 3.72,
    popular: false,
    region: 'Middle East & Africa',
  },

  // --- South Asian Neighbors ---
  {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: '₨',
    flag: '🇳🇵',
    rateToUsd: 133.60,
    popular: false,
    region: 'South Asia',
  },
  {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    flag: '🇱🇰',
    rateToUsd: 302.00,
    popular: false,
    region: 'South Asia',
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    flag: '🇧🇩',
    rateToUsd: 117.50,
    popular: false,
    region: 'South Asia',
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    flag: '🇵🇰',
    rateToUsd: 278.50,
    popular: false,
    region: 'South Asia',
  },

  // --- Europe & Nordics ---
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    flag: '🇸🇪',
    rateToUsd: 10.60,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    flag: '🇳🇴',
    rateToUsd: 10.75,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    flag: '🇩🇰',
    rateToUsd: 6.87,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    flag: '🇵🇱',
    rateToUsd: 3.98,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    flag: '🇨🇿',
    rateToUsd: 23.20,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    flag: '🇭🇺',
    rateToUsd: 365.00,
    popular: false,
    region: 'Europe',
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    flag: '🇷🇺',
    rateToUsd: 89.00,
    popular: false,
    region: 'Europe',
  },

  // --- Americas ---
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'Mex$',
    flag: '🇲🇽',
    rateToUsd: 18.10,
    popular: false,
    region: 'Americas',
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    rateToUsd: 5.45,
    popular: false,
    region: 'Americas',
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    flag: '🇦🇷',
    rateToUsd: 915.00,
    popular: false,
    region: 'Americas',
  },
  {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: 'CLP$',
    flag: '🇨🇱',
    rateToUsd: 940.00,
    popular: false,
    region: 'Americas',
  },
  {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: 'COL$',
    flag: '🇨🇴',
    rateToUsd: 4120.00,
    popular: false,
    region: 'Americas',
  },
];

export const CURRENCY_MAP: Record<string, CurrencyInfo> = ALL_CURRENCIES.reduce(
  (acc, curr) => {
    acc[curr.code] = curr;
    return acc;
  },
  {} as Record<string, CurrencyInfo>
);

export function getCurrencyInfo(code: string): CurrencyInfo {
  return (
    CURRENCY_MAP[code] || {
      code,
      name: code,
      symbol: code,
      flag: '🌐',
      rateToUsd: 1.0,
      region: 'Americas',
    }
  );
}

export function convertAmount(amount: number, fromCode: string, toCode: string): number {
  const from = getCurrencyInfo(fromCode);
  const to = getCurrencyInfo(toCode);
  // Convert from -> USD -> to
  const amountUsd = amount / from.rateToUsd;
  return amountUsd * to.rateToUsd;
}

export function formatCurrency(amountUsd: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const value = amountUsd * info.rateToUsd;

  // Zero-decimal currencies
  const zeroDecimalCodes = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'HUF'];
  if (zeroDecimalCodes.includes(currencyCode)) {
    return `${info.symbol}${Math.round(value).toLocaleString()}`;
  }

  // Indian Rupee formatting
  if (currencyCode === 'INR') {
    return `${info.symbol}${Math.round(value).toLocaleString('en-IN')}`;
  }

  // Standard 2 decimal places
  return `${info.symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
