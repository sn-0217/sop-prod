export type Brand = 'knitwell' | 'chicos' | 'talbots';
export type BrandFilter = Brand | 'home' | 'all';

export type PendingOperationType = 'UPLOAD' | 'UPDATE' | 'DELETE';
export type PendingOperationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approver {
  id: string;
  username: string;
  name: string;
  email: string;
  isPrimary: boolean;
}

export interface PendingOperation {
  id: string;
  operationType: PendingOperationType;
  sopId: string | null;
  status: PendingOperationStatus;
  assignedApproverId: string | null;
  proposedData: string; // JSON string
  requestedBy: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  comments: string | null;
}

export interface SOPFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileCategory?: string;
  brand: string;
  uploadedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  version: string;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  pendingAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionComments?: string;
}
