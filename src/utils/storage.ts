import { AppSettings, DailyWorkout, RoutineTemplate, PlatePreset } from '../types/workout';
import { DEFAULT_PLATES } from './plateCalculator';

const STORAGE_KEYS = {
  SETTINGS: 'ironlog_settings',
  WORKOUTS: 'ironlog_workouts',
  EXERCISES: 'ironlog_exercises',
  TEMPLATES: 'ironlog_templates'
};

export const DEFAULT_PRESETS: PlatePreset[] = [
  {
    id: 'preset_gym',
    name: '헬스장 무게',
    plates: [
      { weight: 20, pairs: 2, enabled: true, color: '#3B82F6' },
      { weight: 15, pairs: 1, enabled: true, color: '#EAB308' },
      { weight: 10, pairs: 2, enabled: true, color: '#10B981' },
      { weight: 5, pairs: 2, enabled: true, color: '#F3F4F6' },
      { weight: 2.5, pairs: 2, enabled: true, color: '#4B5563' },
      { weight: 1.25, pairs: 2, enabled: true, color: '#9CA3AF' }
    ]
  },
  {
    id: 'preset_home',
    name: '내집 무게 (홈짐)',
    plates: [
      { weight: 15, pairs: 2, enabled: true, color: '#EAB308' },
      { weight: 10, pairs: 2, enabled: true, color: '#10B981' },
      { weight: 5, pairs: 2, enabled: true, color: '#F3F4F6' },
      { weight: 2.5, pairs: 2, enabled: true, color: '#4B5563' }
    ]
  }
];

export const INITIAL_EXERCISES: string[] = [
  '벤치프레스 (Bench Press)',
  '스쿼트 (Back Squat)',
  '데드리프트 (Conventional Deadlift)',
  '오버헤드 프레스 (Overhead Press)',
  '바벨 로우 (Barbell Row)',
  '인클라인 덤벨 프레스 (Incline DB Press)',
  '루마니안 데드리프트 (Romanian Deadlift)',
  '랫 풀 다운 (Lat Pulldown)',
  '시티드 케이블 로우 (Seated Cable Row)',
  '레그 프레스 (Leg Press)',
  '사이드 레터럴 레이즈 (Lateral Raise)',
  '바벨 컬 (Barbell Curl)',
  '트라이셉스 푸시다운 (Triceps Pushdown)'
];

export const INITIAL_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'push_day',
    title: '가슴 & 어깨 & 삼두 (Push)',
    description: '벤치프레스, OHP 중심의 상체 밀기 루틴',
    exercises: [
      {
        exerciseName: '벤치프레스 (Bench Press)',
        sets: [
          { targetWeight: 60, targetReps: 10 },
          { targetWeight: 80, targetReps: 8 },
          { targetWeight: 90, targetReps: 6 },
          { targetWeight: 90, targetReps: 6 },
          { targetWeight: 80, targetReps: 8 }
        ]
      },
      {
        exerciseName: '오버헤드 프레스 (Overhead Press)',
        sets: [
          { targetWeight: 40, targetReps: 10 },
          { targetWeight: 50, targetReps: 8 },
          { targetWeight: 50, targetReps: 8 },
          { targetWeight: 45, targetReps: 10 }
        ]
      },
      {
        exerciseName: '인클라인 덤벨 프레스 (Incline DB Press)',
        sets: [
          { targetWeight: 26, targetReps: 10 },
          { targetWeight: 28, targetReps: 8 },
          { targetWeight: 28, targetReps: 8 }
        ]
      },
      {
        exerciseName: '사이드 레터럴 레이즈 (Lateral Raise)',
        sets: [
          { targetWeight: 10, targetReps: 15 },
          { targetWeight: 10, targetReps: 15 },
          { targetWeight: 10, targetReps: 12 }
        ]
      }
    ]
  },
  {
    id: 'pull_day',
    title: '등 & 이두 (Pull)',
    description: '데드리프트, 바벨로우 중심의 당기기 루틴',
    exercises: [
      {
        exerciseName: '데드리프트 (Conventional Deadlift)',
        sets: [
          { targetWeight: 100, targetReps: 5 },
          { targetWeight: 120, targetReps: 5 },
          { targetWeight: 130, targetReps: 3 },
          { targetWeight: 140, targetReps: 2 }
        ]
      },
      {
        exerciseName: '바벨 로우 (Barbell Row)',
        sets: [
          { targetWeight: 60, targetReps: 10 },
          { targetWeight: 70, targetReps: 8 },
          { targetWeight: 70, targetReps: 8 }
        ]
      },
      {
        exerciseName: '랫 풀 다운 (Lat Pulldown)',
        sets: [
          { targetWeight: 55, targetReps: 10 },
          { targetWeight: 60, targetReps: 10 },
          { targetWeight: 65, targetReps: 8 }
        ]
      },
      {
        exerciseName: '바벨 컬 (Barbell Curl)',
        sets: [
          { targetWeight: 30, targetReps: 10 },
          { targetWeight: 35, targetReps: 8 },
          { targetWeight: 35, targetReps: 8 }
        ]
      }
    ]
  },
  {
    id: 'leg_day',
    title: '하체 (Leg Day)',
    description: '스쿼트, 레그프레스 중심의 하체 루틴',
    exercises: [
      {
        exerciseName: '스쿼트 (Back Squat)',
        sets: [
          { targetWeight: 80, targetReps: 8 },
          { targetWeight: 100, targetReps: 6 },
          { targetWeight: 110, targetReps: 5 },
          { targetWeight: 110, targetReps: 5 },
          { targetWeight: 90, targetReps: 8 }
        ]
      },
      {
        exerciseName: '루마니안 데드리프트 (Romanian Deadlift)',
        sets: [
          { targetWeight: 80, targetReps: 10 },
          { targetWeight: 90, targetReps: 8 },
          { targetWeight: 90, targetReps: 8 }
        ]
      },
      {
        exerciseName: '레그 프레스 (Leg Press)',
        sets: [
          { targetWeight: 160, targetReps: 12 },
          { targetWeight: 180, targetReps: 10 },
          { targetWeight: 200, targetReps: 10 }
        ]
      }
    ]
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  barWeight: 20,
  unit: 'kg',
  soundEnabled: true,
  soundVolume: 1.0,
  soundType: 'gym_beep',
  vibrationEnabled: true,
  defaultRestSeconds: 90,
  activePresetId: 'preset_gym',
  presets: DEFAULT_PRESETS,
  plates: DEFAULT_PRESETS[0].plates
};

const VOLUME_V2_MIGRATION_KEY = 'ironlog_volume_v2_migrated';

/**
 * Returns formatted today date string YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: if presets is missing, populate default presets
      let presets = parsed.presets;
      if (!presets || !Array.isArray(presets) || presets.length === 0) {
        presets = DEFAULT_PRESETS;
      }
      const activePresetId = parsed.activePresetId || presets[0].id;
      const activePreset = presets.find((p: PlatePreset) => p.id === activePresetId) || presets[0];

      // One-time migration: boost legacy default 0.8 volume up to 1.0 (100%)
      let resolvedVolume = typeof parsed.soundVolume === 'number' ? parsed.soundVolume : 1.0;
      const migrated = localStorage.getItem(VOLUME_V2_MIGRATION_KEY);
      if (!migrated) {
        if (parsed.soundVolume === undefined || Math.abs(parsed.soundVolume - 0.8) < 0.001) {
          resolvedVolume = 1.0;
        }
        localStorage.setItem(VOLUME_V2_MIGRATION_KEY, '1');
      }

      const resolvedRestSeconds =
        typeof parsed.defaultRestSeconds === 'number' && parsed.defaultRestSeconds >= 5
          ? Math.round(parsed.defaultRestSeconds)
          : 90;

      const loaded: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        soundVolume: resolvedVolume,
        soundType: parsed.soundType || 'gym_beep',
        defaultRestSeconds: resolvedRestSeconds,
        presets,
        activePresetId: activePreset.id,
        plates: activePreset.plates
      };

      if (!migrated) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(loaded));
      }

      return loaded;
    } else {
      localStorage.setItem(VOLUME_V2_MIGRATION_KEY, '1');
    }
  } catch (err) {
    console.warn('Failed to load settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadExercises(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load exercises:', err);
  }
  return INITIAL_EXERCISES;
}

export function saveExercises(list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save exercises:', err);
  }
}

/**
 * Registers an exercise name if not already existing, trimming whitespace and preventing duplicates
 */
export function registerExerciseIfNew(name: string, currentList: string[]): string[] {
  const trimmed = name.trim();
  if (!trimmed) return currentList;

  const exists = currentList.some(item => item.trim().toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const updated = [trimmed, ...currentList];
    saveExercises(updated);
    return updated;
  }
  return currentList;
}

export function loadTemplates(): RoutineTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load templates:', err);
  }
  return INITIAL_TEMPLATES;
}

export function saveTemplates(templates: RoutineTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates:', err);
  }
}

/**
 * Generates sample past workouts for demonstrating calendar, history, and PR calculation
 */
function generateSeedWorkouts(): DailyWorkout[] {
  const today = new Date();
  
  // 5 days ago (Push Day)
  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 5);
  const date1 = d1.toISOString().slice(0, 10);

  // 3 days ago (Pull Day)
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 3);
  const date2 = d2.toISOString().slice(0, 10);

  // 1 day ago (Leg Day)
  const d3 = new Date(today);
  d3.setDate(d3.getDate() - 1);
  const date3 = d3.toISOString().slice(0, 10);

  return [
    {
      date: date1,
      title: '가슴 & 삼두 파워 세션',
      completed: true,
      totalVolume: 5120,
      exercises: [
        {
          id: 'ex-seed-1',
          exerciseName: '벤치프레스 (Bench Press)',
          sets: [
            { id: 's1', setNumber: 1, targetWeight: 60, targetReps: 10, actualWeight: 60, actualReps: 10, completed: true },
            { id: 's2', setNumber: 2, targetWeight: 80, targetReps: 8, actualWeight: 80, actualReps: 8, completed: true },
            { id: 's3', setNumber: 3, targetWeight: 90, targetReps: 6, actualWeight: 90, actualReps: 6, completed: true },
            { id: 's4', setNumber: 4, targetWeight: 95, targetReps: 4, actualWeight: 95, actualReps: 4, completed: true }
          ]
        },
        {
          id: 'ex-seed-2',
          exerciseName: '오버헤드 프레스 (Overhead Press)',
          sets: [
            { id: 's5', setNumber: 1, targetWeight: 40, targetReps: 10, actualWeight: 40, actualReps: 10, completed: true },
            { id: 's6', setNumber: 2, targetWeight: 50, targetReps: 8, actualWeight: 50, actualReps: 8, completed: true }
          ]
        }
      ]
    },
    {
      date: date2,
      title: '등 & 이두 풀세션',
      completed: true,
      totalVolume: 6480,
      exercises: [
        {
          id: 'ex-seed-3',
          exerciseName: '데드리프트 (Conventional Deadlift)',
          sets: [
            { id: 's7', setNumber: 1, targetWeight: 100, targetReps: 5, actualWeight: 100, actualReps: 5, completed: true },
            { id: 's8', setNumber: 2, targetWeight: 120, targetReps: 5, actualWeight: 120, actualReps: 5, completed: true },
            { id: 's9', setNumber: 3, targetWeight: 135, targetReps: 3, actualWeight: 135, actualReps: 3, completed: true }
          ]
        },
        {
          id: 'ex-seed-4',
          exerciseName: '바벨 로우 (Barbell Row)',
          sets: [
            { id: 's10', setNumber: 1, targetWeight: 60, targetReps: 10, actualWeight: 60, actualReps: 10, completed: true },
            { id: 's11', setNumber: 2, targetWeight: 70, targetReps: 8, actualWeight: 70, actualReps: 8, completed: true }
          ]
        }
      ]
    },
    {
      date: date3,
      title: '하체 스트렝스 세션',
      completed: true,
      totalVolume: 7200,
      exercises: [
        {
          id: 'ex-seed-5',
          exerciseName: '스쿼트 (Back Squat)',
          sets: [
            { id: 's12', setNumber: 1, targetWeight: 80, targetReps: 8, actualWeight: 80, actualReps: 8, completed: true },
            { id: 's13', setNumber: 2, targetWeight: 100, targetReps: 6, actualWeight: 100, actualReps: 6, completed: true },
            { id: 's14', setNumber: 3, targetWeight: 110, targetReps: 5, actualWeight: 110, actualReps: 5, completed: true }
          ]
        }
      ]
    }
  ];
}

export function loadWorkouts(): DailyWorkout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load workouts:', err);
  }

  // Seed default workouts if empty so user has immediate rich data
  const seed = generateSeedWorkouts();
  saveWorkouts(seed);
  return seed;
}

export function saveWorkouts(workouts: DailyWorkout[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (err) {
    console.error('Failed to save workouts:', err);
  }
}
