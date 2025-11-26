export type Brand = 'knitwell' | 'chicos' | 'talbots';
export type BrandFilter = Brand | 'home';

export interface SOPFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileCategory: string;
  brand: Brand;
  uploadedBy: string;
  createdAt: string;
  modifiedAt: string;
}
