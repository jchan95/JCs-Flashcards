import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { Layers, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isAdmin?: boolean;
  isGuest?: boolean;
}

export function Header({ isAdmin, isGuest }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] || "Guest";

  const initials = user?.firstName 
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
    : displayName[0]?.toUpperCase() || "G";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1 -ml-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-xl" data-testid="text-app-title">
            JC's Flashcards
          </span>
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isGuest ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" data-testid="button-sign-in">
                <a href="/api/login">Sign In</a>
              </Button>
              <Button variant="ghost" asChild data-testid="button-exit-guest">
                <a href="/">Exit</a>
              </Button>
            </div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2" data-testid="button-user-menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <a href="/admin" className="cursor-pointer" data-testid="link-admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild data-testid="button-sign-in">
              <a href="/api/login">Sign In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
