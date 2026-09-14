import type { Listing } from "../types";
import type { ListingFeatures, SimilarListing } from "./types";

export function getSimilarListings(target: Listing, listings: Listing[], features: Map<string, ListingFeatures>, limit = 4): SimilarListing[] {
  const source = features.get(target.listing_id);
  if (!source) return [];
  return listings.filter((listing) => listing.listing_id !== target.listing_id).map((listing) => {
    const candidate = features.get(listing.listing_id);
    if (!candidate) return null;
    let distance = Math.abs(source.normalizedPrice - candidate.normalizedPrice) * 0.25 + Math.abs(source.normalizedArea - candidate.normalizedArea) * 0.2 + Math.abs(target.bedroom - listing.bedroom) / 5 * 0.2 + Math.abs(target.bathroom - listing.bathroom) / 5 * 0.1 + Math.abs(target.floor - listing.floor) / 40 * 0.05;
    if (target.locality !== listing.locality) distance += 0.12;
    if (target.furnishing !== listing.furnishing) distance += 0.04;
    if (target.property_type !== listing.property_type) distance += 0.04;
    const reasons: string[] = [];
    if (target.locality === listing.locality) reasons.push("same locality");
    if (target.bedroom === listing.bedroom) reasons.push("same BHK");
    if (Math.abs(source.normalizedArea - candidate.normalizedArea) < 0.12) reasons.push("similar carpet area");
    if (Math.abs(source.normalizedPricePerSqft - candidate.normalizedPricePerSqft) < 0.12) reasons.push("similar price/sqft");
    return { listing, similarityScore: Math.round(Math.max(0, 100 - distance * 100)), reasons };
  }).filter((item): item is SimilarListing => item !== null).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
}