import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "./theme-toggle";
import { Layers } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-xl">JC's Flashcards</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="font-serif text-2xl font-bold">JC's Flashcards</h1>
                <p className="text-muted-foreground">
                  Master any subject with spaced repetition.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button size="lg" className="w-full" asChild data-testid="button-login">
                  <a href="/api/login">Sign In</a>
                </Button>
                <Button size="lg" variant="outline" className="w-full" asChild data-testid="button-try-guest">
                  <a href="/?guest=true">Try as Guest</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JC's Flashcards</p>
        </div>
      </footer>
    </div>
  );
}
