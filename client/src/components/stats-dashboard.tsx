import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Target, 
  Flame, 
  CheckCircle2,
  BookOpen,
  TrendingUp
} from "lucide-react";
import type { UserStats } from "@shared/schema";

interface MasteryData {
  new: number;
  learning: number;
  review: number;
  mastered: number;
}

interface StatsDashboardProps {
  stats: UserStats | null;
  masteryData: MasteryData;
  totalCards: number;
  dueToday: number;
  isLoading: boolean;
}

export function StatsDashboard({ 
  stats, 
  masteryData, 
  totalCards, 
  dueToday,
  isLoading 
}: StatsDashboardProps) {
  const accuracy = stats && (stats.totalReviews ?? 0) > 0
    ? Math.round(((stats.correctReviews ?? 0) / (stats.totalReviews ?? 1)) * 100)
    : 0;

  const masteryTotal = masteryData.new + masteryData.learning + masteryData.review + masteryData.mastered;
  const masteryPercent = masteryTotal > 0 ? Math.round((masteryData.mastered / masteryTotal) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate" data-testid="card-due-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Today
            </CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-due-count">{dueToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              cards need review
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-streak">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-streak">
              {stats?.currentStreak || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              days in a row
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-reviews">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-reviews">
              {stats?.totalReviews || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {accuracy}% accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-mastery">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastery
            </CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-mastery-percent">
              {masteryPercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {masteryData.mastered} of {totalCards} cards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Card Mastery Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress bars */}
            <div className="space-y-3">
              <MasteryBar 
                label="New" 
                count={masteryData.new} 
                total={masteryTotal}
                colorClass="bg-muted-foreground"
              />
              <MasteryBar 
                label="Learning" 
                count={masteryData.learning} 
                total={masteryTotal}
                colorClass="bg-amber-500"
              />
              <MasteryBar 
                label="Review" 
                count={masteryData.review} 
                total={masteryTotal}
                colorClass="bg-blue-500"
              />
              <MasteryBar 
                label="Mastered" 
                count={masteryData.mastered} 
                total={masteryTotal}
                colorClass="bg-emerald-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Info */}
      {stats && (stats.longestStreak ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-accent/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">Longest Streak</p>
              <p className="text-2xl font-bold">
                {stats.longestStreak} days
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasteryBar({ 
  label, 
  count, 
  total, 
  colorClass 
}: { 
  label: string; 
  count: number; 
  total: number;
  colorClass: string;
}) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
