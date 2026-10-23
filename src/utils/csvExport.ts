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

/**
 * Converts workouts history to CSV string with specified schema:
 * date, exercise, set_no, weight, unit, reps, volume, completed
 */
export function generateWorkoutCSV(workouts: DailyWorkout[], unit = 'kg'): string {
  const headers = ['date', 'exercise', 'set_no', 'weight', 'unit', 'reps', 'volume', 'completed'];
  const rows: string[] = [headers.join(',')];

  workouts.forEach(day => {
    day.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        const weight = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
        const reps = s.actualReps !== undefined ? s.actualReps : s.targetReps;
        const volume = s.completed ? weight * reps : 0;
        const completed = s.completed ? 'Y' : 'N';

        // Escape exercise name if it contains commas or quotes
        const escapedName = ex.exerciseName.includes(',') || ex.exerciseName.includes('"')
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

  // Prepend UTF-8 BOM so Microsoft Excel and Google Sheets open Korean cleanly
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Triggers file download or Web Share API on mobile
 */
export async function exportCSV(workouts: DailyWorkout[], unit = 'kg'): Promise<{ success: boolean; shared: boolean }> {
  const csvContent = generateWorkoutCSV(workouts, unit);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `ironlog_workouts_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;

  // Try Web Share API with file (Android / iOS Share Sheet)
  if (navigator.canShare && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: 'text/csv' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'IronLog 운동 기록 CSV',
          text: 'IronLog 웨이트 트레이닝 운동 세션 기록 내보내기',
          files: [file]
        });
        return { success: true, shared: true };
      }
    } catch (err) {
      // User cancelled share or failed, fallback to download
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share failed, falling back to download:', err);
      } else {
        return { success: false, shared: true };
      }
    }
  }

  // Fallback: Trigger standard browser file download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, shared: false };
}

/**
 * Full JSON export of all app data for complete backup
 */
export function exportAppJSON(data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `ironlog_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
