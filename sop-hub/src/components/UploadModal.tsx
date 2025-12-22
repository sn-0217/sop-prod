import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDropzone, FileList as SelectedFileList } from './FileDropzone';
import { Brand, BrandFilter, Approver } from '@/types/sop';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Upload, FileText, Settings } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  selectedBrand: BrandFilter;
  onUpload: (files: File[], brand: Brand, metadata: { fileCategory: string; uploadedBy: string; version: string; assignedApproverId?: string; comments: string }) => void;
  uploading: boolean;
}

const brands: { value: Brand; label: string }[] = [
  { value: 'knitwell', label: 'Knitwell' },
  { value: 'chicos', label: "Chico's" },
  { value: 'talbots', label: 'Talbots' },
];

const steps = [
  { id: 1, title: 'Select Files', icon: Upload },
  { id: 2, title: 'Document Details', icon: Settings },
  { id: 3, title: 'Review & Submit', icon: Check },
];

export function UploadModal({ open, onClose, selectedBrand, onUpload, uploading }: UploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [brand, setBrand] = useState<Brand>('knitwell');
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [comments, setComments] = useState('');

  // Load approvers when modal opens
  useEffect(() => {
    if (open) {
      fetchApprovers();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFiles([]);
      setFileCategory('');
      setUploadedBy('');
      setVersion('v1.0');
      setSelectedApproverId('');
      setComments('');
    } else {
      // Initialize brand based on selectedBrand prop
      if (selectedBrand !== 'home' && selectedBrand !== 'all') {
        setBrand(selectedBrand as Brand);
      } else {
        // Default to knitwell when on home or all tabs
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
      const primaryApprover = data.find((a: Approver) => a.isPrimary);
      if (primaryApprover) {
        setSelectedApproverId(primaryApprover.id);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const handleUpload = () => {
    if (files.length > 0 && comments.trim()) {
      onUpload(files, brand, { fileCategory, uploadedBy, version, assignedApproverId: selectedApproverId, comments });
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setFileCategory('');
      setUploadedBy('');
      setCurrentStep(1);
      onClose();
    }
  };

  const canProceedToStep2 = files.length > 0;
  const canProceedToStep3 = fileCategory.trim() && uploadedBy.trim() && comments.trim();
  const canSubmit = canProceedToStep2 && canProceedToStep3;

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-xl font-semibold">Upload Documents</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete the steps below to upload new SOP documents.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (step.id === 1) setCurrentStep(1);
                    else if (step.id === 2 && canProceedToStep2) setCurrentStep(2);
                    else if (step.id === 3 && canProceedToStep2 && canProceedToStep3) setCurrentStep(3);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    "hover:opacity-80"
                  )}
                  disabled={uploading}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  <span className="text-sm font-medium sm:hidden">{step.id}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2",
                    currentStep > step.id ? "bg-green-500" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Files */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">Select Files to Upload</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop PDF files or click to browse
                </p>
              </div>

              <div className="h-[250px]">
                <FileDropzone
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={100}
                  disabled={uploading}
                  className="h-full"
                  showList={false}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <SelectedFileList
                    files={files}
                    onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
                    disabled={uploading}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Document Details */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">Document Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide metadata for the uploaded documents
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {brands.map((b) => (
                      <Button
                        key={b.value}
                        type="button"
                        variant={brand === b.value ? 'default' : 'outline'}
                        onClick={() => setBrand(b.value)}
                        disabled={uploading || (selectedBrand !== 'home' && selectedBrand !== 'all')}
                        className="h-10"
                      >
                        {b.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileCategory" className="text-sm font-medium">
                      Category <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="version" className="text-sm font-medium">Version</Label>
                    <Input
                      id="version"
                      placeholder="e.g., v1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      disabled={uploading}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uploadedBy" className="text-sm font-medium">
                      Your Name <span className="text-destructive">*</span>
                    </Label>
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
                        <SelectValue placeholder="Auto-assign" />
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

                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-sm font-medium">
                    Comments <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Reason for uploading this document..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={uploading}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">Review & Submit</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verify the information before submitting
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Files</h4>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Brand:</span> <span className="font-medium capitalize">{brand}</span></div>
                    <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{fileCategory}</span></div>
                    <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">{version}</span></div>
                    <div><span className="text-muted-foreground">Uploaded By:</span> <span className="font-medium">{uploadedBy}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">Comments</h4>
                  <p className="text-sm">{comments}</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📋 This upload will be submitted for approval. You'll be notified once it's reviewed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : prevStep}
            disabled={uploading}
            className="h-10"
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={
                uploading ||
                (currentStep === 1 && !canProceedToStep2) ||
                (currentStep === 2 && !canProceedToStep3)
              }
              className="h-10"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!canSubmit || uploading}
              className="h-10 min-w-[120px]"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
