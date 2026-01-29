import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Play, BookOpen } from "lucide-react";
import type { FlashcardSet } from "@shared/schema";

interface SetSelectionProps {
  sets: FlashcardSet[];
  isLoading: boolean;
  onSelectSet: (setId: string) => void;
}

export function SetSelection({ sets, isLoading, onSelectSet }: SetSelectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">No Flashcard Sets Available</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              There are no flashcard sets to study yet. Check back later or ask an admin to upload some!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => (
        <Card 
          key={set.id} 
          className="overflow-hidden hover-elevate transition-all duration-200"
          data-testid={`card-set-${set.id}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base line-clamp-2">{set.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {set.cardCount} {set.cardCount === 1 ? "card" : "cards"}
              </Badge>
            </div>
            {set.description && (
              <CardDescription className="line-clamp-2 mt-2">
                {set.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              onClick={() => onSelectSet(set.id)}
              data-testid={`button-study-${set.id}`}
            >
              <Play className="h-4 w-4" />
              Study This Set
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
