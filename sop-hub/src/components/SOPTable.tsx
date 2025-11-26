import { useState, useMemo, Fragment } from 'react';
import { SOPFile } from '@/types/sop';
import { API_BASE_URL } from '@/services/sopApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Pencil, Trash2, FileText, ArrowUpDown, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/formatters';

interface SOPTableProps {
  files: SOPFile[];
  onPreview: (file: SOPFile) => void;
  onDownload: (file: SOPFile) => void;
  onUpdate: (file: SOPFile) => void;
  onDelete: (file: SOPFile) => void;
  loading?: boolean;
  showBrandColumn?: boolean;
}

type SortKey = 'fileName' | 'fileCategory' | 'uploadedBy' | 'fileSize' | 'modifiedAt' | 'brand';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'brand' | 'fileCategory' | 'uploadedBy';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function SOPTable({ files, onPreview, onDownload, onUpdate, onDelete, loading, showBrandColumn }: SOPTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'fileName', direction: 'asc' });
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any = a[key];
      let bValue: any = b[key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Case-insensitive string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [files, sortConfig]);

  const groupedFiles = useMemo(() => {
    if (groupBy === 'none') return { 'All Files': sortedFiles };

    return sortedFiles.reduce((groups, file) => {
      let key = file[groupBy] as string;
      if (!key) key = 'Uncategorized';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
      return groups;
    }, {} as Record<string, SOPFile[]>);
  }, [sortedFiles, groupBy]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No SOPs uploaded yet</p>
        <p className="text-sm">Upload your first SOP document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-md border border-border shadow-sm">
          <Layers className="h-4 w-4" />
          <span>Group by:</span>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="h-8 w-[140px] border-none bg-transparent focus:ring-0 px-2">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="fileCategory">Category</SelectItem>
              <SelectItem value="uploadedBy">Uploaded By</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('fileName')}
              >
                <div className="flex items-center">
                  Document Name
                  <SortIcon columnKey="fileName" />
                </div>
              </TableHead>
              {showBrandColumn && (
                <TableHead
                  className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center">
                    Brand
                    <SortIcon columnKey="brand" />
                  </div>
                </TableHead>
              )}
              <TableHead
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('fileCategory')}
              >
                <div className="flex items-center">
                  Category
                  <SortIcon columnKey="fileCategory" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('uploadedBy')}
              >
                <div className="flex items-center">
                  Uploaded By
                  <SortIcon columnKey="uploadedBy" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('fileSize')}
              >
                <div className="flex items-center">
                  Size
                  <SortIcon columnKey="fileSize" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('modifiedAt')}
              >
                <div className="flex items-center">
                  Last Updated
                  <SortIcon columnKey="modifiedAt" />
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
              <Fragment key={groupName}>
                {groupBy !== 'none' && (
                  <TableRow key={`group-${groupName}`} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={showBrandColumn ? 7 : 6} className="font-semibold py-2">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{groupName}</span>
                        <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                          {groupFiles.length}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {groupFiles.map(file => (
                  <TableRow key={file.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">
                      <button
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            const url = `${API_BASE_URL}/sops/view/${file.id}/${encodeURIComponent(file.fileName)}`;
                            window.open(url, '_blank');
                          } else {
                            onPreview(file);
                          }
                        }}
                        className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="group-hover:underline">{file.fileName}</span>
                      </button>
                    </TableCell>
                    {showBrandColumn && (
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-normal">
                          {file.brand}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {file.fileCategory ? (
                        <Badge variant="secondary" className="font-normal">
                          {file.fileCategory}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.uploadedBy || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{formatBytes(file.fileSize)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.modifiedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdate(file)}
                          className="h-9 w-9 p-0 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(file)}
                          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(file)}
                          className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
