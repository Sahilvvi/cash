import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, Tag, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/useSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { data: results = [], isLoading } = useGlobalSearch(debouncedQuery);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleResultClick = useCallback((link: string) => {
    navigate(link);
    onOpenChange(false);
    setQuery("");
  }, [navigate, onOpenChange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search stores and deals</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores, deals, gift cards..."
            className="border-0 focus-visible:ring-0 h-14 text-base"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="p-2">
              {/* Stores Section */}
              {results.filter(r => r.type === 'store').length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Store className="w-3 h-3" />
                    Stores
                  </div>
                  {results.filter(r => r.type === 'store').map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.link)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {result.image ? (
                          <img 
                            src={result.image} 
                            alt={result.title}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(result.title.substring(0, 2))}&background=F37022&color=fff&size=40&bold=true`;
                            }}
                          />
                        ) : (
                          <Store className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      </div>
                      {result.cashback && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {result.cashback}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Deals Section */}
              {results.filter(r => r.type === 'deal').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Tag className="w-3 h-3" />
                    Deals & Coupons
                  </div>
                  {results.filter(r => r.type === 'deal').map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.link)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {result.image ? (
                          <img 
                            src={result.image} 
                            alt={result.title}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(result.subtitle.substring(0, 2))}&background=F37022&color=fff&size=40&bold=true`;
                            }}
                          />
                        ) : (
                          <Tag className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      </div>
                      {result.cashback && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {result.cashback}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Start typing to search...</p>
              <p className="text-xs mt-2 opacity-70">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">⌘K</kbd> to open search anytime
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;
