import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const isPending = file?.status === 'PENDING_APPROVAL';

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
  const pdfUrl = file
    ? `${API_BASE_URL}/sops/view/${file.id}/${encodeURIComponent(file.fileName)}`
    : '';

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
