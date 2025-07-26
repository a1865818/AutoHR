// Utility functions for handling candidate experience data

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  description?: string;
}

/**
 * Parse date string to Date object, handling various formats
 */
export function parseDateString(dateString: string): Date | null {
  if (!dateString || dateString.trim() === "") {
    return null;
  }

  try {
    // Try parsing as ISO string first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing as "YYYY-MM-DD" format
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }

    // Try parsing as "MM/DD/YYYY" format
    const slashParts = dateString.split("/");
    if (slashParts.length === 3) {
      const month = parseInt(slashParts[0]) - 1;
      const day = parseInt(slashParts[1]);
      const year = parseInt(slashParts[2]);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }

    console.warn(`Unable to parse date string: ${dateString}`);
    return null;
  } catch (error) {
    console.warn(`Error parsing date string "${dateString}":`, error);
    return null;
  }
}

/**
 * Calculate years of experience between start and end dates
 */
export function calculateYearsOfExperience(startDate: string, endDate?: string): number {
  const start = parseDateString(startDate);
  if (!start) {
    return 0;
  }

  const end = endDate ? parseDateString(endDate) : new Date();
  if (!end) {
    return 0;
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  // Round up fractional years (e.g., 0.2 years becomes 1 year)
  return Math.ceil(diffYears);
}

/**
 * Format experience as a readable string
 */
export function formatExperienceString(experience: Experience): string {
  const { title, company, startDate, endDate, isCurrent } = experience;
  
  if (!title || !company || !startDate) {
    return "Experience information incomplete";
  }

  const years = calculateYearsOfExperience(startDate, endDate);
  
  if (years === 0) {
    return `${title} at ${company}`;
  }

  const yearText = years === 1 ? "year" : "years";
  return `${years} ${yearText} of ${title} at ${company}`;
}

/**
 * Format multiple experiences as an array of strings
 */
export function formatExperiencesList(experiences: Experience[]): string[] {
  if (!experiences || !Array.isArray(experiences)) {
    return [];
  }

  return experiences
    .filter(exp => exp.title && exp.company && exp.startDate)
    .map(formatExperienceString);
}

/**
 * Get total years of experience across all positions
 */
export function calculateTotalYearsOfExperience(experiences: Experience[]): number {
  if (!experiences || !Array.isArray(experiences)) {
    return 0;
  }

  let totalYears = 0;
  
  for (const experience of experiences) {
    if (experience.title && experience.company && experience.startDate) {
      totalYears += calculateYearsOfExperience(experience.startDate, experience.endDate);
    }
  }

  // Round up fractional years for total experience
  return Math.ceil(totalYears);
}

/**
 * Sort experiences by start date (most recent first)
 */
export function sortExperiencesByDate(experiences: Experience[]): Experience[] {
  if (!experiences || !Array.isArray(experiences)) {
    return [];
  }

  return [...experiences].sort((a, b) => {
    const dateA = parseDateString(a.startDate);
    const dateB = parseDateString(b.startDate);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });
}

/**
 * Get the most recent experience
 */
export function getMostRecentExperience(experiences: Experience[]): Experience | null {
  const sorted = sortExperiencesByDate(experiences);
  return sorted.length > 0 ? sorted[0] : null;
}

/**
 * Format experience for display in candidate info
 */
export function formatExperienceForDisplay(experiences: Experience[]): string {
  if (!experiences || experiences.length === 0) {
    return "No experience data available";
  }

  const sorted = sortExperiencesByDate(experiences);
  const mostRecent = sorted[0];
  
  if (mostRecent) {
    const formatted = formatExperienceString(mostRecent);
    const totalYears = calculateTotalYearsOfExperience(experiences);
    
    if (totalYears > 0) {
      return `${formatted} (${totalYears} years total experience)`;
    }
    
    return formatted;
  }

  return "Experience information unavailable";
} 