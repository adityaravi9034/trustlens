/**
 * Utility functions for TrustLens web application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ScoreLevel } from '@/types';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers with appropriate precision
 */
export function formatNumber(value: number, precision: number = 2): string {
  return value.toFixed(precision);
}

/**
 * Format percentages
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${(value * 100).toFixed(precision)}%`;
}

/**
 * Get score level based on numeric value
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Get color class based on score level
 */
export function getScoreColor(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'high':
      return 'text-danger-600 bg-danger-50';
    case 'medium':
      return 'text-warning-600 bg-warning-50';
    case 'low':
      return 'text-success-600 bg-success-50';
  }
}

/**
 * Get badge variant based on score
 */
export function getScoreBadgeVariant(score: number): 'destructive' | 'warning' | 'success' {
  const level = getScoreLevel(score);
  switch (level) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
  }
}

/**
 * Format time duration
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download data as file
 */
export function downloadAsFile(data: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get plan display name and color
 */
export function getPlanInfo(plan: string): { name: string; color: string } {
  switch (plan) {
    case 'free':
      return { name: 'Free', color: 'text-gray-600 bg-gray-100' };
    case 'basic':
      return { name: 'Basic', color: 'text-blue-600 bg-blue-100' };
    case 'pro':
      return { name: 'Pro', color: 'text-purple-600 bg-purple-100' };
    case 'enterprise':
      return { name: 'Enterprise', color: 'text-gold-600 bg-gold-100' };
    default:
      return { name: 'Unknown', color: 'text-gray-600 bg-gray-100' };
  }
}

/**
 * Calculate credit cost for analysis options
 */
export function calculateCredits(options: {
  includeExplanations?: boolean;
  hasImages?: boolean;
  batchSize?: number;
}): number {
  let cost = 1; // Base cost

  if (options.includeExplanations) {
    cost *= 2;
  }

  if (options.hasImages) {
    cost = Math.ceil(cost * 1.5);
  }

  if (options.batchSize && options.batchSize > 1) {
    cost *= options.batchSize;
  }

  return cost;
}