import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { calculateSM2 } from "./sm2";
import { z } from "zod";

// Schema for validating rate request
const rateSchema = z.object({
  cardId: z.string(),
  quality: z.number().min(0).max(5),
});

// Schema for creating a set with cards
const createSetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cards: z.array(z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    visualMetaphor: z.string().optional(),
  })),
});

// Helper to get user ID from request (authenticated user or guest from cookie)
function getUserId(req: any): string | null {
  // Check for authenticated user first
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  // Check for guest cookie
  const guestId = req.cookies?.guestId || req.headers["x-guest-id"];
  if (guestId && typeof guestId === "string" && guestId.startsWith("guest-")) {
    return guestId;
  }
  return null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth first (IMPORTANT: must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // ============================================
  // PUBLIC ROUTES (no auth required)
  // ============================================

  // Get all flashcard sets
  app.get("/api/sets", async (req, res) => {
    try {
      const sets = await storage.getAllSets();
      res.json(sets);
    } catch (error) {
      console.error("Error fetching sets:", error);
      res.status(500).json({ message: "Failed to fetch flashcard sets" });
    }
  });

  // Get cards for a set with user progress
  app.get("/api/sets/:setId/cards/:odUserId", async (req, res) => {
    try {
      const { setId, odUserId } = req.params;
      
      // Validate userId matches current user or is a valid guest ID
      const currentUserId = getUserId(req);
      const isValidGuest = odUserId.startsWith("guest-");
      const isCurrentUser = currentUserId === odUserId;
      
      // Allow access if it's the current user or a valid guest
      if (!isCurrentUser && !isValidGuest) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get all cards in the set
      const cards = await storage.getCardsBySet(setId);
      
      if (cards.length === 0) {
        return res.json([]);
      }

      // Get user progress for each card
      const cardsWithProgress = await Promise.all(
        cards.map(async (card) => {
          const progress = await storage.getOrCreateProgress(odUserId, card.id);
          return {
            ...card,
            easinessFactor: progress.easinessFactor || 2.5,
            interval: progress.interval || 1,
            repetitions: progress.repetitions || 0,
            nextDueDate: progress.nextDueDate?.toISOString() || new Date().toISOString(),
          };
        })
      );

      res.json(cardsWithProgress);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Rate a card (record progress) - uses authenticated user or guest from header
  app.post("/api/progress/rate", async (req, res) => {
    try {
      const parsed = rateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { cardId, quality } = parsed.data;
      
      // Get user ID from auth or guest header
      let odUserId = getUserId(req);
      
      // If no user ID, check for guest ID in request header
      const guestHeader = req.headers["x-guest-id"] as string;
      if (!odUserId && guestHeader && guestHeader.startsWith("guest-")) {
        odUserId = guestHeader;
      }
      
      if (!odUserId) {
        return res.status(401).json({ message: "User identification required" });
      }

      // Get or create progress
      const progress = await storage.getOrCreateProgress(odUserId, cardId);

      // Calculate new SM-2 values
      const result = calculateSM2(
        progress.easinessFactor || 2.5,
        progress.interval || 1,
        progress.repetitions || 0,
        quality as 0 | 1 | 2 | 3 | 4 | 5
      );

      // Update progress
      const updated = await storage.updateProgress(progress.id, {
        easinessFactor: result.easinessFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        lastReviewDate: new Date(),
        nextDueDate: result.nextDueDate,
      });

      // Update user stats if it's a real user (not guest)
      if (!odUserId.startsWith("guest-")) {
        const stats = await storage.getOrCreateStats(odUserId);
        const now = new Date();
        const lastReview = stats.lastReviewDate ? new Date(stats.lastReviewDate) : null;
        
        // Check if this is a new day for streak
        let newStreak = stats.currentStreak || 0;
        if (lastReview) {
          const lastDate = new Date(lastReview.toDateString());
          const today = new Date(now.toDateString());
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1; // Reset streak
          }
          // If same day, keep current streak
        } else {
          newStreak = 1;
        }

        const longestStreak = Math.max(stats.longestStreak || 0, newStreak);

        await storage.updateStats(odUserId, {
          totalReviews: (stats.totalReviews || 0) + 1,
          correctReviews: quality >= 3 ? (stats.correctReviews || 0) + 1 : stats.correctReviews || 0,
          currentStreak: newStreak,
          longestStreak,
          lastReviewDate: now,
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error rating card:", error);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  // Get user stats
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate the requesting user can access these stats
      const currentUserId = getUserId(req);
      const isValidGuest = userId.startsWith("guest-");
      const isCurrentUser = currentUserId === userId;
      
      if (!isCurrentUser && !isValidGuest) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getOrCreateStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ============================================
  // ADMIN ROUTES (auth required)
  // ============================================

  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ isAdmin: false });
      }
      
      const isAdmin = await storage.isAdmin(userId);
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.json({ isAdmin: false });
    }
  });

  // Create flashcard set with cards (admin only)
  app.post("/api/admin/sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isAdmin = await storage.isAdmin(userId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const parsed = createSetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request data", errors: parsed.error.errors });
      }

      const { name, description, cards } = parsed.data;

      // Create the set
      const set = await storage.createSet({ name, description: description || null });

      // Create cards
      const cardData = cards.map(card => ({
        setId: set.id,
        term: card.term,
        definition: card.definition,
        visualMetaphor: card.visualMetaphor || null,
      }));

      await storage.createCards(cardData);

      // Update card count
      await storage.updateSetCardCount(set.id, cards.length);

      // Get updated set
      const updatedSet = await storage.getSet(set.id);
      res.json(updatedSet);
    } catch (error) {
      console.error("Error creating set:", error);
      res.status(500).json({ message: "Failed to create flashcard set" });
    }
  });

  // Delete flashcard set (admin only)
  app.delete("/api/admin/sets/:setId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isAdmin = await storage.isAdmin(userId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { setId } = req.params;
      await storage.deleteSet(setId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting set:", error);
      res.status(500).json({ message: "Failed to delete flashcard set" });
    }
  });

  // Make first authenticated user an admin (only if no admins exist)
  app.post("/api/admin/setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if this user is already admin
      const isAlreadyAdmin = await storage.isAdmin(userId);
      if (isAlreadyAdmin) {
        return res.json({ success: true, isAdmin: true, message: "Already an admin" });
      }

      // Check if any admins exist at all
      const hasAnyAdmin = await storage.hasAnyAdmin();
      if (hasAnyAdmin) {
        return res.status(403).json({ message: "Admin already exists. Contact existing admin for access." });
      }

      // No admins exist - make this user the first admin
      await storage.addAdmin(userId);
      res.json({ success: true, isAdmin: true, message: "You are now an admin" });
    } catch (error) {
      console.error("Error setting up admin:", error);
      res.status(500).json({ message: "Failed to setup admin" });
    }
  });

  return httpServer;
}
