import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Layers
} from "lucide-react";
import { parseCSV } from "@/lib/sm2";
import type { FlashcardSet } from "@shared/schema";

interface AdminUploadProps {
  sets: FlashcardSet[];
  onUpload: (name: string, description: string, cards: Array<{ term: string; definition: string; visualMetaphor?: string }>) => void;
  onDeleteSet: (setId: string) => void;
  isPending: boolean;
  isDeleting: boolean;
}

export function AdminUpload({ sets, onUpload, onDeleteSet, isPending, isDeleting }: AdminUploadProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [parsedCards, setParsedCards] = useState<Array<{ term: string; definition: string; visualMetaphor?: string }>>([]);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      tryParseCSV(content);
    };
    reader.readAsText(file);
  };

  const tryParseCSV = (content: string) => {
    try {
      const cards = parseCSV(content);
      if (cards.length === 0) {
        setParseError("No valid cards found in CSV. Make sure it has at least Term and Definition columns.");
        setParsedCards([]);
      } else {
        setParsedCards(cards);
        setParseError("");
      }
    } catch (err) {
      setParseError("Failed to parse CSV. Check the format.");
      setParsedCards([]);
    }
  };

  const handleCSVChange = (content: string) => {
    setCsvContent(content);
    if (content.trim()) {
      tryParseCSV(content);
    } else {
      setParsedCards([]);
      setParseError("");
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || parsedCards.length === 0) return;
    onUpload(name.trim(), description.trim(), parsedCards);
    // Reset form
    setName("");
    setDescription("");
    setCsvContent("");
    setParsedCards([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSubmit = name.trim() && parsedCards.length > 0 && !isPending;

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Flashcard Set
          </CardTitle>
          <CardDescription>
            Upload a CSV file with Term, Definition, and optional Visual Metaphor columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-name">Set Name *</Label>
              <Input
                id="set-name"
                placeholder="e.g., AI/ML Fundamentals"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-set-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-description">Description (optional)</Label>
              <Input
                id="set-description"
                placeholder="Brief description of this set"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-set-description"
              />
            </div>
          </div>

          <Separator />

          {/* File Upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="flex-1"
                  data-testid="input-file-upload"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-content">Or paste CSV content directly</Label>
              <Textarea
                id="csv-content"
                placeholder="Term,Definition,Visual Metaphor
LLM,Large Language Model—a neural network trained on massive text data,A savant who's read every book
Transformer,The neural network architecture underlying modern LLMs,An orchestra conductor"
                value={csvContent}
                onChange={(e) => handleCSVChange(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
                data-testid="textarea-csv-content"
              />
            </div>

            {/* Parse Status */}
            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {parseError}
              </div>
            )}
            {parsedCards.length > 0 && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {parsedCards.length} cards parsed successfully
              </div>
            )}

            {/* Preview */}
            {parsedCards.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 3 cards)</Label>
                <div className="space-y-2">
                  {parsedCards.slice(0, 3).map((card, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-md text-sm">
                      <div className="font-medium">{card.term}</div>
                      <div className="text-muted-foreground line-clamp-1">{card.definition}</div>
                    </div>
                  ))}
                  {parsedCards.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {parsedCards.length - 3} more cards
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="w-full gap-2"
            data-testid="button-upload-set"
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Uploading..." : `Upload Set (${parsedCards.length} cards)`}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Sets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Manage Existing Sets
          </CardTitle>
          <CardDescription>
            {sets.length} flashcard {sets.length === 1 ? "set" : "sets"} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No flashcard sets yet. Upload one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sets.map((set) => (
                <div 
                  key={set.id}
                  className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-md"
                  data-testid={`admin-set-${set.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{set.name}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {set.cardCount} cards
                      </Badge>
                    </div>
                    {set.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {set.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteSet(set.id)}
                    disabled={isDeleting}
                    data-testid={`button-delete-set-${set.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
