import type { Listing } from "../types";
import type { ListingFeatures, RecommendationPreferences, ValueScore } from "./types";
import { getValueScore } from "./valueScore";

export function getRecommendedProperties(listings: Listing[], features: Map<string, ListingFeatures>, preferences: RecommendationPreferences = {}): Array<{ listing: Listing; value: ValueScore }> {
  const candidates = listings.filter((listing) => listing.is_live && (!preferences.bedroom || listing.bedroom === preferences.bedroom) && (!preferences.locality || listing.locality === preferences.locality) && (!preferences.minPrice || listing.price >= preferences.minPrice) && (!preferences.maxPrice || listing.price <= preferences.maxPrice) && (!preferences.furnishing || listing.furnishing === preferences.furnishing) && (!preferences.propertyType || listing.property_type === preferences.propertyType));
  return candidates.map((listing) => ({ listing, value: getValueScore(features.get(listing.listing_id)!)})).sort((a, b) => {
    if (preferences.priority === "lowest_price") return a.listing.price - b.listing.price;
    if (preferences.priority === "largest_area") return b.listing.carpet_area - a.listing.carpet_area;
    if (preferences.priority === "premium") return b.listing.price - a.listing.price;
    return b.value.score - a.value.score;
  });
}