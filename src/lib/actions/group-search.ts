"use server";

import { apiList } from "@/lib/api";
import type { SpotGroupAdminListItem } from "@/lib/types";

export async function searchGroups(query: string): Promise<SpotGroupAdminListItem[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await apiList<SpotGroupAdminListItem>("/internal/groups", {
    name_like: q,
    _start: 0,
    _end: 10,
  });
  return data;
}
