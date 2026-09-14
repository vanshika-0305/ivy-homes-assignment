import type { Listing } from "../types";
import type { AnomalyResult, ListingFeatures } from "./types";

export function getAnomaly(listing: Listing, features: ListingFeatures): AnomalyResult {
  const signals: string[] = [];
  if (listing.price <= 0) signals.push("non-positive price");
  if (listing.carpet_area <= 0) signals.push("non-positive carpet area");
  if (listing.floor > listing.total_floors) signals.push("floor exceeds total floors");
  if (listing.carpet_area > listing.super_built_up_area) signals.push("carpet area exceeds super-built-up area");
  if (listing.latitude < 18.3 || listing.latitude > 18.8 || listing.longitude < 73.6 || listing.longitude > 74.1) signals.push("coordinates outside Pune bounds");
  if (features.pricePerSqft !== null && (features.pricePerSqft < 2000 || features.pricePerSqft > 50000)) signals.push("unusual price per sqft");
  const anomalyScore = Math.min(100, signals.length * 24 + (features.normalizedPricePerSqft > 0.98 ? 10 : 0));
  return { anomalyScore, severity: signals.some((signal) => signal !== "unusual price per sqft") ? "data_issue" : anomalyScore >= 45 ? "review" : "normal", signals };
}