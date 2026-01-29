import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "./theme-toggle";
import { Brain, Target, TrendingUp, Sparkles, Layers, Zap } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-xl">JC's Flashcards</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Master Any Subject with{" "}
                  <span className="text-primary">Spaced Repetition</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                  Learn smarter, not harder. JC's Flashcards uses the proven SM-2 algorithm 
                  to help you build lasting knowledge with scientifically-optimized review intervals.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">Get Started Free</a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-try-guest">
                  <a href="/?guest=true">Try as Guest</a>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  <span>Track your progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <span>Instant results</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 rounded-2xl p-8 md:p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
                <div className="relative space-y-4">
                  {/* Mock flashcard */}
                  <Card className="transform transition-all duration-300 hover:scale-105 shadow-lg">
                    <CardContent className="p-6 space-y-3">
                      <div className="text-xs font-medium text-accent uppercase tracking-wide">
                        AI/ML Fundamentals
                      </div>
                      <h3 className="font-serif text-xl font-semibold">
                        What is a Transformer?
                      </h3>
                      <div className="pt-2 border-t text-muted-foreground text-sm">
                        Click to reveal answer...
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Stats preview */}
                  <div className="flex gap-3">
                    <Card className="flex-1 bg-primary/10 border-primary/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">52</div>
                        <div className="text-xs text-muted-foreground">Cards</div>
                      </CardContent>
                    </Card>
                    <Card className="flex-1 bg-accent/10 border-accent/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-accent">7</div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </CardContent>
                    </Card>
                    <Card className="flex-1 bg-emerald-500/10 border-emerald-500/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">85%</div>
                        <div className="text-xs text-muted-foreground">Mastered</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Why Spaced Repetition Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The SM-2 algorithm schedules reviews at optimal intervals, 
              strengthening your memory right before you're about to forget.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Science-Backed</h3>
                <p className="text-sm text-muted-foreground">
                  Based on decades of cognitive science research on memory and learning retention.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg">Adaptive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Cards you find difficult appear more often. Easy cards fade into the background.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Watch your knowledge grow with streaks, mastery levels, and detailed statistics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JC's Flashcards. Learn smarter, remember longer.</p>
        </div>
      </footer>
    </div>
  );
}
