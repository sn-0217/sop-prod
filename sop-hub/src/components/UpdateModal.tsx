import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDropzone } from './FileDropzone';
import { SOPFile } from '@/types/sop';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onUpdate: (metadata: { fileCategory: string; brand: string; uploadedBy: string }, file?: File) => void;
  updating: boolean;
}

export function UpdateModal({ open, onClose, file, onUpdate, updating }: UpdateModalProps) {
  const [fileCategory, setFileCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (file && open) {
      setFileCategory(file.fileCategory || '');
      setBrand(file.brand || '');
      setUploadedBy(file.uploadedBy || '');
      setFiles([]);
    }
  }, [file, open]);

  const handleUpdate = () => {
    onUpdate({
      fileCategory,
      brand,
      uploadedBy,
    }, files.length > 0 ? files[0] : undefined);
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

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
            <Label className="text-sm font-medium mb-2">Replace Document (Optional)</Label>
            <div className="flex-1">
              <FileDropzone
                files={files}
                onFilesChange={setFiles}
                maxFiles={1}
                disabled={updating}
                className="h-full min-h-[250px]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={updating} className="h-10 px-4">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating || !fileCategory || !uploadedBy}
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
