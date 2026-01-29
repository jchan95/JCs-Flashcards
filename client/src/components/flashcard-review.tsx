import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Lightbulb, 
  RotateCcw, 
  ChevronRight,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { QUALITY_LABELS, type QualityRating, getMasteryLevel, getMasteryColor } from "@/lib/sm2";
import type { Flashcard } from "@shared/schema";

interface CardWithProgress extends Flashcard {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextDueDate: string;
}

interface FlashcardReviewProps {
  setName: string;
  cards: CardWithProgress[];
  onRate: (cardId: string, quality: QualityRating) => void;
  onBack: () => void;
  onComplete: () => void;
  isPending?: boolean;
}

export function FlashcardReview({ 
  setName, 
  cards, 
  onRate, 
  onBack, 
  onComplete,
  isPending 
}: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const reviewedCount = reviewed.size;
  const progressPercent = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;

  const masteryLevel = currentCard 
    ? getMasteryLevel(currentCard.repetitions, currentCard.easinessFactor, currentCard.interval)
    : "new";

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  }, [isFlipped]);

  const handleRate = useCallback((quality: QualityRating) => {
    if (!currentCard || isPending) return;
    
    onRate(currentCard.id, quality);
    setReviewed((prev) => new Set(prev).add(currentCard.id));
    
    // Move to next card or complete
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setSessionComplete(true);
    }
  }, [currentCard, currentIndex, totalCards, onRate, isPending]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete) return;
      
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "h") {
        setShowHint((prev) => !prev);
      } else if (isFlipped && e.key >= "0" && e.key <= "5") {
        handleRate(parseInt(e.key) as QualityRating);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleFlip, handleRate, sessionComplete]);

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-serif text-2xl font-bold">All Caught Up!</h2>
            <p className="text-muted-foreground">
              No cards are due for review right now. Come back later!
            </p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Card>
          <CardContent className="py-12 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground">
                You reviewed <span className="font-semibold text-foreground">{reviewedCount}</span> cards. 
                Great job!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onComplete} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Study Again
              </Button>
              <Button onClick={onBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Choose Another Set
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          data-testid="button-back-to-sets"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center">
          <h2 className="font-semibold text-sm text-muted-foreground">{setName}</h2>
          <p className="text-xs text-muted-foreground">
            {reviewedCount} reviewed, {totalCards - reviewedCount} remaining
          </p>
        </div>
        <Badge className={getMasteryColor(masteryLevel)}>
          {masteryLevel.charAt(0).toUpperCase() + masteryLevel.slice(1)}
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progressPercent} className="h-2" />

      {/* Flashcard */}
      <div 
        className="flashcard-flip cursor-pointer"
        onClick={handleFlip}
        data-testid="flashcard"
      >
        <Card className={`min-h-[300px] transition-all duration-200 ${isFlipped ? "ring-2 ring-primary/20" : "hover:shadow-lg"}`}>
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            {!isFlipped ? (
              <div className="space-y-4">
                <p className="text-xs font-medium text-accent uppercase tracking-wide">
                  Term
                </p>
                <h3 className="font-serif text-2xl md:text-3xl font-bold" data-testid="text-term">
                  {currentCard.term}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tap or press Space to reveal
                </p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">
                  Definition
                </p>
                <p className="text-lg md:text-xl" data-testid="text-definition">
                  {currentCard.definition}
                </p>
                {showHint && currentCard.visualMetaphor && (
                  <div className="mt-4 p-3 bg-accent/10 rounded-md border border-accent/20">
                    <p className="text-sm text-accent flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 shrink-0" />
                      <span>{currentCard.visualMetaphor}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hint button (shown before flip if card has metaphor) */}
      {!isFlipped && currentCard.visualMetaphor && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            className="text-accent"
            data-testid="button-show-hint"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          {showHint && (
            <p className="mt-2 text-sm text-accent/80">{currentCard.visualMetaphor}</p>
          )}
        </div>
      )}

      {/* Rating buttons (shown after flip) */}
      {isFlipped && (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            How well did you remember?
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUALITY_LABELS.map(({ value, label, description, color }) => (
              <Button
                key={value}
                variant={value < 3 ? "outline" : value < 4 ? "secondary" : "default"}
                className={`flex flex-col h-auto py-2 px-2 ${
                  value < 3 
                    ? "border-destructive/30 text-destructive hover:bg-destructive/10" 
                    : value < 4 
                    ? "border-accent/30"
                    : ""
                }`}
                onClick={() => handleRate(value as QualityRating)}
                disabled={isPending}
                data-testid={`button-rate-${value}`}
              >
                <span className="font-bold text-lg">{value}</span>
                <span className="text-xs opacity-80">{label}</span>
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Press 0-5 on keyboard for quick rating
          </p>
        </div>
      )}

      {/* Hint toggle after flip */}
      {isFlipped && currentCard.visualMetaphor && !showHint && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHint(true)}
            className="text-accent"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Show Memory Hint
          </Button>
        </div>
      )}
    </div>
  );
}
