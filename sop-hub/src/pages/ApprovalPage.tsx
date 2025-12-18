import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SOPFile } from '@/types/sop';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Eye, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:8080/api';

export function ApprovalPage() {
    const { sopId } = useParams<{ sopId: string }>();
    const navigate = useNavigate();

    const [sop, setSop] = useState<SOPFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [approverUsername, setApproverUsername] = useState('');
    const [approverPassword, setApproverPassword] = useState('');
    const [comments, setComments] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        if (sopId) {
            loadSOP(sopId);
        }
    }, [sopId]);

    const loadSOP = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE}/sops/${id}`);
            if (!response.ok) throw new Error('Failed to load SOP');
            const data = await response.json();
            setSop(data);
        } catch (error) {
            console.error('Error loading SOP:', error);
            toast.error('Failed to load SOP details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType: 'approve' | 'reject') => {
        if (!approverUsername || !approverPassword) {
            toast.error('Please enter your approver credentials');
            return;
        }

        if (actionType === 'reject' && !comments.trim()) {
            toast.error('Comments are required for rejection');
            return;
        }

        setAction(actionType);
        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/sops/${sopId}/${actionType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approverUsername,
                    approverPassword,
                    comments: comments.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `Failed to ${actionType} SOP`);
            }

            toast.success(`SOP ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
            setTimeout(() => navigate('/'), 2000);
        } catch (error: any) {
            console.error(`Error ${actionType}ing SOP:`, error);
            toast.error(error.message || `Failed to ${actionType} SOP`);
        } finally {
            setSubmitting(false);
            setAction(null);
        }
    };

    const getDaysRemaining = () => {
        if (!sop?.pendingAt) return null;
        const pendingDate = new Date(sop.pendingAt);
        const expiryDate = new Date(pendingDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!sop) {
        return (
            <div className="container mx-auto p-6">
                <Alert>
                    <AlertDescription>SOP not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-7xl">
                {/* Header */}
                <div className="mb-6 space-y-4">
                    <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 -ml-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    SOP Review
                                </h1>
                            </div>
                            <p className="text-muted-foreground">
                                Review the document and provide your approval decision
                            </p>
                        </div>
                        <Badge
                            variant={sop.status === 'APPROVED' ? 'default' : sop.status === 'REJECTED' ? 'destructive' : 'secondary'}
                            className="text-sm px-3 py-1"
                        >
                            {sop.status?.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PDF Preview */}
                    <Card className="lg:col-span-2 border-border">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-semibold">Document Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/30" style={{ height: '700px' }}>
                                <iframe
                                    src={`${API_BASE}/sops/view/${sop.id}`}
                                    className="w-full h-full"
                                    title="PDF Preview"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approval Form */}
                    <div className="space-y-4">
                        {/* SOP Details */}
                        <Card className="border-border">
                            <CardHeader className="border-b pb-3">
                                <CardTitle className="text-base">Document Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Title</Label>
                                        <p className="font-medium text-sm mt-1">{sop.fileName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Brand</Label>
                                            <Badge variant="outline" className="mt-1 capitalize">{sop.brand}</Badge>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                                            <Badge variant="secondary" className="mt-1">{sop.fileCategory}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Uploaded By</Label>
                                        <p className="font-medium text-sm mt-1">{sop.uploadedBy}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Upload Date</Label>
                                        <p className="font-medium text-sm mt-1">{new Date(sop.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Auto-Approval Warning */}
                        {daysRemaining !== null && daysRemaining > 0 && (
                            <Alert>
                                <Clock className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Auto-approval in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>
                                    <p className="text-xs mt-1">This SOP will be automatically approved if no action is taken.</p>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Approval Form */}
                        {sop.status === 'PENDING_APPROVAL' && (
                            <Card className="border-border">
                                <CardHeader className="border-b pb-3">
                                    <CardTitle className="text-base">Approver Authentication</CardTitle>
                                    <CardDescription className="text-xs">Enter your credentials to take action</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
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
                                            <span className="text-xs text-muted-foreground ml-2">(Optional for approval, required for rejection)</span>
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

                                    <div className="flex flex-col gap-3 pt-2">
                                        <Button
                                            onClick={() => handleAction('approve')}
                                            disabled={submitting}
                                            size="lg"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
                                        >
                                            {submitting && action === 'approve' ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Approving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Approve SOP
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={() => handleAction('reject')}
                                            disabled={submitting}
                                            variant="destructive"
                                            size="lg"
                                            className="w-full font-medium shadow-sm"
                                        >
                                            {submitting && action === 'reject' ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Rejecting...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Reject SOP
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Already Approved/Rejected */}
                        {sop.status === 'APPROVED' && (
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    This SOP has been approved on {sop.approvedAt && new Date(sop.approvedAt).toLocaleString()}
                                </AlertDescription>
                            </Alert>
                        )}

                        {sop.status === 'REJECTED' && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <p>This SOP was rejected on {sop.rejectedAt && new Date(sop.rejectedAt).toLocaleString()}</p>
                                    {sop.rejectionComments && (
                                        <p className="mt-2 text-sm"><strong>Reason:</strong> {sop.rejectionComments}</p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
