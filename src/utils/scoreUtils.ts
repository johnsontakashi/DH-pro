/**
 * Utility functions for score conversion and display
 */

/**
 * Convert percentage score to /20 scale
 * @param percentage - Score as percentage (0-100)
 * @returns Score out of 20
 */
export function percentageTo20(percentage: number): number {
  return (percentage / 100) * 20;
}

/**
 * Convert /20 score to percentage
 * @param scoreOutOf20 - Score out of 20
 * @returns Percentage score (0-100)
 */
export function scoreToPercentage(scoreOutOf20: number): number {
  return (scoreOutOf20 / 20) * 100;
}

/**
 * Format score for display as /20
 * @param percentage - Score as percentage (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "16.5/20"
 */
export function formatScoreAs20(percentage: number, decimals: number = 1): string {
  const score = percentageTo20(percentage);
  return `${score.toFixed(decimals)}/20`;
}

/**
 * Get color class based on score (out of 20)
 * @param scoreOutOf20 - Score out of 20
 * @returns Tailwind color class
 */
export function getScoreColorClass(scoreOutOf20: number): string {
  const percentage = scoreToPercentage(scoreOutOf20);
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Check if score passes given threshold
 * @param percentage - Score as percentage (0-100)
 * @param passingPercentage - Passing threshold as percentage
 * @returns true if passed
 */
export function isPassing(percentage: number, passingPercentage: number): boolean {
  return percentage >= passingPercentage;
}
