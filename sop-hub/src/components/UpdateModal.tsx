import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDropzone } from './FileDropzone';
import { SOPFile } from '@/types/sop';
import { FileText, X, ArrowRight, AlertCircle } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onUpdate: (metadata: { fileCategory: string; brand: string; uploadedBy: string; versionUpdateType: 'MAJOR' | 'MINOR' }, file?: File) => void;
  updating: boolean;
}

export function UpdateModal({ open, onClose, file, onUpdate, updating }: UpdateModalProps) {
  const [fileCategory, setFileCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [updateType, setUpdateType] = useState<'MAJOR' | 'MINOR'>('MINOR');

  useEffect(() => {
    if (file && open) {
      setFileCategory(file.fileCategory || '');
      setBrand(file.brand || '');
      setUploadedBy(file.uploadedBy || '');
      setFiles([]);
      setUpdateType('MINOR');
    }
  }, [file, open]);

  const handleUpdate = () => {
    onUpdate({
      fileCategory,
      brand,
      uploadedBy,
      versionUpdateType: updateType,
    }, files.length > 0 ? files[0] : undefined);
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const getNextVersion = (current: string | undefined, type: 'MAJOR' | 'MINOR') => {
    if (!current) return 'v1.0';

    try {
      const clean = current.toLowerCase().replace('v', '');
      let major = 1;
      let minor = 0;

      if (clean.includes('.')) {
        const parts = clean.split('.');
        major = parseInt(parts[0]);
        minor = parseInt(parts[1]);
      } else {
        major = parseInt(clean);
        minor = 0;
      }

      if (type === 'MAJOR') {
        major++;
        minor = 0;
      } else {
        minor++;
      }

      return `v${major}.${minor}`;
    } catch (e) {
      return 'v1.0';
    }
  };

  const currentVersion = file?.version || 'v1.0'; // Treat legacy v1 as v1.0 visually
  const nextVersion = getNextVersion(file?.version, updateType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-xl font-semibold">Update Details</DialogTitle>
          <DialogDescription className="mt-1">
            Update metadata for <span className="font-medium text-foreground">{file?.fileName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Version Update Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Update Type</Label>
              <div className="bg-muted/30 p-1 rounded-lg border border-border flex gap-1">
                <button
                  onClick={() => setUpdateType('MINOR')}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex flex-col items-center gap-0.5",
                    updateType === 'MINOR'
                      ? "bg-background text-primary shadow-sm border border-border/50"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span>Minor Update</span>
                  <span className="text-[10px] opacity-70 font-normal">Small tweaks, fixes</span>
                </button>
                <button
                  onClick={() => setUpdateType('MAJOR')}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex flex-col items-center gap-0.5",
                    updateType === 'MAJOR'
                      ? "bg-background text-primary shadow-sm border border-border/50"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span>Major Update</span>
                  <span className="text-[10px] opacity-70 font-normal">Content changes, overhaul</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm bg-primary/5 text-primary px-3 py-2 rounded-md border border-primary/10">
                <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-primary/20 text-muted-foreground line-through opacity-70">
                  {currentVersion}
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                <span className="font-mono text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold shadow-sm">
                  {nextVersion}
                </span>
                <span className="ml-auto text-xs opacity-70">
                  {updateType === 'MAJOR' ? 'Major version increment' : 'Minor version increment'}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Input
                id="category"
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value)}
                placeholder="e.g., Development, HR, Finance"
                disabled={updating}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="uploadedBy" className="text-sm font-medium">Uploaded By</Label>
              <Input
                id="uploadedBy"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="Enter uploader name"
                disabled={updating}
                className="h-10"
              />
            </div>
          </div>

          <div className="h-full flex flex-col">
            <Label className="text-sm font-medium mb-2">Replace Document</Label>
            <div className="flex-1 flex flex-col">
              {files.length > 0 ? (
                <div className="flex-1 border-2 border-primary/20 bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center gap-3 relative animate-in fade-in zoom-in-95 duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiles([])}
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="w-12 h-12 rounded-xl bg-background border shadow-sm flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="font-medium text-foreground text-sm truncate max-w-[200px]" title={files[0].name}>
                      {files[0].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(files[0].size)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-primary font-medium bg-background px-2 py-1 rounded-full border border-primary/20 shadow-sm mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Ready to replace
                  </div>
                </div>
              ) : (
                <FileDropzone
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={1}
                  disabled={updating}
                  showList={false}
                  className="h-full min-h-[250px]"
                />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={updating} className="h-10 px-4">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={
              updating ||
              !fileCategory ||
              !uploadedBy ||
              (fileCategory === (file?.fileCategory || '') &&
                uploadedBy === (file?.uploadedBy || '') &&
                files.length === 0)
            }
            className="h-10 px-6 min-w-[100px]"
          >
            {updating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
