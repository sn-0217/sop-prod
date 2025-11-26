import { SOPFile } from '@/types/sop';
import { FileText, HardDrive, Clock } from 'lucide-react';
import { formatBytes, formatDate, parseDate } from '@/lib/formatters';

interface StatisticsBarProps {
  files: SOPFile[];
}

export function StatisticsBar({ files }: StatisticsBarProps) {
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, file) => acc + file.fileSize, 0);

  // Get most recent upload date
  const validDates = files
    .map(f => parseDate(f.createdAt))
    .filter((d): d is Date => d !== null)
    .map(d => d.getTime());

  const latestUpload = validDates.length > 0
    ? new Date(Math.max(...validDates))
    : null;

  const stats = [
    {
      label: 'Total Documents',
      value: totalFiles.toString(),
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Storage Used',
      value: formatBytes(totalSize),
      icon: HardDrive,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Last Upload',
      value: latestUpload ? formatDate(latestUpload.toISOString()) : 'No uploads',
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${index === 0 ? 'from-primary to-transparent' :
              index === 1 ? 'from-violet-500 to-transparent' :
                'from-muted-foreground to-transparent'
            }`} />

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-medium mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight truncate">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
