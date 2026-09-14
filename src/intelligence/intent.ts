import type { RecommendationPreferences } from "./types";

const allowedLocalities = new Set(["balewadi", "wakad", "baner", "kothrud", "hinjewadi", "hadapsar", "aundh", "magarpatta", "viman nagar"]);
const allowedFurnishing = new Set(["unfurnished", "semi-furnished", "fully-furnished"]);
const allowedPropertyTypes = new Set(["apartment", "villa", "independent house", "plot", "builder floor"]);
const allowedPriorities = new Set(["best_value", "lowest_price", "largest_area", "premium", "balanced"]);

function sanitizePreferences(value: unknown): RecommendationPreferences {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const numberOrUndefined = (item: unknown) => typeof item === "number" && Number.isFinite(item) && item >= 0 ? item : undefined;
  const textOrUndefined = (item: unknown, allowed: Set<string>) => typeof item === "string" && allowed.has(item.toLowerCase()) ? item.toLowerCase() : undefined;
  return {
    bedroom: typeof input.bedroom === "number" && Number.isInteger(input.bedroom) && input.bedroom >= 1 && input.bedroom <= 5 ? input.bedroom : undefined,
    locality: textOrUndefined(input.locality, allowedLocalities),
    minPrice: numberOrUndefined(input.minPrice),
    maxPrice: numberOrUndefined(input.maxPrice),
    furnishing: textOrUndefined(input.furnishing, allowedFurnishing),
    propertyType: textOrUndefined(input.propertyType, allowedPropertyTypes),
    priority: textOrUndefined(input.priority, allowedPriorities) as RecommendationPreferences["priority"],
  };
}

export function parseLocalIntent(query: string): RecommendationPreferences {
  const text = query.toLowerCase();
  const bedroomMatch = text.match(/\b([1-5])\s*(?:bhk|bed(?:room)?s?)\b/);
  const croreMatch = text.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*crore/);
  const lakhMatch = text.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*lakh/);
  const localities = ["balewadi", "wakad", "baner", "kothrud", "hinjewadi", "hadapsar", "aundh", "magarpatta", "viman nagar"];
  const locality = localities.find((item) => text.includes(item));
  const priority = text.includes("spacious") || text.includes("space") || text.includes("large") ? "largest_area" : text.includes("cheap") || text.includes("affordable") || text.includes("lowest") ? "lowest_price" : text.includes("premium") || text.includes("luxury") ? "premium" : "balanced";
  const maxPrice = croreMatch ? Number(croreMatch[1]) * 10000000 : lakhMatch ? Number(lakhMatch[1]) * 100000 : undefined;
  return sanitizePreferences({ bedroom: bedroomMatch ? Number(bedroomMatch[1]) : undefined, locality, maxPrice, priority });
}

export async function parseIntent(query: string): Promise<{ preferences: RecommendationPreferences; source: "grok" | "local" }> {
  try {
    const response = await fetch("/api/ai/parse-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
    if (response.ok) return { preferences: sanitizePreferences(await response.json()), source: "grok" };
  } catch { /* Local parsing keeps search useful when Grok is not configured. */ }
  return { preferences: parseLocalIntent(query), source: "local" };
}