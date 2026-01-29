import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { AdminUpload } from "@/components/admin-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FlashcardSet } from "@shared/schema";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is admin
  const { data: adminStatus, isLoading: adminLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  // Fetch flashcard sets
  const { data: sets = [], isLoading: setsLoading } = useQuery<FlashcardSet[]>({
    queryKey: ["/api/sets"],
    enabled: adminStatus?.isAdmin,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description: string; 
      cards: Array<{ term: string; definition: string; hint?: string }>; 
      isPublic: boolean;
    }) => {
      return apiRequest("POST", "/api/admin/sets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets"] });
      toast({
        title: "Success",
        description: "Flashcard set uploaded successfully!",
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

  // Toggle public mutation
  const togglePublicMutation = useMutation({
    mutationFn: async ({ setId, isPublic }: { setId: string; isPublic: boolean }) => {
      return apiRequest("PATCH", `/api/admin/sets/${setId}/public`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets"] });
      toast({
        title: "Updated",
        description: "Set visibility updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      return apiRequest("DELETE", `/api/admin/sets/${setId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets"] });
      toast({
        title: "Deleted",
        description: "Flashcard set has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flashcard set. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not admin - show access denied
  if (!adminStatus?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isAdmin={false} />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-serif text-xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have admin permissions to access this page.
              </p>
              <Button onClick={() => setLocation("/home")} variant="outline">
                Go Back to Study
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAdmin={true} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage flashcard sets for all users.
            </p>
          </div>

          <AdminUpload
            sets={sets}
            onUpload={(name, description, cards, isPublic) => 
              uploadMutation.mutate({ name, description, cards, isPublic })
            }
            onDeleteSet={(setId) => deleteMutation.mutate(setId)}
            onTogglePublic={(setId, isPublic) => togglePublicMutation.mutate({ setId, isPublic })}
            isPending={uploadMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        </div>
      </main>
    </div>
  );
}
