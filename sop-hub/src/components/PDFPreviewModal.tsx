import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileX, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { SOPFile } from '@/types/sop';
import { API_BASE_URL } from '@/services/sopApi';

interface PDFPreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onDownload: () => void;
}

export function PDFPreviewModal({ open, onClose, file, onDownload }: PDFPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const isPending = file?.status === 'PENDING_APPROVAL';

  const handleClose = () => {
    setCurrentPage(1);
    setZoom(100);
    setLoading(true);
    setError(null);
    setShowDetails(false);
    onClose();
  };

  // Use the actual file URL from the backend
  const pdfUrl = file
    ? `${API_BASE_URL}/sops/view/${file.id}/${encodeURIComponent(file.fileName)}`
    : '';

  const iframeUrl = `${pdfUrl}#page=${currentPage}&zoom=${zoom}`;

  const loadPreview = async () => {
    if (!open || !pdfUrl) return;

    setLoading(true);
    setError(null);
    setShowDetails(false);

    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) {
        const text = await res.text();
        setError(text || `Error ${res.status}: Failed to load file`);
        setLoading(false);
      } else {
        // success, let iframe load
      }
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  // Check if file exists before loading iframe
  useEffect(() => {
    loadPreview();
  }, [open, pdfUrl]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(200, prev + 25));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 25));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{file?.fileName}</DialogTitle>
              {file?.version && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-md border border-primary/20">
                  {file.version}
                </span>
              )}
              {isPending && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-muted/20 relative">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/10 p-6">
              <div className="flex flex-col items-center gap-6 text-center max-w-lg w-full bg-background p-8 rounded-xl border shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 mb-2 ring-8 ring-red-50 dark:ring-red-900/10">
                  <FileX className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">Preview Unavailable</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                    We couldn't locate the document file on the server. It may have been moved, deleted, or never uploaded correctly.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full justify-center pt-2">
                  <Button variant="outline" onClick={handleClose} className="min-w-[100px]">
                    Close
                  </Button>
                  <Button onClick={loadPreview} className="min-w-[100px] gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                </div>

                <div className="w-full pt-4 border-t mt-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    {showDetails ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {showDetails ? 'Hide Technical Details' : 'View Technical Details'}
                  </button>

                  {showDetails && (
                    <div className="mt-4 w-full bg-muted/50 rounded-lg p-3 text-left border overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Server Response</p>
                      <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-all bg-background p-2 rounded border max-h-[100px] overflow-y-auto">
                        {error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title={file?.fileName || 'PDF Preview'}
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
