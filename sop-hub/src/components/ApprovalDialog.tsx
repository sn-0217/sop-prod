import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { approvalApi } from '@/services/sopApi';

interface ApprovalDialogProps {
    open: boolean;
    onClose: () => void;
    operationId: string;
    action: 'approve' | 'reject';
    onSuccess: () => void;
}

export function ApprovalDialog({ open, onClose, operationId, action, onSuccess }: ApprovalDialogProps) {
    const [approverUsername, setApproverUsername] = useState('');
    const [approverPassword, setApproverPassword] = useState('');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!approverUsername || !approverPassword) {
            toast.error('Please enter your approver credentials');
            return;
        }

        if (action === 'reject' && !comments.trim()) {
            toast.error('Comments are required for rejection');
            return;
        }

        setSubmitting(true);

        try {
            if (action === 'approve') {
                await approvalApi.approveOperation(operationId, {
                    username: approverUsername,
                    password: approverPassword,
                    comments: comments.trim() || undefined,
                });
            } else {
                await approvalApi.rejectOperation(operationId, {
                    username: approverUsername,
                    password: approverPassword,
                    comments: comments.trim(),
                });
            }

            toast.success(`Operation ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
            setApproverUsername('');
            setApproverPassword('');
            setComments('');
            onClose();
            onSuccess();
        } catch (error: any) {
            console.error(`Error ${action}ing operation:`, error);
            toast.error(error.message || `Failed to ${action} operation`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {action === 'approve' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        {action === 'approve' ? 'Approve Operation' : 'Reject Operation'}
                    </DialogTitle>
                    <DialogDescription>
                        Enter your credentials to {action === 'approve' ? 'approve' : 'reject'} this operation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={approverUsername}
                            onChange={(e) => setApproverUsername(e.target.value)}
                            disabled={submitting}
                            className="h-10"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={approverPassword}
                            onChange={(e) => setApproverPassword(e.target.value)}
                            disabled={submitting}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comments" className="text-sm font-medium">
                            Comments
                            <span className="text-xs text-muted-foreground ml-2">
                                {action === 'reject' ? '(Required)' : '(Optional)'}
                            </span>
                        </Label>
                        <Textarea
                            id="comments"
                            placeholder="Add your comments here..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                            disabled={submitting}
                            className="resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                        variant={action === 'reject' ? 'destructive' : 'default'}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {action === 'approve' ? 'Approving...' : 'Rejecting...'}
                            </>
                        ) : (
                            <>
                                {action === 'approve' ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
