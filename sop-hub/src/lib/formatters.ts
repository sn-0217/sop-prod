import { parse, isValid } from 'date-fns';

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';

  // Try standard Date parsing first
  let date = new Date(dateString);

  // If invalid, try parsing the custom format: 25-11-2025, 13:06:47
  if (isNaN(date.getTime())) {
    const parsedDate = parse(dateString, 'dd-MM-yyyy, HH:mm:ss', new Date());
    if (isValid(parsedDate)) {
      date = parsedDate;
    } else {
      return dateString || 'N/A';
    }
  }

  const datePart = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${datePart} ${timePart}`;
}

export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  let date = new Date(dateString);

  if (isNaN(date.getTime())) {
    const parsedDate = parse(dateString, 'dd-MM-yyyy, HH:mm:ss', new Date());
    if (isValid(parsedDate)) {
      date = parsedDate;
    } else {
      return null;
    }
  }

  return date;
}
