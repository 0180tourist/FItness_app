export interface PlateInventoryItem {
  weight: number; // e.g. 20, 15, 10, 5, 2.5, 1.25
  pairs: number;  // number of pairs (e.g. 2 pairs = 4 plates total, 2 per side)
  enabled: boolean;
  color: string;  // color badge for visual barbell representation
}

export interface PlatePreset {
  id: string;
  name: string;
  plates: PlateInventoryItem[];
}

export interface BarbellConfig {
  barWeight: number;
  unit: 'kg' | 'lbs';
}

export type PRType = 'weight' | 'reps' | 'volume';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight?: number;
  actualReps?: number;
  completed: boolean;
  completedAt?: string;
  prTypes?: PRType[];
}

export interface WorkoutExercise {
  id: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface DailyWorkout {
  date: string; // YYYY-MM-DD
  title: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  completedAt?: string;
  totalVolume?: number;
  notes?: string;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  description?: string;
  exercises: {
    exerciseName: string;
    sets: { targetWeight: number; targetReps: number }[];
  }[];
}

export type SoundType = 'gym_beep' | 'chime' | 'boxing_bell' | 'soft_pulse';

export interface AppSettings {
  barWeight: number;
  unit: 'kg' | 'lbs';
  soundEnabled: boolean;
  soundVolume: number; // 0.0 ~ 1.0 (default 0.8)
  soundType: SoundType;
  vibrationEnabled: boolean;
  defaultRestSeconds: number;
  activePresetId: string;
  presets: PlatePreset[];
  plates: PlateInventoryItem[]; // convenience accessor for active preset's plates
}

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  perSideWeight: number;
  platesPerSide: { weight: number; count: number; color: string }[];
  totalActualWeight: number;
  differenceKg: number; // positive if overflow
  isExact: boolean;
  isImpossible: boolean;
}
