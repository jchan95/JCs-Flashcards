import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { parseCSV } from "@/lib/sm2";

interface UserUploadDialogProps {
  onUpload: (name: string, cards: Array<{ term: string; definition: string; hint?: string }>) => void;
  isPending: boolean;
}

export function UserUploadDialog({ onUpload, isPending }: UserUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "title">("upload");
  const [parsedCards, setParsedCards] = useState<Array<{ term: string; definition: string; hint?: string }>>([]);
  const [parseError, setParseError] = useState("");
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      tryParseCSV(content);
    };
    reader.readAsText(file);
  };

  const tryParseCSV = (content: string) => {
    try {
      const cards = parseCSV(content);
      if (cards.length === 0) {
        setParseError("No valid cards found. Make sure your CSV has Term and Definition columns.");
        setParsedCards([]);
      } else {
        setParsedCards(cards);
        setParseError("");
        setStep("title");
      }
    } catch {
      setParseError("Failed to parse CSV. Check the format.");
      setParsedCards([]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || parsedCards.length === 0) return;
    onUpload(title.trim(), parsedCards);
    resetAndClose();
  };

  const resetAndClose = () => {
    setOpen(false);
    setStep("upload");
    setParsedCards([]);
    setParseError("");
    setTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetAndClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-upload-csv">
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "upload" ? (
          <>
            <DialogHeader>
              <DialogTitle>Upload Flashcards</DialogTitle>
              <DialogDescription>
                Upload a CSV file with 3 columns: Term, Definition, and Hint (optional).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <a 
                  href="/flashcard-template.csv" 
                  download="flashcard-template.csv"
                  className="underline hover:text-foreground"
                  data-testid="link-download-template"
                >
                  Download template CSV
                </a>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV file</Label>
                <Input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  data-testid="input-csv-file"
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Name Your Flashcard Set</DialogTitle>
              <DialogDescription>
                {parsedCards.length} cards loaded successfully. Give your set a name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {parsedCards.length} cards ready to import
              </div>

              <div className="space-y-2">
                <Label htmlFor="set-title">Set Title</Label>
                <Input
                  id="set-title"
                  placeholder="e.g., Spanish Vocabulary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  data-testid="input-set-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Preview (first 3 cards)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {parsedCards.slice(0, 3).map((card, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-md text-sm">
                      <div className="font-medium truncate">{card.term}</div>
                      <div className="text-muted-foreground text-xs truncate">{card.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!title.trim() || isPending}
                data-testid="button-create-set"
              >
                {isPending ? "Creating..." : "Create Set"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
