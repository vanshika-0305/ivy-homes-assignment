import type { Listing } from "../types";
import type { ListingFeatures, ValueScore } from "./types";
import { percentageFromMedian } from "./features";

export function getValueScore(features: ListingFeatures): ValueScore {
  const { listing } = features;
  const price = features.localityMedianPricePerSqft && features.pricePerSqft ? Math.max(0, Math.min(100, 50 + (1 - features.pricePerSqft / features.localityMedianPricePerSqft) * 100)) : 50;
  const area = features.normalizedArea * 100;
  const attributes = Math.min(100, (listing.bathroom / Math.max(1, listing.bedroom)) * 45 + Math.min(25, listing.covered_parking * 8) + (listing.is_live ? 20 : 0));
  const freshness = features.listingAgeDays === null ? 40 : Math.max(0, 100 - features.listingAgeDays / 3);
  const trust = (listing.is_verified ? 70 : 35) + (listing.is_live ? 30 : 0);
  const score = Math.round(price * 0.4 + area * 0.2 + attributes * 0.15 + freshness * 0.1 + trust * 0.15);
  const reasons: string[] = [], warnings: string[] = [];
  const difference = percentageFromMedian(features.pricePerSqft, features.localityMedianPricePerSqft);
  if (difference !== null) reasons.push(`${Math.abs(Math.round(difference))}% ${difference <= 0 ? "below" : "above"} locality median price/sqft`);
  if (features.normalizedArea >= 0.65) reasons.push("Above-average carpet area");
  if (listing.is_verified) reasons.push("Verified listing");
  if (!listing.is_live) warnings.push("Listing is not live");
  if (listing.price <= 0 || listing.carpet_area <= 0) warnings.push("Invalid price or area data");
  return { score: Math.max(0, Math.min(100, score)), components: { price: Math.round(price), area: Math.round(area), attributes: Math.round(attributes), freshness: Math.round(freshness), trust: Math.round(trust) }, reasons, warnings };
}