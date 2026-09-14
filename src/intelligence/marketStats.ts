import type { Listing } from "../types";
import type { MarketStats } from "./types";

export function median(values: number[]): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function getMarketStats(listings: Listing[]): MarketStats {
  const valid = listings.filter((listing) => listing.price > 0 && listing.carpet_area > 0);
  const byLocality: MarketStats["byLocality"] = {};
  for (const listing of valid) {
    const group = byLocality[listing.locality] ?? { count: 0, medianPrice: 0, medianPricePerSqft: 0 };
    group.count += 1;
    byLocality[listing.locality] = group;
  }
  for (const locality of Object.keys(byLocality)) {
    const group = valid.filter((listing) => listing.locality === locality);
    byLocality[locality] = { count: group.length, medianPrice: median(group.map((listing) => listing.price)), medianPricePerSqft: median(group.map((listing) => listing.price / listing.carpet_area)) };
  }
  return {
    medianPrice: median(valid.map((listing) => listing.price)),
    medianPricePerSqft: median(valid.map((listing) => listing.price / listing.carpet_area)),
    byLocality,
    byBedroom: valid.reduce<Record<string, number>>((counts, listing) => { counts[String(listing.bedroom)] = (counts[String(listing.bedroom)] ?? 0) + 1; return counts; }, {}),
  };
}