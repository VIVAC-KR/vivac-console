"use server";

import { apiList } from "@/lib/api";
import type { SpotAdminSearchResult, SpotGroupAdminListItem } from "@/lib/types";

/** picker 자동완성 공통 — 빈 입력은 호출 없이 빈 결과. */
async function search<T>(path: string, key: string, query: string, limit: number) {
  const q = query.trim();
  if (!q) return [];
  const { data } = await apiList<T>(path, { [key]: q, _start: 0, _end: limit });
  return data;
}

export async function searchSpots(query: string, limit = 10) {
  return search<SpotAdminSearchResult>("/internal/spots", "title_like", query, limit);
}

export async function searchGroups(query: string, limit = 10) {
  return search<SpotGroupAdminListItem>("/internal/groups", "name_like", query, limit);
}
