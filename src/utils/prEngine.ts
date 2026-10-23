import { DailyWorkout, PRType, WorkoutExercise } from '../types/workout';

export interface ExercisePRSummary {
  exerciseName: string;
  maxWeight: number;
  maxWeightDate: string;
  estimated1RM: number; // based on Epley formula: weight * (1 + reps / 30)
  maxDailyVolume: number;
  maxDailyVolumeDate: string;
  repsRecords: { weight: number; reps: number; date: string }[];
  totalSessions: number;
  lastSessionDate: string;
}

/**
 * Calculates PR status for an individual completed set
 */
export function evaluateSetPR(
  exerciseName: string,
  weight: number,
  reps: number,
  history: DailyWorkout[],
  currentExercise: WorkoutExercise,
  workoutDate: string
): PRType[] {
  if (weight <= 0 || reps <= 0) return [];

  const prs: PRType[] = [];

  // 1. Gather all completed sets of this exercise from PRIOR completed workouts
  let pastMaxWeight = 0;
  const pastMaxRepsForWeight: Record<number, number> = {};
  const pastDailyVolumes: Record<string, number> = {};

  history.forEach(day => {
    // Only count workouts before the current workout date
    if (day.date >= workoutDate) return;

    day.exercises.forEach(ex => {
      if (ex.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase()) {
        let dayExVolume = 0;
        ex.sets.forEach(s => {
          if (s.completed) {
            const w = s.actualWeight || s.targetWeight;
            const r = s.actualReps || s.targetReps;
            if (w > pastMaxWeight) {
              pastMaxWeight = w;
            }
            if (!pastMaxRepsForWeight[w] || r > pastMaxRepsForWeight[w]) {
              pastMaxRepsForWeight[w] = r;
            }
            dayExVolume += w * r;
          }
        });
        if (dayExVolume > 0) {
          pastDailyVolumes[day.date] = (pastDailyVolumes[day.date] || 0) + dayExVolume;
        }
      }
    });
  });

  const highestPastDailyVolume = Object.values(pastDailyVolumes).length > 0
    ? Math.max(...Object.values(pastDailyVolumes))
    : 0;

  // Criteria 1: Weight PR (Exceeds all past completed sessions' max weight)
  if (pastMaxWeight > 0 && weight > pastMaxWeight) {
    prs.push('weight');
  }

  // Criteria 2: Reps PR at Same Weight (Exceeds all past reps at this exact weight)
  const pastBestReps = pastMaxRepsForWeight[weight] || 0;
  if (pastBestReps > 0 && reps > pastBestReps) {
    prs.push('reps');
  }

  // Criteria 3: Daily Volume PR (Today's accumulated volume for this exercise exceeds all past daily volumes)
  let todayVolumeSoFar = 0;
  currentExercise.sets.forEach(s => {
    if (s.completed) {
      const w = s.actualWeight || s.targetWeight;
      const r = s.actualReps || s.targetReps;
      todayVolumeSoFar += w * r;
    }
  });

  if (highestPastDailyVolume > 0 && todayVolumeSoFar > highestPastDailyVolume) {
    prs.push('volume');
  }

  return prs;
}

/**
 * Calculates estimated 1RM using Epley formula: w * (1 + r / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round((weight * (1 + reps / 30)) * 10) / 10;
}

/**
 * Builds comprehensive PR summary for all exercises from workout history
 */
export function buildExercisePRSummaries(workouts: DailyWorkout[]): Record<string, ExercisePRSummary> {
  const summaries: Record<string, ExercisePRSummary> = {};

  workouts.forEach(day => {
    day.exercises.forEach(ex => {
      const name = ex.exerciseName.trim();
      if (!name) return;

      if (!summaries[name]) {
        summaries[name] = {
          exerciseName: name,
          maxWeight: 0,
          maxWeightDate: '',
          estimated1RM: 0,
          maxDailyVolume: 0,
          maxDailyVolumeDate: '',
          repsRecords: [],
          totalSessions: 0,
          lastSessionDate: day.date
        };
      }

      const summary = summaries[name];
      let dayVolume = 0;
      let hasCompletedSet = false;

      ex.sets.forEach(s => {
        if (s.completed) {
          hasCompletedSet = true;
          const w = s.actualWeight || s.targetWeight;
          const r = s.actualReps || s.targetReps;
          dayVolume += w * r;

          // Max Weight
          if (w > summary.maxWeight) {
            summary.maxWeight = w;
            summary.maxWeightDate = day.date;
          }

          // 1RM
          const est1RM = calculate1RM(w, r);
          if (est1RM > summary.estimated1RM) {
            summary.estimated1RM = est1RM;
          }

          // Reps Record at weight
          const existing = summary.repsRecords.find(item => item.weight === w);
          if (!existing) {
            summary.repsRecords.push({ weight: w, reps: r, date: day.date });
          } else if (r > existing.reps) {
            existing.reps = r;
            existing.date = day.date;
          }
        }
      });

      if (hasCompletedSet) {
        summary.totalSessions += 1;
        if (!summary.lastSessionDate || day.date > summary.lastSessionDate) {
          summary.lastSessionDate = day.date;
        }
        if (dayVolume > summary.maxDailyVolume) {
          summary.maxDailyVolume = dayVolume;
          summary.maxDailyVolumeDate = day.date;
        }
      }
    });
  });

  return summaries;
}
