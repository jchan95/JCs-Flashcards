import { 
  flashcardSets, 
  flashcards, 
  userProgress, 
  userStats,
  adminUsers,
  type FlashcardSet,
  type InsertFlashcardSet,
  type Flashcard,
  type InsertFlashcard,
  type UserProgress,
  type InsertUserProgress,
  type UserStats,
  type InsertUserStats,
  type AdminUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";

// Storage interface for flashcard app
export interface IStorage {
  // Flashcard Sets
  getAllSets(): Promise<FlashcardSet[]>;
  getSetsForUser(userId: string | null): Promise<FlashcardSet[]>; // Public sets + user's own sets
  getSet(id: string): Promise<FlashcardSet | undefined>;
  createSet(set: InsertFlashcardSet & { createdBy?: string | null; isPublic?: boolean }): Promise<FlashcardSet>;
  deleteSet(id: string): Promise<void>;
  updateSetCardCount(setId: string, count: number): Promise<void>;
  updateSetPublic(setId: string, isPublic: boolean): Promise<FlashcardSet>;
  canUserModifySet(userId: string, setId: string): Promise<boolean>;

  // Flashcards
  getCardsBySet(setId: string): Promise<Flashcard[]>;
  createCards(cards: InsertFlashcard[]): Promise<Flashcard[]>;
  deleteCardsBySet(setId: string): Promise<void>;

  // User Progress
  getProgressForUser(userId: string, setId: string): Promise<UserProgress[]>;
  getOrCreateProgress(userId: string, cardId: string): Promise<UserProgress>;
  updateProgress(id: string, data: Partial<UserProgress>): Promise<UserProgress>;

  // User Stats
  getStats(userId: string): Promise<UserStats | undefined>;
  getOrCreateStats(userId: string): Promise<UserStats>;
  updateStats(userId: string, data: Partial<UserStats>): Promise<UserStats>;

  // Admin
  isAdmin(userId: string): Promise<boolean>;
  hasAnyAdmin(): Promise<boolean>;
  addAdmin(userId: string): Promise<AdminUser>;
}

export class DatabaseStorage implements IStorage {
  // Flashcard Sets
  async getAllSets(): Promise<FlashcardSet[]> {
    return db.select().from(flashcardSets).orderBy(flashcardSets.createdAt);
  }

  async getSetsForUser(userId: string | null): Promise<FlashcardSet[]> {
    // Return public sets + sets created by this user
    if (userId) {
      return db.select().from(flashcardSets)
        .where(or(
          eq(flashcardSets.isPublic, true),
          eq(flashcardSets.createdBy, userId)
        ))
        .orderBy(flashcardSets.createdAt);
    }
    // No user - just public sets
    return db.select().from(flashcardSets)
      .where(eq(flashcardSets.isPublic, true))
      .orderBy(flashcardSets.createdAt);
  }

  async getSet(id: string): Promise<FlashcardSet | undefined> {
    const [set] = await db.select().from(flashcardSets).where(eq(flashcardSets.id, id));
    return set;
  }

  async createSet(set: InsertFlashcardSet & { createdBy?: string | null; isPublic?: boolean }): Promise<FlashcardSet> {
    const [created] = await db.insert(flashcardSets).values(set).returning();
    return created;
  }

  async deleteSet(id: string): Promise<void> {
    await db.delete(flashcardSets).where(eq(flashcardSets.id, id));
  }

  async updateSetCardCount(setId: string, count: number): Promise<void> {
    await db.update(flashcardSets).set({ cardCount: count }).where(eq(flashcardSets.id, setId));
  }

  async updateSetPublic(setId: string, isPublic: boolean): Promise<FlashcardSet> {
    const [updated] = await db.update(flashcardSets)
      .set({ isPublic })
      .where(eq(flashcardSets.id, setId))
      .returning();
    return updated;
  }

  async canUserModifySet(userId: string, setId: string): Promise<boolean> {
    const set = await this.getSet(setId);
    if (!set) return false;
    // User can modify if they created it
    if (set.createdBy === userId) return true;
    // Admin can modify any set
    return this.isAdmin(userId);
  }

  // Flashcards
  async getCardsBySet(setId: string): Promise<Flashcard[]> {
    return db.select().from(flashcards).where(eq(flashcards.setId, setId));
  }

  async createCards(cards: InsertFlashcard[]): Promise<Flashcard[]> {
    if (cards.length === 0) return [];
    return db.insert(flashcards).values(cards).returning();
  }

  async deleteCardsBySet(setId: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.setId, setId));
  }

  // User Progress
  async getProgressForUser(userId: string, setId: string): Promise<UserProgress[]> {
    // Get progress for all cards in a set for a user
    const cards = await this.getCardsBySet(setId);
    const cardIds = cards.map(c => c.id);
    
    if (cardIds.length === 0) return [];
    
    return db.select().from(userProgress)
      .where(and(
        eq(userProgress.odUserId, userId),
        sql`${userProgress.cardId} = ANY(${cardIds})`
      ));
  }

  async getOrCreateProgress(userId: string, cardId: string): Promise<UserProgress> {
    const [existing] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.odUserId, userId),
        eq(userProgress.cardId, cardId)
      ));

    if (existing) return existing;

    const [created] = await db.insert(userProgress).values({
      odUserId: userId,
      cardId,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextDueDate: new Date(),
    }).returning();

    return created;
  }

  async updateProgress(id: string, data: Partial<UserProgress>): Promise<UserProgress> {
    const [updated] = await db.update(userProgress)
      .set(data)
      .where(eq(userProgress.id, id))
      .returning();
    return updated;
  }

  // User Stats
  async getStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async getOrCreateStats(userId: string): Promise<UserStats> {
    const existing = await this.getStats(userId);
    if (existing) return existing;

    const [created] = await db.insert(userStats).values({
      userId,
      totalReviews: 0,
      correctReviews: 0,
      currentStreak: 0,
      longestStreak: 0,
    }).returning();

    return created;
  }

  async updateStats(userId: string, data: Partial<UserStats>): Promise<UserStats> {
    const [updated] = await db.update(userStats)
      .set(data)
      .where(eq(userStats.userId, userId))
      .returning();
    return updated;
  }

  // Admin
  async isAdmin(userId: string): Promise<boolean> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId));
    return !!admin;
  }

  async hasAnyAdmin(): Promise<boolean> {
    const admins = await db.select().from(adminUsers).limit(1);
    return admins.length > 0;
  }

  async addAdmin(userId: string): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values({ userId }).returning();
    return admin;
  }
}

export const storage = new DatabaseStorage();
