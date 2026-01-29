// SM-2 Spaced Repetition Algorithm - Server Side

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextDueDate: Date;
}

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
