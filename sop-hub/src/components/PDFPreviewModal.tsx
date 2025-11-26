import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X, Loader2 } from 'lucide-react';
import { SOPFile } from '@/types/sop';

interface PDFPreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onDownload: () => void;
}

export function PDFPreviewModal({ open, onClose, file, onDownload }: PDFPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const handleClose = () => {
    setCurrentPage(1);
    setZoom(100);
    setLoading(true);
    onClose();
  };
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Use the actual file URL from the backend
  // Append filename to URL so browser displays it in title/tab
  const pdfUrl = file
    ? `http://localhost:8080/api/sops/view/${file.id}/${encodeURIComponent(file.fileName)}`
    : '';

  // Create iframe URL with zoom parameter
  // Note: #page and #zoom parameters work in Chrome/Edge default PDF viewer
  const iframeUrl = `${pdfUrl}#page=${currentPage}&zoom=${zoom}`;

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
            <DialogTitle className="text-lg">{file?.fileName}</DialogTitle>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-muted/20 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title={file?.fileName || 'PDF Preview'}
            onLoad={handleIframeLoad}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
