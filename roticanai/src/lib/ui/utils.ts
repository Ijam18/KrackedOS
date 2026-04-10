/**
 * UI utilities
 *
 * Common utilities for client-side code
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  text: string | null,
  maxLength: number,
): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Format large numbers in a readable way (1K, 1.5M, etc.)
 */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format cost in dollars (e.g., "$0.05", "$1.23")
 */
export function formatCost(cost: string | number): string {
  const value = typeof cost === "string" ? parseFloat(cost) : cost;
  if (value === 0 || Number.isNaN(value)) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}
