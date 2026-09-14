import type { Listing } from "../types";
import type { AnomalyResult, TrustResult } from "./types";

const confirmedCorrupt = new Set(["100-3000174", "100-3000236", "100-3000608", "100-3001067", "100-3001543", "100-3001548", "100-3002344", "100-3003022", "DWE-3000235", "DWE-3000299", "DWE-3001307", "DWE-3001835", "DWE-3001849", "DWE-3003186", "MAG-3000020", "MAG-3000932", "MAG-3001263", "MAG-3001979", "MAG-3001986", "SQU-3000026", "SQU-3000419", "SQU-3000591", "SQU-3001297", "SQU-3001698", "SQU-3001738", "SQU-3003195", "ZER-3000380", "ZER-3003055"]);
export function getTrust(listing: Listing, anomaly: AnomalyResult): TrustResult {
  if (confirmedCorrupt.has(listing.listing_id)) return { level: "DATA ISSUE", reasons: ["Matches a confirmed corrupt listing ID from the investigation"] };
  if (anomaly.severity !== "normal") return { level: "REVIEW", reasons: anomaly.signals };
  return { level: listing.is_verified ? "HIGH" : "REVIEW", reasons: listing.is_verified ? ["Verified listing", "No confirmed data-quality issue"] : ["Not verified; no confirmed data-quality issue"] };
}