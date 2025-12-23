import { useState, useEffect } from 'react';
import { Brand, BrandFilter, SOPFile } from '@/types/sop';
import { BrandSidebar } from '@/components/BrandSidebar';
import { SOPTable } from '@/components/SOPTable';
import { UploadModal } from '@/components/UploadModal';
import { UpdateModal } from '@/components/UpdateModal';
import { DeleteDialog } from '@/components/DeleteDialog';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sopApi, approvalApi } from '@/services/sopApi';
import { Upload, FileText, Search, FileSearch, X, Info } from 'lucide-react';
import { API_BASE_URL } from '@/services/sopApi';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScrollToTop } from '@/components/ScrollToTop';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import { AboutDialog } from '@/components/AboutDialog';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('home');
  const [files, setFiles] = useState<SOPFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'filename' | 'content'>('filename');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SOPFile | null>(null);

  // Track SOPs with pending deletion requests
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  // Load files for selected brand
  useEffect(() => {
    loadFiles();
    loadPendingDeletions();
  }, [selectedBrand]);

  // Load pending deletion IDs to disable delete buttons
  const loadPendingDeletions = async () => {
    try {
      const pendingOps = await approvalApi.getPendingOperations();
      const deleteIds = new Set<string>();
      pendingOps.forEach(op => {
        if (op.operationType === 'DELETE' && op.sopId) {
          deleteIds.add(op.sopId);
        }
      });
      setPendingDeleteIds(deleteIds);
    } catch (error) {
      console.error('Failed to load pending deletions:', error);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      if (selectedBrand === 'home') {
        // Home page shows dashboard, no files needed
        setFiles([]);
      } else if (selectedBrand === 'all') {
        // All tab: load all documents (API returns all when called with any brand)
        const data = await sopApi.getSOPs('knitwell');
        setFiles(data);
      } else {
        // Brand tab: load specific brand and filter
        const data = await sopApi.getSOPs(selectedBrand);
        setFiles(data.filter(file => file.brand === selectedBrand));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load SOPs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      loadFiles();
      return;
    }

    if (searchMode === 'content') {
      setSearching(true);
      try {
        const brand = (selectedBrand === 'home' || selectedBrand === 'all') ? undefined : selectedBrand;
        const results = await sopApi.searchSOPsByContent(query, brand);
        setFiles(results);
        toast.success(`Found ${results.length} document${results.length !== 1 ? 's' : ''}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to search SOPs');
        setFiles([]);
      } finally {
        setSearching(false);
      }
    } else {
      // Filename search (existing behavior - reload and filter client-side)
      loadFiles();
    }
  };

  // Debounce content search and handle empty query
  useEffect(() => {
    if (searchMode === 'content') {
      if (!searchQuery) {
        loadFiles();
      } else {
        const timer = setTimeout(() => {
          handleSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [searchQuery]);

  // Reload files when switching search modes to ensure consistent state
  useEffect(() => {
    loadFiles();
  }, [searchMode]);

  const handleUpload = async (files: File[], brand: Brand, metadata: { fileCategory: string; uploadedBy: string; version: string; assignedApproverId?: string; comments: string }) => {
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
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
        toast.success(`${successCount} file${successCount !== 1 ? 's' : ''} submitted for approval. Check the "Pending Approvals" tab to review.`);
      }
      if (failCount > 0) {
        const errorMsg = errors.length === 1 ? errors[0] : `Failed to upload ${failCount} files`;
        toast.error(errorMsg);
        if (errors.length > 1) {
          console.error('Upload errors:', errors);
        }
      }

      setUploadModalOpen(false);
      loadFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (file: SOPFile) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
  };

  const handleDownload = (file: SOPFile) => {
    const url = `${API_BASE_URL}/sops/download/${file.id}/${encodeURIComponent(file.fileName)}`;
    window.open(url, '_blank');
  };

  const handleUpdate = async (metadata: { fileCategory: string; brand: string; uploadedBy: string; assignedApproverId?: string; comments: string }, file?: File) => {
    if (!selectedFile) return;

    setUpdating(true);
    try {
      await sopApi.updateSOP(selectedFile.id, metadata, file);
      toast.success('Update request submitted for approval. Check the "Pending Approvals" tab.');
      setUpdateModalOpen(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update SOP');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (requestedBy: string, comments: string, assignedApproverId?: string) => {
    if (!selectedFile) return;

    setDeleting(true);
    try {
      await sopApi.deleteSOP(selectedFile.id, requestedBy, comments, assignedApproverId);
      toast.success('Deletion request submitted for approval. Check the "Pending Approvals" tab.');
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      loadFiles();
      loadPendingDeletions(); // Refresh to disable delete button for this file
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete SOP');
    } finally {
      setDeleting(false);
    }
  };

  const handleBrandChange = (brand: BrandFilter) => {
    if (brand === selectedBrand) return;
    setLoading(true);
    setFiles([]); // Clear files to avoid showing stale data
    setSelectedBrand(brand);
  };

  const filteredFiles = searchMode === 'content'
    ? files
    : files.filter(file => file.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide bg-background flex flex-col">
      {/* Brand Selector */}
      <BrandSidebar selectedBrand={selectedBrand} onSelectBrand={handleBrandChange} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar - only show on non-home pages */}
        {selectedBrand !== 'home' && (
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="max-w-[95%] mx-auto px-8 py-4">
              <div className="flex items-center justify-between gap-8">
                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">
                      SOP Management
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      <span className="capitalize font-medium text-foreground">
                        {selectedBrand === 'all' ? 'All Brands' : selectedBrand}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Search and Actions - Right side */}
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    {searching && searchMode === 'content' && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!searching && (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      placeholder={searchMode === 'content' ? 'Search PDF content...' : 'Search documents...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9 h-10 bg-background border-border shadow-sm"
                      disabled={searching}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => setSearchMode(searchMode === 'filename' ? 'content' : 'filename')}
                    variant={searchMode === 'content' ? 'default' : 'outline'}
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    title={searchMode === 'content' ? 'Searching PDF content' : 'Click to search PDF content'}
                  >
                    <FileSearch className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-border" />

                  <Button
                    onClick={() => setAboutDialogOpen(true)}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    title="About"
                  >
                    <Info className="h-4 w-4" />
                  </Button>

                  <ThemeToggle />

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
        )}

        {/* Content */}
        <div className="flex-1 bg-background">
          <div className="max-w-[95%] mx-auto px-8 py-8">
            {/* Dashboard for Home, SOPTable for Brands */}
            {selectedBrand === 'home' ? (
              <Dashboard
                onUploadClick={() => setUploadModalOpen(true)}
                onBrandSelect={(brand) => handleBrandChange(brand)}
                onApprovalComplete={() => { loadFiles(); loadPendingDeletions(); }}
              />
            ) : (
              <>
                {/* SOPTable */}
                <div>
                  {loading ? (
                    <TableSkeleton />
                  ) : filteredFiles.length === 0 ? (
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
                      files={filteredFiles}
                      loading={loading}
                      showBrandColumn={selectedBrand === 'all'}
                      showStatusColumn={false}
                      pendingDeleteIds={pendingDeleteIds}
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
              </>
            )}
          </div>
        </div>

        <footer className="mt-auto border-t border-border">
          <div className="py-6">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-3">
              <span className="flex items-center gap-2">
                <span className="h-px w-20 bg-gradient-to-r from-transparent via-border to-border"></span>
                <span className="text-muted-foreground/60">✘</span>
              </span>
              © {new Date().getFullYear()} Apptech | Knitwell Group | Developed with <span className="text-red-500">💜</span> by <span className="font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 bg-clip-text text-transparent">𝓢𝓪𝓷𝓽𝓱𝓾 . 𝓢𝓝</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground/60">✘</span>
                <span className="h-px w-20 bg-gradient-to-l from-transparent via-border to-border"></span>
              </span>
            </p>
          </div>
        </footer>
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

      <AboutDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />

      <ScrollToTop />
    </div>
  );
};

export default Index;
