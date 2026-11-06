import { SyntheticIndex } from '../types/deriv';

export const SYNTHETIC_INDICES: SyntheticIndex[] = [
  {
    symbol: 'R_100',
    displayName: 'Volatility 100 Index',
    shortName: 'Vol 100',
    decimals: 2,
    volatilityRate: 100,
    isOneSecond: false,
  },
  {
    symbol: 'R_75',
    displayName: 'Volatility 75 Index',
    shortName: 'Vol 75',
    decimals: 4,
    volatilityRate: 75,
    isOneSecond: false,
  },
  {
    symbol: 'R_50',
    displayName: 'Volatility 50 Index',
    shortName: 'Vol 50',
    decimals: 4,
    volatilityRate: 50,
    isOneSecond: false,
  },
  {
    symbol: 'R_25',
    displayName: 'Volatility 25 Index',
    shortName: 'Vol 25',
    decimals: 3,
    volatilityRate: 25,
    isOneSecond: false,
  },
  {
    symbol: 'R_10',
    displayName: 'Volatility 10 Index',
    shortName: 'Vol 10',
    decimals: 3,
    volatilityRate: 10,
    isOneSecond: false,
  },
  {
    symbol: '1HZ100V',
    displayName: 'Volatility 100 (1s) Index',
    shortName: 'Vol 100 (1s)',
    decimals: 2,
    volatilityRate: 100,
    isOneSecond: true,
  },
  {
    symbol: '1HZ75V',
    displayName: 'Volatility 75 (1s) Index',
    shortName: 'Vol 75 (1s)',
    decimals: 2,
    volatilityRate: 75,
    isOneSecond: true,
  },
  {
    symbol: '1HZ50V',
    displayName: 'Volatility 50 (1s) Index',
    shortName: 'Vol 50 (1s)',
    decimals: 2,
    volatilityRate: 50,
    isOneSecond: true,
  },
  {
    symbol: '1HZ25V',
    displayName: 'Volatility 25 (1s) Index',
    shortName: 'Vol 25 (1s)',
    decimals: 2,
    volatilityRate: 25,
    isOneSecond: true,
  },
  {
    symbol: '1HZ10V',
    displayName: 'Volatility 10 (1s) Index',
    shortName: 'Vol 10 (1s)',
    decimals: 2,
    volatilityRate: 10,
    isOneSecond: true,
  },
];

export function getIndexBySymbol(symbol: string): SyntheticIndex {
  const found = SYNTHETIC_INDICES.find(i => i.symbol === symbol);
  return (
    found || {
      symbol,
      displayName: symbol,
      shortName: symbol,
      decimals: 2,
      volatilityRate: 50,
    }
  );
}
