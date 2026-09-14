import type { Listing } from "../types";
import { getMarketStats, median } from "./marketStats";
import type { ListingFeatures, MarketStats } from "./types";

const reference = new Date("2026-09-10T00:00:00+05:30");

function rangeNormalize(value: number, values: number[]): number {
  const finite = values.filter(Number.isFinite);
  const min = Math.min(...finite), max = Math.max(...finite);
  return max === min ? 0.5 : (value - min) / (max - min);
}

export function deriveFeatures(listings: Listing[], stats: MarketStats = getMarketStats(listings)): Map<string, ListingFeatures> {
  const validPrices = listings.map((listing) => listing.price).filter((price) => price > 0);
  const validAreas = listings.map((listing) => listing.carpet_area).filter((area) => area > 0);
  const validPpsf = listings.filter((listing) => listing.price > 0 && listing.carpet_area > 0).map((listing) => listing.price / listing.carpet_area);
  return new Map(listings.map((listing) => {
    const pricePerSqft = listing.price > 0 && listing.carpet_area > 0 ? listing.price / listing.carpet_area : null;
    const parsed = new Date(listing.posted_at.includes("Z") ? listing.posted_at : `${listing.posted_at}+05:30`);
    const age = Number.isNaN(parsed.getTime()) ? null : Math.max(0, Math.floor((reference.getTime() - parsed.getTime()) / 86400000));
    const local = stats.byLocality[listing.locality];
    return [listing.listing_id, { listing, pricePerSqft, listingAgeDays: age, localityMedianPrice: local?.medianPrice ?? null, localityMedianPricePerSqft: local?.medianPricePerSqft ?? null, normalizedPrice: rangeNormalize(listing.price, validPrices), normalizedPricePerSqft: pricePerSqft === null ? 0.5 : rangeNormalize(pricePerSqft, validPpsf), normalizedArea: rangeNormalize(listing.carpet_area, validAreas) }];
  }));
}

export function percentageFromMedian(value: number | null, medianValue: number | null): number | null { return value && medianValue ? ((value - medianValue) / medianValue) * 100 : null; }
export { median };