export type Listing = {
  listing_id: string;
  listing_url: string;
  website: string;
  apartment_name: string;
  locality: string;
  property_type: string;
  bedroom: number;
  bathroom: number;
  balcony: number;
  floor: number;
  total_floors: number;
  furnishing: string;
  facing_direction: string;
  covered_parking: number;
  price: number;
  carpet_area: number;
  super_built_up_area: number;
  latitude: number;
  longitude: number;
  posted_by: string;
  posted_by_name: string;
  posted_by_contact: string;
  project_id: string | null;
  is_verified: boolean;
  description: string;
  posted_at: string;
  is_live: boolean;
};

export type Rental = {
  listing_id: string;
  title: string;
  apartment_name: string;
  locality: string;
  bedroom: number;
  bathroom: number;
  floor: number;
  total_floors: number;
  furnishing: string;
  price: number;
  deposit: number;
  maintenance: number;
  carpet_area: number;
  super_builtup_area: number;
  is_live: boolean;
};

export type Project = {
  project_id: string;
  apartment_name: string;
  developer_name: string;
  locality: string;
  project_status: string;
  total_units: number;
  total_towers: number;
  total_floors: number;
  possession_date: string;
  rera_number: string;
  min_area_sqft: number;
  max_area_sqft: number;
  amenities: string[];
  total_listings: number;
  price_min: number;
  price_max: number;
};

export type Page<T> = { limit: number; offset: number; count: number; total: number; has_more: boolean; results: T[] };
export type Session = { accessToken: string; refreshToken: string; email: string };