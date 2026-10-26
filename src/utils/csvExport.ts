import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DailyWorkout } from '../types/workout';

export interface CSVRow {
  date: string;
  exercise: string;
  set_no: number;
  weight: number;
  unit: string;
  reps: number;
  volume: number;
  completed: string; // 'Y' | 'N'
}

export interface ExportResult {
  success: boolean;
  shared: boolean;
  cancelled?: boolean;
  error?: string;
}

/**
 * Converts workouts history to CSV string with specified schema:
 * date, exercise, set_no, weight, unit, reps, volume, completed
 */
export function generateWorkoutCSV(workouts: DailyWorkout[], unit = 'kg'): string {
  const headers = ['date', 'exercise', 'set_no', 'weight', 'unit', 'reps', 'volume', 'completed'];
  const rows: string[] = [headers.join(',')];

  workouts.forEach((day) => {
    day.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const weight = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
        const reps = s.actualReps !== undefined ? s.actualReps : s.targetReps;
        const volume = s.completed ? weight * reps : 0;
        const completed = s.completed ? 'Y' : 'N';

        // Escape exercise name if it contains commas or quotes
        const escapedName =
          ex.exerciseName.includes(',') || ex.exerciseName.includes('"')
            ? `"${ex.exerciseName.replace(/"/g, '""')}"`
            : ex.exerciseName;

        rows.push([
          day.date,
          escapedName,
          s.setNumber,
          weight,
          unit,
          reps,
          volume,
          completed
        ].join(','));
      });
    });
  });

  // Prepend UTF-8 BOM so Microsoft Excel, Samsung/Google Sheets open Korean cleanly
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Unified Native Share Sheet (Android/iOS APK) + Web Download fallback helper.
 * On native APK, writes UTF-8 file to Cache directory and opens Android system Share Sheet
 * so the user can choose Samsung My Files (Download folder), Google Drive, KakaoTalk, Email, etc.
 */
async function shareOrDownloadTextFile(params: {
  content: string;
  filename: string;
  mimeType: string;
  title: string;
  dialogTitle: string;
}): Promise<ExportResult> {
  const { content, filename, mimeType, title, dialogTitle } = params;

  // 1. Native Android / iOS APK path via Capacitor Filesystem + Share
  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title,
        files: [writeResult.uri],
        dialogTitle
      });

      return { success: true, shared: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('cancel')) {
        return { success: false, shared: true, cancelled: true };
      }
      console.error('Native file share failed:', err);
      return { success: false, shared: false, error: msg };
    }
  }

  // 2. Web Browser path
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });

  // Try Web Share API with file on mobile browsers if supported
  const isMobileWeb =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobileWeb && navigator.canShare && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          files: [file]
        });
        return { success: true, shared: true };
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, shared: true, cancelled: true };
      }
      console.warn('Web Share failed, falling back to browser download:', err);
    }
  }

  // Standard browser anchor download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true, shared: false };
}

/**
 * Triggers CSV file export via Android Share Sheet (on APK) or browser download (on Web)
 */
export async function exportCSV(workouts: DailyWorkout[], unit = 'kg'): Promise<ExportResult> {
  const csvContent = generateWorkoutCSV(workouts, unit);
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `ironlog_workouts_${dateStamp}.csv`;

  return shareOrDownloadTextFile({
    content: csvContent,
    filename,
    mimeType: 'text/csv',
    title: 'IronLog 운동 기록 CSV',
    dialogTitle: 'CSV 파일 저장 위치 또는 공유할 앱 선택'
  });
}

/**
 * Triggers full JSON backup export via Android Share Sheet (on APK) or browser download (on Web)
 */
export async function exportAppJSON(data: unknown): Promise<ExportResult> {
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `ironlog_backup_${dateStamp}.json`;

  return shareOrDownloadTextFile({
    content: jsonStr,
    filename,
    mimeType: 'application/json',
    title: 'IronLog 전체 백업 JSON',
    dialogTitle: '백업 파일 저장 위치 또는 공유할 앱 선택'
  });
}
