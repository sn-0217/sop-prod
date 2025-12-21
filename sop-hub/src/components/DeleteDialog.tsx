import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOPFile, Approver } from '@/types/sop';
import { Trash2, AlertTriangle, ChevronLeft, ChevronRight, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = 'http://localhost:8080/api';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  file: SOPFile | null;
  onConfirm: (requestedBy: string, comments: string, assignedApproverId?: string) => void;
  deleting: boolean;
}

const steps = [
  { id: 1, title: 'Confirm', icon: AlertTriangle },
  { id: 2, title: 'Details', icon: FileText },
  { id: 3, title: 'Submit', icon: Check },
];

export function DeleteDialog({ open, onClose, file, onConfirm, deleting }: DeleteDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  // Load approvers when dialog opens
  useEffect(() => {
    if (open) {
      fetchApprovers();
      setCurrentStep(1);
      setSelectedApproverId('');
      setRequestedBy('');
      setComments('');
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

  const handleConfirm = () => {
    onConfirm(requestedBy, comments, selectedApproverId || undefined);
  };

  const handleClose = () => {
    if (!deleting) {
      setCurrentStep(1);
      onClose();
    }
  };

  const canProceedToStep2 = true; // Just need to acknowledge
  const canProceedToStep3 = requestedBy.trim() && comments.trim();
  const canSubmit = canProceedToStep3;

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border bg-destructive/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete Document</DialogTitle>
              <DialogDescription className="text-sm">
                Request deletion of <span className="font-medium text-foreground">{file?.fileName}</span>
              </DialogDescription>
            </div>
          </div>
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
                    else if (step.id === 3 && canProceedToStep3) setCurrentStep(3);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm",
                    currentStep === step.id
                      ? "bg-destructive text-destructive-foreground"
                      : currentStep > step.id
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    "hover:opacity-80"
                  )}
                  disabled={deleting}
                >
                  <step.icon className="w-3.5 h-3.5" />
                  <span className="font-medium hidden sm:inline">{step.title}</span>
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
          {/* Step 1: Confirm Intent */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-lg font-medium">Confirm Deletion Request</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  You are about to request deletion of this document. This action requires approval before the document is permanently removed.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border text-left">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file?.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="capitalize">{file?.brand}</span>
                      <span>•</span>
                      <span>{file?.fileCategory}</span>
                      <span>•</span>
                      <span>{file?.version}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ Once approved, this document will be permanently deleted and cannot be recovered.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Provide Details */}
          {currentStep === 2 && (
            <div className="space-y-5 max-w-sm mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Deletion Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide information for the approval request
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedBy" className="text-sm font-medium">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="requestedBy"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="Enter your name"
                  disabled={deleting}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver" className="text-sm font-medium">Assign Approver</Label>
                <Select value={selectedApproverId} onValueChange={setSelectedApproverId} disabled={deleting}>
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
                  Reason for Deletion <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Why should this document be deleted?"
                  disabled={deleting}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-5 max-w-sm mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Review & Submit</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verify information before submitting
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Document</h4>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file?.fileName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{file?.brand} • {file?.fileCategory}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested By:</span>
                    <span className="font-medium">{requestedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approver:</span>
                    <span className="font-medium">
                      {approvers.find(a => a.id === selectedApproverId)?.name || 'Auto-assign'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">Reason</h4>
                <p className="text-sm">{comments}</p>
              </div>

              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">
                  🗑️ This deletion request will be sent for approval.
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
            disabled={deleting}
            className="h-9"
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
              disabled={deleting || (currentStep === 2 && !canProceedToStep3)}
              variant={currentStep === 1 ? "destructive" : "default"}
              className="h-9"
            >
              {currentStep === 1 ? 'Continue' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit || deleting}
              variant="destructive"
              className="h-9 min-w-[120px]"
            >
              {deleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Requesting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
