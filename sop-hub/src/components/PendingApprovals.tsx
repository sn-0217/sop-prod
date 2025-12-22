import { useState, useEffect } from 'react';
import { PendingOperation } from '@/types/sop';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, XCircle, Upload, Edit, Trash, Loader2, Clock } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/formatters';
import { ApprovalDialog } from './ApprovalDialog';
import { approvalApi, API_BASE_URL } from '@/services/sopApi';
import { toast } from 'sonner';

interface PendingApprovalsProps {
    onApprovalSuccess: () => void;
}

export function PendingApprovals({ onApprovalSuccess }: PendingApprovalsProps) {
    const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<PendingOperation | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

    // PDF Preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewOperation, setPreviewOperation] = useState<PendingOperation | null>(null);
    const [pdfLoading, setPdfLoading] = useState(true);

    useEffect(() => {
        loadPendingOperations();
    }, []);

    const loadPendingOperations = async () => {
        try {
            const data = await approvalApi.getPendingOperations();
            setPendingOperations(data);
        } catch (error) {
            console.error('Error loading pending operations:', error);
            toast.error('Failed to load pending operations');
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (requestedAt: string) => {
        const requestedDate = new Date(requestedAt);
        const expiryDate = new Date(requestedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 0 ? daysRemaining : 0;
    };

    const handleApprovalClick = (operation: PendingOperation, action: 'approve' | 'reject', e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedOperation(operation);
        setApprovalAction(action);
        setApprovalDialogOpen(true);
    };

    const handleApprovalSuccess = () => {
        loadPendingOperations();
        onApprovalSuccess();
    };

    const handlePreviewClick = (operation: PendingOperation, e: React.MouseEvent) => {
        e.stopPropagation();
        // Only allow preview for CREATE and DELETE operations (which have file paths)
        if (operation.operationType === 'UPDATE') {
            toast.info('Preview is not available for update operations');
            return;
        }
        setPreviewOperation(operation);
        setPdfLoading(true);
        setPreviewOpen(true);
    };

    const getPreviewFileName = (operation: PendingOperation): string => {
        const data = parseProposedData(operation.proposedData);
        if (!data) return 'Document Preview';

        if (operation.operationType === 'UPLOAD') {
            return data.fileName || 'New document';
        } else if (operation.operationType === 'DELETE') {
            return data.snapshot?.fileName || 'Document';
        }
        return 'Document Preview';
    };

    const getOperationIcon = (type: string) => {
        switch (type) {
            case 'UPLOAD':
                return <Upload className="h-4 w-4 text-blue-600" />;
            case 'UPDATE':
                return <Edit className="h-4 w-4 text-orange-600" />;
            case 'DELETE':
                return <Trash className="h-4 w-4 text-red-600" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getOperationBadgeColor = (type: string) => {
        switch (type) {
            case 'UPLOAD':
                return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
            case 'UPDATE':
                return 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
            case 'DELETE':
                return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
            default:
                return '';
        }
    };

    const parseProposedData = (jsonString: string): any => {
        try {
            return JSON.parse(jsonString);
        } catch {
            return null;
        }
    };

    // Get just the document name for the Document Name column
    const getDocumentName = (operation: PendingOperation): string => {
        const data = parseProposedData(operation.proposedData);
        if (!data) return 'Unknown document';

        switch (operation.operationType) {
            case 'UPLOAD':
                return data.fileName || 'New document';
            case 'UPDATE':
                // For updates, try to get the original filename from changes or just show the SOP ID
                return data.originalFileName || `SOP Update`;
            case 'DELETE':
                return data.snapshot?.fileName || 'Document';
            default:
                return 'Unknown document';
        }
    };

    // Check if preview is available for the operation
    const canPreview = (operation: PendingOperation): boolean => {
        return operation.operationType !== 'UPDATE';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (pendingOperations.length === 0) {
        return null;
    }

    return (
        <>
            <div className="space-y-4">
                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="h-11 hover:bg-transparent border-b border-border/60">
                                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Operation</TableHead>
                                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Document Name</TableHead>
                                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Requested By</TableHead>
                                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Requested At</TableHead>
                                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Auto-Approval</TableHead>
                                <TableHead className="h-11 px-4 text-right text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingOperations.map((operation) => {
                                const daysRemaining = getDaysRemaining(operation.requestedAt);
                                return (
                                    <TableRow
                                        key={operation.id}
                                        className="group hover:bg-muted/40 transition-colors border-b border-border/40"
                                    >
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                    {getOperationIcon(operation.operationType)}
                                                </div>
                                                <Badge variant="outline" className={`font-normal ${getOperationBadgeColor(operation.operationType)}`}>
                                                    {operation.operationType}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 font-medium text-xs">
                                            {canPreview(operation) ? (
                                                <button
                                                    onClick={(e) => handlePreviewClick(operation, e)}
                                                    className="text-primary hover:text-primary/80 hover:underline cursor-pointer font-medium text-left"
                                                    title="Click to preview document"
                                                >
                                                    {getDocumentName(operation)}
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {getDocumentName(operation)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground py-3 text-xs">
                                            {operation.requestedBy || <span className="text-muted-foreground/50">—</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground py-3 text-xs">
                                            {formatDate(operation.requestedAt)}
                                        </TableCell>
                                        <TableCell className="py-3 text-xs">
                                            {daysRemaining > 0 ? (
                                                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                                                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-green-600">
                                                    Auto-approved
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-3 text-xs">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => handleApprovalClick(operation, 'approve', e)}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 px-3"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={(e) => handleApprovalClick(operation, 'reject', e)}
                                                    className="gap-1 h-8 px-3"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Approval Authentication Dialog */}
            {selectedOperation && (
                <ApprovalDialog
                    open={approvalDialogOpen}
                    onClose={() => {
                        setApprovalDialogOpen(false);
                        setSelectedOperation(null);
                    }}
                    operationId={selectedOperation.id}
                    action={approvalAction}
                    onSuccess={handleApprovalSuccess}
                />
            )}

            {/* PDF Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={() => {
                setPreviewOpen(false);
                setPreviewOperation(null);
            }}>
                <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-lg">
                                    {previewOperation ? getPreviewFileName(previewOperation) : 'Document Preview'}
                                </DialogTitle>
                                {previewOperation && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        Pending Approval
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* PDF Viewer */}
                    <div className="flex-1 overflow-hidden bg-muted/20 relative">
                        {pdfLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                                </div>
                            </div>
                        )}
                        {previewOperation && (
                            <iframe
                                src={`${API_BASE_URL}/approvals/${previewOperation.id}/view/${encodeURIComponent(getPreviewFileName(previewOperation))}`}
                                className="w-full h-full border-0"
                                title={getPreviewFileName(previewOperation)}
                                onLoad={() => setPdfLoading(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
