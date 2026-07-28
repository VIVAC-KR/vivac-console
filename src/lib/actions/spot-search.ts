"use server";

import { apiList } from "@/lib/api";
import type { SpotAdminSearchResult } from "@/lib/types";

export async function searchSpots(query: string): Promise<SpotAdminSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await apiList<SpotAdminSearchResult>("/internal/spots", {
    title_like: q,
    _start: 0,
    _end: 10,
  });
  return data;
}
