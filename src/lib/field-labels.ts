// DB 컬럼(snake_case) → 한글 라벨. 수정 기록의 changes 키 표시에 사용.
// 미매핑 키는 labelFor에서 원본 키로 폴백 → 신규 컬럼도 안전하게 표시된다.
export const FIELD_LABELS: Record<string, string> = {
  // spots
  title: "이름",
  source: "소스",
  external_id: "외부 ID",
  address: "주소",
  address_detail: "상세 주소",
  region_province: "도/광역시",
  region_city: "시/군/구",
  postal_code: "우편번호",
  phone: "전화번호",
  description: "설명",
  tagline: "태그라인",
  latitude: "위도",
  longitude: "경도",
  altitude: "고도(m)",
  unit_count: "사이트 수",
  is_fee_required: "유료 여부",
  is_pet_allowed: "반려동물 허용",
  pet_policy: "반려동물 정책",
  has_equipment_rental: "렌탈 장비",
  themes: "테마",
  fire_pit_type: "화로 유형",
  amenities: "편의시설",
  nearby_facilities: "주변 시설",
  camp_sight_type: "사이트 유형",
  rating_avg: "평점",
  review_count: "리뷰 수",
  website_url: "웹사이트",
  booking_url: "예약 링크",
  features: "특이사항",
  category: "카테고리",
  total_area_m2: "총 면적(㎡)",
  has_liability_insurance: "배상책임보험",
  // spot_business_info
  spot_uid: "스팟 UID",
  business_reg_no: "사업자 등록번호",
  tourism_business_reg_no: "관광사업 등록번호",
  business_type: "사업유형",
  operation_type: "운영유형",
  operating_agency: "운영기관",
  operating_status: "운영상태",
  national_park_no: "국립공원 번호",
  national_park_office_code: "사무소 코드",
  national_park_serial_no: "일련번호",
  national_park_category_code: "카테고리 코드",
  licensed_at: "허가일",
  // 공통
  created_at: "생성일",
  updated_at: "수정일",
};

export function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** 이력 값 표시 — 타입별 처리 (null/배열/불리언/그 외) */
export function formatHistoryValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return String(value);
}
