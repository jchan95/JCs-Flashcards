import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Flashcard Sets
export const flashcardSets = pgTable("flashcard_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  cardCount: integer("card_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcardSetsRelations = relations(flashcardSets, ({ many }) => ({
  cards: many(flashcards),
}));

export const insertFlashcardSetSchema = createInsertSchema(flashcardSets).omit({
  id: true,
  cardCount: true,
  createdAt: true,
});

export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;
export type FlashcardSet = typeof flashcardSets.$inferSelect;

// Flashcards
export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  setId: varchar("set_id").notNull().references(() => flashcardSets.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  visualMetaphor: text("visual_metaphor"),
});

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  set: one(flashcardSets, {
    fields: [flashcards.setId],
    references: [flashcardSets.id],
  }),
}));

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
});

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

// User Progress (SM-2 tracking) - per card per user
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  odUserId: varchar("user_id").notNull(), // can be real user id or guest session id
  cardId: varchar("card_id").notNull().references(() => flashcards.id, { onDelete: "cascade" }),
  easinessFactor: real("easiness_factor").default(2.5),
  interval: integer("interval").default(1),
  repetitions: integer("repetitions").default(0),
  lastReviewDate: timestamp("last_review_date"),
  nextDueDate: timestamp("next_due_date").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// User Stats
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  totalReviews: integer("total_reviews").default(0),
  correctReviews: integer("correct_reviews").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastReviewDate: timestamp("last_review_date"),
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
});

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;

// CSV upload schema for validation
export const csvCardSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  visualMetaphor: z.string().optional(),
});

export type CSVCard = z.infer<typeof csvCardSchema>;
