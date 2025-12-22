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
import { Download, FilePenLine, Trash, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/formatters';

interface SOPTableProps {
  files: SOPFile[];
  onPreview: (file: SOPFile) => void;
  onDownload: (file: SOPFile) => void;
  onUpdate: (file: SOPFile) => void;
  onDelete: (file: SOPFile) => void;
  loading?: boolean;
  showBrandColumn?: boolean;
  showStatusColumn?: boolean; // NEW: hide status on brand pages
  pendingDeleteIds?: Set<string>; // IDs of SOPs with pending deletion requests
}

type SortKey = 'fileName' | 'fileCategory' | 'uploadedBy' | 'fileSize' | 'modifiedAt' | 'brand' | 'version';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'brand' | 'fileCategory' | 'uploadedBy' | 'modifiedAt' | 'version';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function SOPTable({ files, onPreview, onDownload, onUpdate, onDelete, loading, showBrandColumn, showStatusColumn = true, pendingDeleteIds = new Set() }: SOPTableProps) {
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

      // Special handling for version sorting
      if (key === 'version') {
        // Remove 'v' prefix and split by '.'
        const parseVersion = (v: string) => {
          if (!v) return [0, 0];
          const clean = v.toLowerCase().replace('v', '');
          const parts = clean.split('.').map(Number);
          return parts.length === 2 ? parts : [Number(clean) || 0, 0];
        };

        const [aMajor, aMinor] = parseVersion(String(aValue));
        const [bMajor, bMinor] = parseVersion(String(bValue));

        if (aMajor !== bMajor) {
          return direction === 'asc' ? aMajor - bMajor : bMajor - aMajor;
        }
        return direction === 'asc' ? aMinor - bMinor : bMinor - aMinor;
      }

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

      if (groupBy === 'modifiedAt') {
        // Group by date only, remove the time part
        const fullDate = formatDate(file.modifiedAt);
        // formatDate returns "Nov 27, 2025 13:06", we want "Nov 27, 2025"
        // We can split by space and take the first 3 parts (Month Day, Year)
        // But be careful if format changes. 
        // Let's just use the date part if it matches the expected pattern.
        // Or better, let's just take everything before the last space if it looks like a time.
        // Actually, formatDate uses specific locale options.
        // Let's just split by comma if it was "Date, Time", but it is "Date Time".
        // The format is `${datePart} ${timePart}`.
        // datePart is "Nov 27, 2025" (3 parts). timePart is "13:06" (1 part).
        // So splitting by space gives 4 parts.
        const parts = fullDate.split(' ');
        if (parts.length >= 4) {
          key = parts.slice(0, 3).join(' ');
        } else {
          key = fullDate;
        }
      }

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
        <div className="flex items-center">
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="h-9 w-auto gap-2 pl-3 pr-4 text-sm font-medium bg-secondary/50 hover:bg-secondary/80 border-transparent hover:border-border transition-all rounded-lg text-foreground shadow-none">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Group by:</span>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent align="end" className="w-[180px]">
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="fileCategory">Category</SelectItem>
              <SelectItem value="uploadedBy">Uploaded By</SelectItem>
              <SelectItem value="version">Version</SelectItem>
              <SelectItem value="modifiedAt">Last Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="h-11 hover:bg-transparent border-b border-border/60">
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('fileName')}
              >
                <div className="flex items-center">
                  Document Name
                  <SortIcon columnKey="fileName" />
                </div>
              </TableHead>
              {showBrandColumn && (
                <TableHead
                  className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center">
                    Brand
                    <SortIcon columnKey="brand" />
                  </div>
                </TableHead>
              )}
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('version')}
              >
                <div className="flex items-center">
                  Version
                  <SortIcon columnKey="version" />
                </div>
              </TableHead>
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('fileCategory')}
              >
                <div className="flex items-center">
                  Category
                  <SortIcon columnKey="fileCategory" />
                </div>
              </TableHead>
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('uploadedBy')}
              >
                <div className="flex items-center">
                  Uploaded By
                  <SortIcon columnKey="uploadedBy" />
                </div>
              </TableHead>
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('fileSize')}
              >
                <div className="flex items-center">
                  Size
                  <SortIcon columnKey="fileSize" />
                </div>
              </TableHead>
              <TableHead
                className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-transparent transition-colors"
                onClick={() => handleSort('modifiedAt')}
              >
                <div className="flex items-center">
                  Modified Time
                  <SortIcon columnKey="modifiedAt" />
                </div>
              </TableHead>
              {showStatusColumn && (
                <TableHead className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Status</TableHead>
              )}
              <TableHead className="h-11 px-4 text-right text-xs font-medium uppercase tracking-wider text-secondary-foreground w-auto whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
              <Fragment key={groupName}>
                {groupBy !== 'none' && (
                  <TableRow key={`group-${groupName}`} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={showBrandColumn ? 8 : 7} className="font-semibold py-2">
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
                  <TableRow key={file.id} className="group hover:bg-muted/40 transition-colors border-b border-border/40 data-[state=selected]:bg-muted">
                    <TableCell className="py-3 font-medium text-xs">
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
                      <TableCell className="py-3 text-xs">
                        <Badge variant="outline" className="capitalize font-normal bg-background/50">
                          {file.brand}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="py-3 text-xs">
                      {file.version ? (
                        <Badge variant="outline" className="font-mono text-xs bg-background/50">
                          {file.version}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {file.fileCategory ? (
                        <Badge variant="secondary" className="font-normal bg-secondary/50">
                          {file.fileCategory}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-xs">
                      {file.uploadedBy || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium py-3 text-xs">{formatBytes(file.fileSize)}</TableCell>
                    <TableCell className="text-muted-foreground py-3 text-xs">
                      {formatDate(file.modifiedAt)}
                    </TableCell>
                    {showStatusColumn && (
                      <TableCell>
                        {file.status === 'APPROVED' && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Approved
                          </Badge>
                        )}
                        {file.status === 'PENDING_APPROVAL' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending
                          </Badge>
                        )}
                        {file.status === 'REJECTED' && (
                          <Badge variant="destructive">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdate(file)}
                          className="h-9 w-9 p-0 hover:bg-muted"
                        >
                          <FilePenLine className="h-4 w-4" />
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
                          disabled={pendingDeleteIds.has(file.id)}
                          className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                          title={pendingDeleteIds.has(file.id) ? 'Deletion pending approval' : 'Delete'}
                        >
                          <Trash className="h-4 w-4" />
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
    </div >
  );
}
