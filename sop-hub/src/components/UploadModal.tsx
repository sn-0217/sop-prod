import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDropzone, FileList as SelectedFileList } from './FileDropzone';
import { Brand, BrandFilter, Approver } from '@/types/sop';
import { cn } from '@/lib/utils';

const API_BASE = 'http://localhost:8080/api';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  selectedBrand: BrandFilter;
  onUpload: (files: File[], brand: Brand, metadata: { fileCategory: string; uploadedBy: string; assignedApproverId?: string }) => void;
  uploading: boolean;
}

const brands: { value: Brand; label: string }[] = [
  { value: 'knitwell', label: 'Knitwell' },
  { value: 'chicos', label: "Chico's" },
  { value: 'talbots', label: 'Talbots' },
];

export function UploadModal({ open, onClose, selectedBrand, onUpload, uploading }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [brand, setBrand] = useState<Brand>('knitwell');
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');

  // Load approvers when modal opens
  useEffect(() => {
    if (open) {
      fetchApprovers();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setFileCategory('');
      setUploadedBy('');
      setSelectedApproverId('');
    } else {
      // Initialize brand based on selectedBrand prop
      if (selectedBrand !== 'home') {
        setBrand(selectedBrand);
      } else {
        // Default to knitwell if on home page
        setBrand('knitwell');
      }
    }
  }, [open, selectedBrand]);

  const fetchApprovers = async () => {
    try {
      const response = await fetch(`${API_BASE}/approvers`);
      if (!response.ok) throw new Error('Failed to fetch approvers');
      const data = await response.json();
      setApprovers(data);
      // Auto-select primary approver if available
      const primaryApprover = data.find((a: Approver) => a.isPrimary);
      if (primaryApprover) {
        setSelectedApproverId(primaryApprover.id);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files, brand, { fileCategory, uploadedBy, assignedApproverId: selectedApproverId });
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setFileCategory('');
      setUploadedBy('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-8 py-6 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-2xl font-semibold">Upload Documents</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Follow the steps below to add new SOP documents to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Section 1: Document Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</div>
              <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Document Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                <div className="flex flex-col gap-2">
                  {brands.map((b) => (
                    <Button
                      key={b.value}
                      type="button"
                      variant={brand === b.value ? 'default' : 'outline'}
                      onClick={() => setBrand(b.value)}
                      disabled={uploading || selectedBrand !== 'home'}
                      className={cn(
                        "justify-start",
                        brand === b.value && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileCategory" className="text-sm font-medium">Category</Label>
                <Input
                  id="fileCategory"
                  placeholder="e.g., Development, HR"
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  disabled={uploading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uploadedBy" className="text-sm font-medium">Uploaded By</Label>
                <Input
                  id="uploadedBy"
                  placeholder="Enter your name"
                  value={uploadedBy}
                  onChange={(e) => setUploadedBy(e.target.value)}
                  disabled={uploading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver" className="text-sm font-medium">Assign Approver</Label>
                <Select value={selectedApproverId} onValueChange={setSelectedApproverId} disabled={uploading}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select an approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvers.map((approver) => (
                      <SelectItem key={approver.id} value={approver.id}>
                        {approver.name} {approver.isPrimary && '(Primary)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Section 2: Upload Area */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</div>
              <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Upload Files</h3>
            </div>

            <div className="h-[200px]">
              <FileDropzone
                files={files}
                onFilesChange={setFiles}
                maxFiles={100}
                disabled={uploading}
                className="h-full"
                showList={false}
              />
            </div>
          </section>

          {/* Section 3: Selected Files */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</div>
              <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Selected Documents</h3>
            </div>

            <div className="min-h-[200px] bg-muted/10 rounded-lg border border-border/50 p-4">
              <SelectedFileList
                files={files}
                onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
                disabled={uploading}
              />
              {files.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-12">
                  <p>No files selected yet</p>
                  <p className="text-xs mt-1">Files you upload will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="px-8 py-6 bg-muted/30 border-t border-border flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={uploading} className="h-11 px-6">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || !fileCategory || !uploadedBy || !brand || !selectedApproverId || uploading}
            className="h-11 px-8 min-w-[120px]"
          >
            {uploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              'Upload Documents'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
