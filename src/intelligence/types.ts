import type { Listing } from "../types";

export type MarketStats = {
  medianPrice: number;
  medianPricePerSqft: number;
  byLocality: Record<string, { count: number; medianPrice: number; medianPricePerSqft: number }>;
  byBedroom: Record<string, number>;
};

export type ListingFeatures = {
  listing: Listing;
  pricePerSqft: number | null;
  listingAgeDays: number | null;
  localityMedianPrice: number | null;
  localityMedianPricePerSqft: number | null;
  normalizedPrice: number;
  normalizedPricePerSqft: number;
  normalizedArea: number;
};

export type ValueScore = {
  score: number;
  components: { price: number; area: number; attributes: number; freshness: number; trust: number };
  reasons: string[];
  warnings: string[];
};

export type AnomalyResult = { anomalyScore: number; severity: "normal" | "review" | "data_issue"; signals: string[] };
export type TrustLevel = "HIGH" | "REVIEW" | "DATA ISSUE";
export type TrustResult = { level: TrustLevel; reasons: string[] };
export type SimilarListing = { listing: Listing; similarityScore: number; reasons: string[] };
export type RecommendationPreferences = { bedroom?: number; locality?: string; minPrice?: number; maxPrice?: number; furnishing?: string; propertyType?: string; priority?: "best_value" | "lowest_price" | "largest_area" | "premium" | "balanced" };