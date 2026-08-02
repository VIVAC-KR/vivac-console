import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = bytes < 1024 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4);
  return `${i ? (bytes / 1024 ** i).toFixed(1) : bytes} ${units[i]}`;
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("ko-KR") : "-";

export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("ko-KR") : "-";
