import { useState, useEffect } from 'react';
import { Brand, BrandFilter, SOPFile } from '@/types/sop';
import { BrandSidebar } from '@/components/BrandSidebar';
import { SOPTable } from '@/components/SOPTable';
import { StatisticsBar } from '@/components/StatisticsBar';
import { UploadModal } from '@/components/UploadModal';
import { UpdateModal } from '@/components/UpdateModal';
import { DeleteDialog } from '@/components/DeleteDialog';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sopApi } from '@/services/sopApi';
import { Upload, FileText, Search } from 'lucide-react';
import { API_BASE_URL } from '@/services/sopApi';

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('home');
  const [files, setFiles] = useState<SOPFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SOPFile | null>(null);

  // Load files for selected brand
  useEffect(() => {
    loadFiles();
  }, [selectedBrand]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // If home is selected, we fetch all files (API returns all by default)
      // If a specific brand is selected, we filter on the client side
      // Note: sopApi.getSOPs takes a brand, but we can pass 'home' or modify api to accept optional brand
      // Since backend returns all, we just need to filter if brand != home

      // We need to cast selectedBrand to Brand if it's not home, but getSOPs expects Brand.
      // Actually, getSOPs sends ?brand=... which backend ignores.
      // So we can just call it with any string or update getSOPs.
      // Let's just pass 'knitwell' as dummy if home, or update getSOPs signature.
      // Better: update getSOPs to accept string or optional brand.
      // For now, I'll cast it, knowing backend ignores it.
      const data = await sopApi.getSOPs(selectedBrand === 'home' ? 'knitwell' : selectedBrand);

      let filteredData = data;
      if (selectedBrand !== 'home') {
        filteredData = data.filter(file => file.brand === selectedBrand);
      }
      setFiles(filteredData);
    } catch (error) {
      toast.error('Failed to load SOPs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[], brand: Brand, metadata: { fileCategory: string; uploadedBy: string }) => {
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process uploads sequentially or concurrently. Using Promise.allSettled for concurrency.
      const results = await Promise.allSettled(
        files.map(file => sopApi.uploadSOP(file, brand, metadata))
      );

      const errors: string[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
          errors.push(result.reason?.message || 'Unknown error');
        }
      });

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        // Show the first error message, or a summary if multiple
        const errorMsg = errors.length === 1 ? errors[0] : `Failed to upload ${failCount} files`;
        toast.error(errorMsg);
        if (errors.length > 1) {
          console.error('Upload errors:', errors);
        }
      }

      setUploadModalOpen(false);
      loadFiles();
    } catch (error) {
      toast.error('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (file: SOPFile) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
  };

  const handleDownload = (file: SOPFile) => {
    // Use the download endpoint which sets Content-Disposition: attachment
    const url = `${API_BASE_URL}/sops/download/${file.id}/${encodeURIComponent(file.fileName)}`;
    window.open(url, '_blank');
  };

  const handleUpdate = async (metadata: { fileCategory: string; brand: string; uploadedBy: string }, file?: File) => {
    if (!selectedFile) return;

    setUpdating(true);
    try {
      await sopApi.updateSOP(selectedFile.id, metadata, file);
      toast.success('SOP updated successfully');
      setUpdateModalOpen(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      toast.error('Failed to update SOP');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    setDeleting(true);
    try {
      await sopApi.deleteSOP(selectedFile.id);
      toast.success('SOP deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete SOP');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand Selector */}
      <BrandSidebar selectedBrand={selectedBrand} onSelectBrand={setSelectedBrand} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-[95%] mx-auto px-8 py-6">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    SOP Management
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="capitalize font-medium text-foreground">
                      {selectedBrand === 'home' ? 'All Brands' : selectedBrand}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-background border-border shadow-sm"
                  />
                </div>
                <Button
                  onClick={() => setUploadModalOpen(true)}
                  className="gap-2 shrink-0 h-10 px-4 shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-background">
          <div className="max-w-[95%] mx-auto px-8 py-8">
            {/* Statistics Bar */}
            <StatisticsBar files={files} />

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
              </div>
            ) : files.filter(file =>
              file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No documents found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload your first SOP document to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </div>
            ) : (
              <SOPTable
                files={files.filter(file =>
                  file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                loading={loading}
                showBrandColumn={selectedBrand === 'home'}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onUpdate={(file) => {
                  setSelectedFile(file);
                  setUpdateModalOpen(true);
                }}
                onDelete={(file) => {
                  setSelectedFile(file);
                  setDeleteDialogOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <PDFPreviewModal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onDownload={() => selectedFile && handleDownload(selectedFile)}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        selectedBrand={selectedBrand}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <UpdateModal
        open={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onUpdate={handleUpdate}
        updating={updating}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
};

export default Index;
