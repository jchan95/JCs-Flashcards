import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { SetSelection } from "@/components/set-selection";
import { FlashcardReview } from "@/components/flashcard-review";
import { StatsDashboard } from "@/components/stats-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getMasteryLevel, calculateSM2, type QualityRating } from "@/lib/sm2";
import { getGuestId } from "@/lib/guest";
import { addToOfflineQueue, getOfflineQueueForUser, removeFromOfflineQueue, isOnline } from "@/lib/offline-queue";
import type { FlashcardSet, Flashcard, UserStats } from "@shared/schema";
import { BookOpen, BarChart3 } from "lucide-react";
import { UserUploadDialog } from "@/components/user-upload-dialog";

interface CardWithProgress extends Flashcard {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextDueDate: string;
}

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if guest mode - use stable guest ID from localStorage
  const isGuest = !isAuthenticated && new URLSearchParams(window.location.search).get("guest") === "true";
  
  // Memoize userId to prevent re-creating on each render
  const userId = useMemo(() => {
    if (user?.id) return user.id;
    if (isGuest) return getGuestId();
    return null;
  }, [user?.id, isGuest]);

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("study");

  // Fetch flashcard sets
  const { data: sets = [], isLoading: setsLoading } = useQuery<FlashcardSet[]>({
    queryKey: ["/api/sets"],
  });

  // Fetch cards for selected set with progress - use correct URL format
  const { data: serverCards = [], isLoading: cardsLoading, refetch: refetchCards } = useQuery<CardWithProgress[]>({
    queryKey: [`/api/sets/${selectedSetId}/cards/${userId}`],
    enabled: !!selectedSetId && !!userId,
  });

  // Local state for offline-capable card updates
  const [localCardUpdates, setLocalCardUpdates] = useState<Record<string, Partial<CardWithProgress>>>({});

  // Merge server cards with local updates for offline support
  const cardsWithProgress = useMemo(() => {
    return serverCards.map(card => ({
      ...card,
      ...localCardUpdates[card.id],
    }));
  }, [serverCards, localCardUpdates]);

  // Clear local updates when switching sets or when server data refreshes
  useEffect(() => {
    setLocalCardUpdates({});
  }, [selectedSetId]);

  // Fetch user stats (only for authenticated users) - use correct URL format
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: [`/api/stats/${userId}`],
    enabled: !!userId && isAuthenticated,
  });

  // Check if user is admin
  const { data: adminStatus } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  // Apply optimistic update locally using SM-2 algorithm
  const applyLocalUpdate = useCallback((cardId: string, quality: QualityRating) => {
    const card = cardsWithProgress.find(c => c.id === cardId);
    if (!card) return;

    const result = calculateSM2(
      card.easinessFactor,
      card.interval,
      card.repetitions,
      quality
    );

    setLocalCardUpdates(prev => ({
      ...prev,
      [cardId]: {
        easinessFactor: result.easinessFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextDueDate: result.nextDueDate.toISOString(),
      },
    }));
  }, [cardsWithProgress]);

  // Sync offline queue when coming back online
  const syncOfflineQueue = useCallback(async () => {
    if (!userId) return;
    
    const queue = getOfflineQueueForUser(userId);
    if (queue.length === 0) return;

    let syncedAny = false;
    for (const item of queue) {
      try {
        await apiRequest("POST", "/api/progress/rate", {
          cardId: item.cardId,
          quality: item.quality,
        });
        removeFromOfflineQueue(item.cardId, userId);
        syncedAny = true;
      } catch {
        // Still offline or error - keep in queue and stop trying
        break;
      }
    }

    // Refresh data after syncing and clear local updates
    if (syncedAny) {
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${selectedSetId}/cards/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${userId}`] });
      setLocalCardUpdates({});
    }
  }, [selectedSetId, userId]);

  // Listen for online event to sync queue
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncOfflineQueue]);

  // Try to sync on mount
  useEffect(() => {
    if (isOnline()) {
      syncOfflineQueue();
    }
  }, [syncOfflineQueue]);

  // Upload set mutation (for authenticated users)
  const uploadMutation = useMutation({
    mutationFn: async (data: { name: string; cards: Array<{ term: string; definition: string; hint?: string }> }) => {
      return apiRequest("POST", "/api/sets/upload", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets"] });
      toast({
        title: "Success",
        description: "Flashcard set created!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload flashcard set. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Rate card mutation with offline support
  const rateMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: QualityRating }) => {
      // Always apply local update first (optimistic)
      applyLocalUpdate(cardId, quality);

      if (!userId) {
        return { offline: true };
      }

      if (!isOnline()) {
        // Queue for later sync
        addToOfflineQueue(cardId, quality, userId);
        return { offline: true, cardId };
      }

      // For online requests, just send directly
      // The server should handle any duplicate ratings gracefully (last one wins)
      const response = await apiRequest("POST", "/api/progress/rate", { 
        cardId, 
        quality,
      });
      return { success: true, cardId, response };
    },
    onSuccess: (result) => {
      if (result && 'offline' in result) {
        // Don't show error for offline mode - progress is saved locally
        return;
      }
      if (result && 'success' in result && result.cardId) {
        // Clear the local update for this card since server has the truth now
        setLocalCardUpdates(prev => {
          const updated = { ...prev };
          delete updated[result.cardId];
          return updated;
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${selectedSetId}/cards/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${userId}`] });
    },
    onError: (_, variables) => {
      if (!userId) return;
      // If the request failed (e.g., went offline mid-request), queue it for later
      addToOfflineQueue(variables.cardId, variables.quality, userId);
      // Local update already applied, so user can continue seamlessly
    },
  });

  // Calculate mastery data
  const masteryData = {
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  };

  cardsWithProgress.forEach((card) => {
    const level = getMasteryLevel(card.repetitions, card.easinessFactor, card.interval);
    masteryData[level]++;
  });

  // Calculate due cards
  const now = new Date();
  const dueCards = cardsWithProgress.filter((card) => {
    const dueDate = new Date(card.nextDueDate);
    return dueDate <= now;
  });

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  // Redirect to landing if not authenticated and not guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isGuest) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, isGuest, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAdmin={adminStatus?.isAdmin} isGuest={isGuest} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {selectedSetId && selectedSet ? (
          <FlashcardReview
            setName={selectedSet.name}
            cards={cardsWithProgress}
            onRate={(cardId, quality) => rateMutation.mutate({ cardId, quality })}
            onBack={() => setSelectedSetId(null)}
            onComplete={() => refetchCards()}
            isPending={rateMutation.isPending}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold">
                  {isGuest ? "Welcome, Guest!" : `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}!`}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {dueCards.length > 0 
                    ? `You have ${dueCards.length} cards due for review today.`
                    : "Great job! No cards due right now."
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <UserUploadDialog
                    onUpload={(name, cards) => uploadMutation.mutate({ name, cards })}
                    isPending={uploadMutation.isPending}
                  />
                )}
                <TabsList>
                  <TabsTrigger value="study" className="gap-2" data-testid="tab-study">
                    <BookOpen className="h-4 w-4" />
                    Study
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats">
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="study" className="mt-6">
              <SetSelection
                sets={sets}
                isLoading={setsLoading}
                onSelectSet={setSelectedSetId}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <StatsDashboard
                stats={stats || null}
                masteryData={masteryData}
                totalCards={cardsWithProgress.length}
                dueToday={dueCards.length}
                isLoading={statsLoading || cardsLoading}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
