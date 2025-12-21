import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDropzone } from './FileDropzone';
import { SOPFile, Approver } from '@/types/sop';
import { FileText, X, ArrowRight, AlertCircle, ChevronLeft, ChevronRight, Check, Settings, Upload, Eye } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const API_BASE = 'http://localhost:8080/api';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onUpdate: (metadata: { fileCategory: string; brand: string; uploadedBy: string; versionUpdateType: 'MAJOR' | 'MINOR'; assignedApproverId?: string; comments: string }, file?: File) => void;
  updating: boolean;
}

const steps = [
  { id: 1, title: 'Update Details', icon: Settings },
  { id: 2, title: 'Replace File', icon: Upload },
  { id: 3, title: 'Review', icon: Eye },
];

export function UpdateModal({ open, onClose, file, onUpdate, updating }: UpdateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileCategory, setFileCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [updateType, setUpdateType] = useState<'MAJOR' | 'MINOR'>('MINOR');
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [comments, setComments] = useState('');

  // Load approvers when modal opens
  useEffect(() => {
    if (open) {
      fetchApprovers();
    }
  }, [open]);

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

  useEffect(() => {
    if (file && open) {
      setCurrentStep(1);
      setFileCategory(file.fileCategory || '');
      setBrand(file.brand || '');
      setUploadedBy(file.uploadedBy || '');
      setFiles([]);
      setUpdateType('MINOR');
      setSelectedApproverId('');
      setComments('');
    }
  }, [file, open]);

  const handleUpdate = () => {
    if (!comments.trim()) return;
    onUpdate({
      fileCategory,
      brand,
      uploadedBy,
      versionUpdateType: updateType,
      assignedApproverId: selectedApproverId || undefined,
      comments,
    }, files.length > 0 ? files[0] : undefined);
  };

  const handleClose = () => {
    if (!updating) {
      setCurrentStep(1);
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
        if (minor === 9) {
          major++;
          minor = 0;
        } else {
          minor++;
        }
      }
      return `v${major}.${minor}`;
    } catch (e) {
      return 'v1.0';
    }
  };

  const currentVersion = file?.version || 'v1.0';
  const nextVersion = getNextVersion(file?.version, updateType);

  const canProceedToStep2 = fileCategory.trim() && uploadedBy.trim() && comments.trim();
  const canProceedToStep3 = true; // File replacement is optional
  const hasChanges = fileCategory !== (file?.fileCategory || '') ||
    uploadedBy !== (file?.uploadedBy || '') ||
    files.length > 0;
  const canSubmit = canProceedToStep2 && hasChanges;

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
          <DialogTitle className="text-xl font-semibold">Update Document</DialogTitle>
          <DialogDescription className="mt-1">
            Updating <span className="font-medium text-foreground">{file?.fileName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="px-6 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (step.id === 1) setCurrentStep(1);
                    else if (step.id === 2 && canProceedToStep2) setCurrentStep(2);
                    else if (step.id === 3 && canProceedToStep2) setCurrentStep(3);
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
                  disabled={updating}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
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
          {/* Step 1: Update Details */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-md mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Update Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Modify metadata and provide update reason
                </p>
              </div>

              {/* Version Update Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Update Type</Label>
                <div className="bg-muted/30 p-1 rounded-lg border border-border flex gap-1">
                  <button
                    onClick={() => setUpdateType('MINOR')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex flex-col items-center gap-0.5",
                      updateType === 'MINOR'
                        ? "bg-background text-primary shadow-sm border border-border/50"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>Minor</span>
                    <span className="text-[10px] opacity-70 font-normal">Small fixes</span>
                  </button>
                  <button
                    onClick={() => setUpdateType('MAJOR')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex flex-col items-center gap-0.5",
                      updateType === 'MAJOR'
                        ? "bg-background text-primary shadow-sm border border-border/50"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>Major</span>
                    <span className="text-[10px] opacity-70 font-normal">Content changes</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm bg-primary/5 text-primary px-3 py-2 rounded-md border border-primary/10">
                  <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border text-muted-foreground line-through opacity-70">
                    {currentVersion}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                  <span className="font-mono text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold">
                    {nextVersion}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category"
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    placeholder="e.g., Development"
                    disabled={updating}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uploadedBy" className="text-sm font-medium">
                    Your Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="uploadedBy"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    placeholder="Enter name"
                    disabled={updating}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver" className="text-sm font-medium">Assign Approver</Label>
                <Select value={selectedApproverId} onValueChange={setSelectedApproverId} disabled={updating}>
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

              <div className="space-y-2">
                <Label htmlFor="comments" className="text-sm font-medium">
                  Comments <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Reason for this update..."
                  disabled={updating}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Replace File (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Replace Document File</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Upload a new file to replace the existing one
                </p>
              </div>

              <div className="h-[250px]">
                {files.length > 0 ? (
                  <div className="h-full border-2 border-primary/20 bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center gap-3 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFiles([])}
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="w-14 h-14 rounded-xl bg-background border shadow-sm flex items-center justify-center">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>

                    <div className="text-center space-y-1">
                      <p className="font-medium text-foreground text-sm truncate max-w-[250px]" title={files[0].name}>
                        {files[0].name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(files[0].size)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-primary font-medium bg-background px-3 py-1.5 rounded-full border border-primary/20">
                      <Check className="h-3 w-3" />
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
                    className="h-full"
                  />
                )}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  💡 This step is optional. Skip if you only want to update metadata.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-5 max-w-md mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Review Changes</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verify the changes before submitting
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Version Change</h4>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded border text-muted-foreground">
                    {currentVersion}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm bg-primary text-primary-foreground px-2 py-1 rounded font-semibold">
                    {nextVersion}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">({updateType})</span>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{fileCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated By:</span>
                    <span className="font-medium">{uploadedBy}</span>
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">New File</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{files[0].name}</span>
                    <span className="text-muted-foreground">({formatBytes(files[0].size)})</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">Comments</h4>
                <p className="text-sm">{comments}</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  📋 This update will be submitted for approval.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : prevStep}
            disabled={updating}
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
              disabled={updating || (currentStep === 1 && !canProceedToStep2)}
              className="h-10"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleUpdate}
              disabled={!canSubmit || updating}
              className="h-10 min-w-[100px]"
            >
              {updating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
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
