import { useState, useEffect } from 'react';
import { SOPFile } from '@/types/sop';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatBytes } from '@/lib/formatters';
import { ApprovalDialog } from './ApprovalDialog';

const API_BASE = 'http://localhost:8080/api';

interface PendingApprovalsProps {
    onPreview: (file: SOPFile) => void;
    onApprovalSuccess: () => void;
}

export function PendingApprovals({ onPreview, onApprovalSuccess }: PendingApprovalsProps) {
    const [pendingSOPs, setPendingSOPs] = useState<SOPFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [selectedSOP, setSelectedSOP] = useState<SOPFile | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

    useEffect(() => {
        loadPendingSOPs();
    }, []);

    const loadPendingSOPs = async () => {
        try {
            const response = await fetch(`${API_BASE}/sops/pending`);
            if (!response.ok) throw new Error('Failed to load pending SOPs');
            const data = await response.json();
            setPendingSOPs(data);
        } catch (error) {
            console.error('Error loading pending SOPs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const expiryDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 0 ? daysRemaining : 0;
    };

    const handleApprovalClick = (sop: SOPFile, action: 'approve' | 'reject', e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        setSelectedSOP(sop);
        setApprovalAction(action);
        setApprovalDialogOpen(true);
    };

    const handleApprovalSuccess = () => {
        loadPendingSOPs();
        onApprovalSuccess();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (pendingSOPs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No pending approvals</p>
                <p className="text-sm">All SOPs have been reviewed</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Pending Approvals</h2>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                        {pendingSOPs.length} Pending
                    </Badge>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold text-foreground">Document Name</TableHead>
                                <TableHead className="font-semibold text-foreground">Brand</TableHead>
                                <TableHead className="font-semibold text-foreground">Category</TableHead>
                                <TableHead className="font-semibold text-foreground">Uploaded By</TableHead>
                                <TableHead className="font-semibold text-foreground">Size</TableHead>
                                <TableHead className="font-semibold text-foreground">Uploaded At</TableHead>
                                <TableHead className="font-semibold text-foreground">Auto-Approval</TableHead>
                                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingSOPs.map((sop) => {
                                const daysRemaining = getDaysRemaining(sop.createdAt!);
                                return (
                                    <TableRow
                                        key={sop.id}
                                        className="hover:bg-muted/20 transition-colors"
                                    >
                                        <TableCell className="font-medium">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => onPreview(sop)}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-yellow-600" />
                                                </div>
                                                <span className="hover:underline">{sop.fileName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-normal">
                                                {sop.brand}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {sop.fileCategory ? (
                                                <Badge variant="secondary" className="font-normal">
                                                    {sop.fileCategory}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground/50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {sop.uploadedBy || <span className="text-muted-foreground/50">—</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium">
                                            {formatBytes(sop.fileSize)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(sop.createdAt!)}
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => handleApprovalClick(sop, 'approve', e)}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 px-3"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={(e) => handleApprovalClick(sop, 'reject', e)}
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
            {selectedSOP && (
                <ApprovalDialog
                    open={approvalDialogOpen}
                    onClose={() => {
                        setApprovalDialogOpen(false);
                        setSelectedSOP(null);
                    }}
                    sopId={selectedSOP.id}
                    action={approvalAction}
                    onSuccess={handleApprovalSuccess}
                />
            )}
        </>
    );
}
