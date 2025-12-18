export type Brand = 'knitwell' | 'chicos' | 'talbots';
export type BrandFilter = Brand | 'home';

export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface Approver {
  id: string;
  username: string;
  name: string;
  email: string;
  isPrimary: boolean;
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
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  assignedApproverId?: string;
}
