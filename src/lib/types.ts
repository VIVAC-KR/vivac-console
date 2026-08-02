export type SpotDetail = {
  uid: string;
  title: string;
  pipeline_status: string | null;
  source: string | null;
  external_id: string | null;
  address: string | null;
  address_detail: string | null;
  region_province: string | null;
  region_city: string | null;
  postal_code: string | null;
  phone: string | null;
  description: string | null;
  tagline: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  unit_count: number | null;
  is_fee_required: boolean | null;
  is_pet_allowed: boolean | null;
  pet_policy: string | null;
  has_equipment_rental: string[] | null;
  themes: string[] | null;
  fire_pit_type: string | null;
  amenities: string[] | null;
  nearby_facilities: string[] | null;
  camp_sight_type: string | null;
  rating_avg: number;
  review_count: number;
  assigned_to_uid: string | null;
  website_url: string | null;
  booking_url: string | null;
  features: string | null;
  category: string[] | null;
  total_area_m2: number | null;
  has_liability_insurance: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SpotOptionField =
  | "category"
  | "amenities"
  | "nearby_facilities"
  | "has_equipment_rental";

export type SpotOption = {
  field: SpotOptionField;
  code: string;
  label_ko: string;
};

export type BusinessInfoDetail = {
  uid: string;
  spot_uid: string;
  business_reg_no: string | null;
  tourism_business_reg_no: string | null;
  business_type: string | null;
  operation_type: string | null;
  operating_agency: string | null;
  operating_status: string | null;
  national_park_no: number | null;
  national_park_office_code: string | null;
  national_park_serial_no: string | null;
  national_park_category_code: string | null;
  licensed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const SPOT_GROUP_VISIBILITIES = ["private", "invite_only", "public"] as const;
export type SpotGroupVisibility = (typeof SPOT_GROUP_VISIBILITIES)[number];

export const SPOT_GROUP_ROLES = ["viewer", "contributor", "editor", "owner"] as const;
export type SpotGroupRole = (typeof SPOT_GROUP_ROLES)[number];

export type SpotGroupAdminListItem = {
  uid: string;
  name: string;
  visibility: SpotGroupVisibility;
  member_count: number;
  spot_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type SpotGroupAdminDetail = SpotGroupAdminListItem & {
  description: string | null;
};

export type SpotGroupAdminMemberOut = {
  user_uid: string;
  nickname: string;
  email: string;
  role: SpotGroupRole;
  invited_by_uid: string | null;
  created_at: string | null;
};

export type SpotGroupSpotItem = {
  uid: string;
  title: string;
  trust_tier: number | null;
  thumbnail_url: string | null;
  region_short: string | null;
  category: string[] | null;
  added_by_uid: string;
  added_at: string | null;
};

export type SpotAdminSearchResult = {
  uid: string;
  title: string;
  region_province: string | null;
  region_city: string | null;
  pipeline_status: string | null;
  trust_tier: number | null;
};

export type SpotGroupOfSpotItem = {
  uid: string;
  name: string;
  visibility: SpotGroupVisibility;
  added_at: string | null;
};
