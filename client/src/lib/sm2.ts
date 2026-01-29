// SM-2 Spaced Repetition Algorithm Implementation

export interface CardProgress {
  cardId: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  lastReviewDate: string | null;
  nextDueDate: string;
}

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextDueDate: Date;
}

// Quality ratings from 0-5
export const QUALITY_LABELS = [
  { value: 0, label: "Blackout", description: "Complete blackout", color: "destructive" },
  { value: 1, label: "Wrong", description: "Wrong, but recognized", color: "destructive" },
  { value: 2, label: "Familiar", description: "Wrong, but familiar", color: "destructive" },
  { value: 3, label: "Hard", description: "Correct with difficulty", color: "accent" },
  { value: 4, label: "Good", description: "Correct with hesitation", color: "primary" },
  { value: 5, label: "Perfect", description: "Perfect, instant recall", color: "primary" },
] as const;

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export function calculateSM2(
  currentEF: number,
  currentInterval: number,
  currentRepetitions: number,
  quality: QualityRating
): SM2Result {
  let easinessFactor = currentEF;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  if (quality < 3) {
    // Failed - reset to beginning
    repetitions = 0;
    interval = 1;
  } else {
    // Passed - update easiness factor
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easinessFactor = Math.max(easinessFactor, 1.3); // Minimum 1.3

    repetitions += 1;

    // Set interval
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
  }

  // Calculate next due date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);

  return {
    easinessFactor,
    interval,
    repetitions,
    nextDueDate,
  };
}

// Mastery level calculation
export type MasteryLevel = "new" | "learning" | "review" | "mastered";

export function getMasteryLevel(
  repetitions: number,
  easinessFactor: number,
  interval: number
): MasteryLevel {
  if (repetitions === 0) return "new";
  if (repetitions < 3) return "learning";
  if (easinessFactor > 2.5 && interval >= 21) return "mastered";
  return "review";
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case "new": return "bg-muted text-muted-foreground";
    case "learning": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "review": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "mastered": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
}

// Parse CSV content
export function parseCSV(content: string): Array<{ term: string; definition: string; visualMetaphor?: string }> {
  const lines = content.trim().split('\n');
  const cards: Array<{ term: string; definition: string; visualMetaphor?: string }> = [];
  
  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('term') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with potential quoted fields
    const parts = parseCSVLine(line);
    if (parts.length >= 2) {
      cards.push({
        term: parts[0].trim(),
        definition: parts[1].trim(),
        visualMetaphor: parts[2]?.trim() || undefined,
      });
    }
  }
  
  return cards;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Check if a card is due for review
export function isCardDue(nextDueDate: string | Date): boolean {
  const due = new Date(nextDueDate);
  const now = new Date();
  return due <= now;
}

// Sort cards for review: due cards first (by easiness factor, hardest first), then new cards
export function sortCardsForReview<T extends { easinessFactor: number; nextDueDate: string | Date; repetitions: number }>(
  cards: T[]
): T[] {
  return [...cards].sort((a, b) => {
    const aDue = isCardDue(a.nextDueDate);
    const bDue = isCardDue(b.nextDueDate);
    
    // Due cards come first
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    
    // Among due cards, sort by easiness factor (hardest first)
    if (aDue && bDue) {
      return a.easinessFactor - b.easinessFactor;
    }
    
    // Among new cards, randomize
    return Math.random() - 0.5;
  });
}
