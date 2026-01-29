import type { QualityRating } from "./sm2";

interface QueuedRating {
  cardId: string;
  quality: QualityRating;
  userId: string;
  timestamp: number;
  ratingId: string; // Unique ID for idempotency
}

const QUEUE_KEY = "jc_flashcards_offline_queue";
const PENDING_KEY = "jc_flashcards_pending_ratings";

// Generate a unique rating ID
function generateRatingId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getOfflineQueue(): QueuedRating[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get queue items for a specific user only
export function getOfflineQueueForUser(userId: string): QueuedRating[] {
  return getOfflineQueue().filter(q => q.userId === userId);
}

export function addToOfflineQueue(cardId: string, quality: QualityRating, userId: string): string {
  const queue = getOfflineQueue();
  
  // Check if this card already has a pending rating for this user
  const existingIndex = queue.findIndex(q => q.cardId === cardId && q.userId === userId);
  
  const ratingId = generateRatingId();
  
  if (existingIndex >= 0) {
    // Update existing entry with new rating
    queue[existingIndex] = { cardId, quality, userId, timestamp: Date.now(), ratingId };
  } else {
    queue.push({ cardId, quality, userId, timestamp: Date.now(), ratingId });
  }
  
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return ratingId;
}

export function removeFromOfflineQueue(cardId: string, userId: string): void {
  const queue = getOfflineQueue().filter(q => !(q.cardId === cardId && q.userId === userId));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueueForUser(userId: string): void {
  const queue = getOfflineQueue().filter(q => q.userId !== userId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Track which ratings are currently being sent to prevent duplicates
export function markRatingPending(cardId: string, userId: string): void {
  const pending = getPendingRatings();
  const key = `${userId}:${cardId}`;
  if (!pending.includes(key)) {
    pending.push(key);
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
}

export function unmarkRatingPending(cardId: string, userId: string): void {
  const pending = getPendingRatings().filter(k => k !== `${userId}:${cardId}`);
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function isRatingPending(cardId: string, userId: string): boolean {
  return getPendingRatings().includes(`${userId}:${cardId}`);
}

function getPendingRatings(): string[] {
  try {
    const stored = localStorage.getItem(PENDING_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}
