import { DEEPBOOK_INDEXER_URL, DEEPBOOK_POOL } from './config';

export interface BookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  pool: string;
  bids: BookLevel[];
  asks: BookLevel[];
  /** Indexer timestamp (ms) of the snapshot. */
  timestamp: number;
  /** True when the data is the live indexer; false for the mock fallback. */
  live: boolean;
}

/**
 * Frozen book used when the indexer is unreachable so Quest 8 still
 * runs. Spread is centered near 1.0 to read as a stablecoin pair.
 */
const MOCK_BOOK: OrderBook = {
  pool: DEEPBOOK_POOL,
  bids: [
    { price: 0.999, size: 1200 },
    { price: 0.998, size: 800 },
    { price: 0.997, size: 1500 },
  ],
  asks: [
    { price: 1.001, size: 950 },
    { price: 1.002, size: 1400 },
    { price: 1.003, size: 2200 },
  ],
  timestamp: 0,
  live: false,
};

interface RawBook {
  timestamp?: string;
  bids?: [string, string][];
  asks?: [string, string][];
}

/**
 * Fetch the live DeepBook orderbook from the public indexer. Returns
 * the mock book (with `live: false`) on any failure so the caller
 * never has to branch on the network being up.
 */
export async function fetchOrderBook(depth = 8): Promise<OrderBook> {
  try {
    const url = `${DEEPBOOK_INDEXER_URL}/orderbook/${DEEPBOOK_POOL}?level=2&depth=${depth}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`indexer ${res.status}`);
    const raw = (await res.json()) as RawBook;
    const bids = parseLevels(raw.bids);
    const asks = parseLevels(raw.asks);
    if (bids.length === 0 && asks.length === 0) throw new Error('empty book');
    return {
      pool: DEEPBOOK_POOL,
      bids,
      asks,
      timestamp: Number(raw.timestamp ?? 0),
      live: true,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[deepbook] live fetch failed, using mock book:', e);
    return MOCK_BOOK;
  }
}

function parseLevels(rows: [string, string][] | undefined): BookLevel[] {
  if (!rows) return [];
  return rows
    .map(([p, s]) => ({ price: Number(p), size: Number(s) }))
    .filter((l) => Number.isFinite(l.price) && Number.isFinite(l.size) && l.size > 0)
    // Indexer can return sparse outlier ticks; keep the tightest levels.
    .sort((a, b) => a.price - b.price);
}

export interface MatchResult {
  status: 'filled' | 'partial' | 'resting' | 'rejected';
  side: 'buy' | 'sell';
  price: number;
  size: number;
  filled: number;
  avgPrice: number;
  notes: string;
}

/**
 * Match a limit order against a snapshot of the book. Pure function —
 * the same logic DeepBook applies, minus fees and the balance manager.
 */
export function matchAgainstBook(
  book: OrderBook,
  side: 'buy' | 'sell',
  price: number,
  size: number,
): MatchResult {
  if (!(size > 0) || !(price > 0)) {
    return {
      status: 'rejected',
      side,
      price,
      size,
      filled: 0,
      avgPrice: 0,
      notes: 'price and size must be > 0',
    };
  }

  // Buyers cross asks (ascending); sellers cross bids (descending).
  const levels =
    side === 'buy'
      ? [...book.asks].sort((a, b) => a.price - b.price)
      : [...book.bids].sort((a, b) => b.price - a.price);

  let remaining = size;
  let filled = 0;
  let cost = 0;
  for (const level of levels) {
    const crosses = side === 'buy' ? price >= level.price : price <= level.price;
    if (!crosses) break;
    const take = Math.min(remaining, level.size);
    filled += take;
    cost += take * level.price;
    remaining -= take;
    if (remaining <= 0) break;
  }

  const avgPrice = filled > 0 ? cost / filled : 0;
  if (filled >= size) {
    return {
      status: 'filled',
      side,
      price,
      size,
      filled,
      avgPrice,
      notes: `fully filled · avg ${avgPrice.toFixed(4)}`,
    };
  }
  if (filled > 0) {
    return {
      status: 'partial',
      side,
      price,
      size,
      filled,
      avgPrice,
      notes: `${filled.toFixed(2)} filled @ avg ${avgPrice.toFixed(4)}, ${remaining.toFixed(2)} resting`,
    };
  }
  return {
    status: 'resting',
    side,
    price,
    size,
    filled: 0,
    avgPrice: 0,
    notes: 'did not cross — resting on the book until matched',
  };
}
