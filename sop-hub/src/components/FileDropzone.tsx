import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/formatters';

export interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function FileList({ files, onRemove, disabled }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-sm font-medium text-foreground">Selected Files ({files.length})</h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg bg-background p-2 space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border group hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-7 h-7 rounded bg-background border flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate leading-none mb-0.5">{file.name}</p>
                <p className="text-[10px] text-muted-foreground/80">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showList?: boolean;
}

export function FileDropzone({ files, onFilesChange, maxFiles = 1, disabled, className, showList = true }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');

      if (maxFiles === 1) {
        onFilesChange(pdfFiles.slice(0, 1));
      } else {
        onFilesChange([...files, ...pdfFiles].slice(0, maxFiles));
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles,
    disabled,
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {showList && files.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-sm font-medium text-foreground">Selected Files ({files.length})</h3>
            {files.length < maxFiles && (
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-primary/80">
                  + Add more
                </Button>
              </div>
            )}
          </div>

          <FileList files={files} onRemove={removeFile} disabled={disabled} />
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 h-full flex flex-col items-center justify-center gap-2',
            isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50 hover:bg-muted/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF files only (max {maxFiles} file{maxFiles !== 1 ? 's' : ''})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
