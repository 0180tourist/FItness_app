import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar as CalendarIcon, History, Settings, Scale, 
  Timer, Sparkles, Plus 
} from 'lucide-react';
import { DailyWorkout, AppSettings, RoutineTemplate } from './types/workout';
import { 
  loadSettings, saveSettings, loadWorkouts, saveWorkouts, 
  loadExercises, saveExercises, registerExerciseIfNew, 
  loadTemplates, saveTemplates, getTodayDateString, DEFAULT_SETTINGS 
} from './utils/storage';
import { TodayTab } from './components/TodayTab';
import { CalendarTab } from './components/CalendarTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { RestTimerBar } from './components/RestTimerBar';

type TabType = 'today' | 'calendar' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [workouts, setWorkouts] = useState<DailyWorkout[]>(() => loadWorkouts());
  const [exerciseList, setExerciseList] = useState<string[]>(() => loadExercises());
  const [templates, setTemplates] = useState<RoutineTemplate[]>(() => loadTemplates());

  // Today's workout state
  const todayDate = getTodayDateString();
  const [todayWorkout, setTodayWorkout] = useState<DailyWorkout>(() => {
    const existing = workouts.find(w => w.date === todayDate);
    if (existing) return existing;
    return {
      date: todayDate,
      title: '오늘의 루틴',
      exercises: [],
      completed: false,
      totalVolume: 0
    };
  });

  // Plate Calculator Modal state
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState(60);
  const [plateCalcApplyCallback, setPlateCalcApplyCallback] = useState<((w: number) => void) | null>(null);

  // Rest Timer state
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimerTriggerKey, setRestTimerTriggerKey] = useState(0);

  // Sync todayWorkout changes to workouts array and persistence
  const handleUpdateTodayWorkout = (updated: DailyWorkout) => {
    setTodayWorkout(updated);
    const existingIndex = workouts.findIndex(w => w.date === updated.date);
    let nextWorkouts: DailyWorkout[];
    if (existingIndex >= 0) {
      nextWorkouts = [...workouts];
      nextWorkouts[existingIndex] = updated;
    } else {
      nextWorkouts = [updated, ...workouts];
    }
    setWorkouts(nextWorkouts);
    saveWorkouts(nextWorkouts);
  };

  // Register exercise if new
  const handleRegisterExercise = (name: string) => {
    const updated = registerExerciseIfNew(name, exerciseList);
    setExerciseList(updated);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Copy past workout from calendar to today
  const handleCopyWorkoutToToday = (sourceWorkout: DailyWorkout) => {
    const copied: DailyWorkout = {
      date: todayDate,
      title: `${sourceWorkout.title || '루틴'} 복사본`,
      completed: false,
      exercises: sourceWorkout.exercises.map((ex, exIdx) => ({
        id: `ex-${Date.now()}-${exIdx}`,
        exerciseName: ex.exerciseName,
        sets: ex.sets.map((s, sIdx) => ({
          id: `set-${Date.now()}-${exIdx}-${sIdx}`,
          setNumber: sIdx + 1,
          targetWeight: s.actualWeight || s.targetWeight,
          targetReps: s.actualReps || s.targetReps,
          completed: false
        }))
      }))
    };
    handleUpdateTodayWorkout(copied);
    setActiveTab('today');
  };

  // Open Plate Calculator for specific set
  const handleOpenPlateCalc = (weight: number, onApply?: (w: number) => void) => {
    setPlateCalcTargetWeight(weight > 0 ? weight : 60);
    setPlateCalcApplyCallback(() => (onApply ? onApply : null));
    setIsPlateCalcOpen(true);
  };

  // Trigger Rest Timer when a set is completed
  const handleTriggerRestTimer = () => {
    setIsRestTimerActive(true);
    setRestTimerTriggerKey(prev => prev + 1);
  };

  // Restore data from backup
  const handleRestoreData = (restoredWorkouts: DailyWorkout[], restoredSettings?: AppSettings) => {
    setWorkouts(restoredWorkouts);
    saveWorkouts(restoredWorkouts);
    if (restoredSettings) {
      setSettings(restoredSettings);
      saveSettings(restoredSettings);
    }
    const today = restoredWorkouts.find(w => w.date === todayDate);
    if (today) {
      setTodayWorkout(today);
    }
  };

  // Save a newly generated template
  const handleSaveTemplate = (newTmpl: RoutineTemplate) => {
    const updated = [newTmpl, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
  };

  // Bulk register exercises from AI routine
  const handleRegisterExercises = (names: string[]) => {
    let current = exerciseList;
    names.forEach(name => {
      current = registerExerciseIfNew(name, current);
    });
    setExerciseList(current);
  };

  // Switch Active Preset (from Calculator modal or elsewhere)
  const handleSelectPreset = (presetId: string) => {
    const target = settings.presets.find(p => p.id === presetId);
    if (!target) return;
    const updated = {
      ...settings,
      activePresetId: presetId,
      plates: target.plates
    };
    setSettings(updated);
    saveSettings(updated);
  };

  // Delete a specific past workout session
  const handleDeleteWorkout = (dateStr: string) => {
    const updated = workouts.filter(w => w.date !== dateStr);
    setWorkouts(updated);
    saveWorkouts(updated);
    if (todayWorkout.date === dateStr) {
      const resetToday: DailyWorkout = {
        date: todayDate,
        title: '오늘의 루틴',
        exercises: [],
        completed: false,
        totalVolume: 0
      };
      setTodayWorkout(resetToday);
    }
  };

  // Delete exercise from registered master list (keeps past session history intact)
  const handleDeleteMasterExercise = (name: string) => {
    const updated = exerciseList.filter(
      item => item.trim().toLowerCase() !== name.trim().toLowerCase()
    );
    setExerciseList(updated);
    saveExercises(updated);
  };

  // Reset seed data
  const handleResetSeedData = () => {
    localStorage.clear();
    const newSettings = DEFAULT_SETTINGS;
    setSettings(newSettings);
    saveSettings(newSettings);
    const newWorkouts = loadWorkouts();
    setWorkouts(newWorkouts);
    const today = newWorkouts.find(w => w.date === todayDate) || {
      date: todayDate,
      title: '오늘의 루틴',
      exercises: [],
      completed: false,
      totalVolume: 0
    };
    setTodayWorkout(today);
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F3F4F6] flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0B0D12]/90 backdrop-blur-md border-b border-[#262D3D] pt-safe">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-black font-extrabold shadow-md shadow-amber-500/20">
              <Dumbbell size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-black tracking-tight text-white font-mono">
              IronLog
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Timer Toggle */}
            <button
              onClick={() => setIsRestTimerActive(!isRestTimerActive)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                isRestTimerActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#141720] text-gray-400 border-[#262D3D] hover:text-white'
              }`}
              title="휴식 타이머"
            >
              <Timer size={15} />
              <span className="hidden sm:inline">타이머</span>
            </button>

            {/* Quick Plate Calculator Trigger */}
            <button
              onClick={() => handleOpenPlateCalc(60)}
              className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Scale size={15} strokeWidth={2.5} />
              <span>원반 계산기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5">
        {activeTab === 'today' && (
          <TodayTab
            todayWorkout={todayWorkout}
            workoutHistory={workouts}
            exerciseList={exerciseList}
            templates={templates}
            soundEnabled={settings.soundEnabled}
            soundVolume={settings.soundVolume}
            vibrationEnabled={settings.vibrationEnabled}
            onUpdateWorkout={handleUpdateTodayWorkout}
            onRegisterExercise={handleRegisterExercise}
            onRegisterExercises={handleRegisterExercises}
            onDeleteMasterExercise={handleDeleteMasterExercise}
            onSaveTemplate={handleSaveTemplate}
            onOpenPlateCalc={handleOpenPlateCalc}
            onTriggerRestTimer={handleTriggerRestTimer}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            workoutHistory={workouts}
            todayWorkout={todayWorkout}
            onCopyWorkoutToToday={handleCopyWorkoutToToday}
            onDeleteWorkout={handleDeleteWorkout}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            workoutHistory={workouts}
            todayWorkout={todayWorkout}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            workoutHistory={workouts}
            todayWorkout={todayWorkout}
            onUpdateSettings={handleUpdateSettings}
            onRestoreData={handleRestoreData}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </main>

      {/* Floating Rest Timer Bar (if active) */}
      {isRestTimerActive && (
        <RestTimerBar
          initialSeconds={settings.defaultRestSeconds}
          soundEnabled={settings.soundEnabled}
          soundVolume={settings.soundVolume}
          soundType={settings.soundType}
          vibrationEnabled={settings.vibrationEnabled}
          onDismiss={() => setIsRestTimerActive(false)}
          triggerKey={restTimerTriggerKey}
        />
      )}

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={isPlateCalcOpen}
        onClose={() => {
          setIsPlateCalcOpen(false);
          setPlateCalcApplyCallback(null);
        }}
        initialWeight={plateCalcTargetWeight}
        barWeight={settings.barWeight}
        plates={settings.plates}
        presets={settings.presets}
        activePresetId={settings.activePresetId}
        onSelectPreset={handleSelectPreset}
        onApplyWeight={plateCalcApplyCallback || undefined}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Fixed Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D12]/95 backdrop-blur-lg border-t border-[#262D3D] pb-safe">
        <div className="max-w-xl mx-auto grid grid-cols-4 h-16 items-center px-2">
          {/* Tab 1: 오늘 */}
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors active:scale-95 ${
              activeTab === 'today' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Dumbbell size={20} strokeWidth={activeTab === 'today' ? 2.5 : 2} />
            <span className="text-[11px] font-medium tracking-tight mt-1">오늘</span>
          </button>

          {/* Tab 2: 달력 */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors active:scale-95 ${
              activeTab === 'calendar' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CalendarIcon size={20} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
            <span className="text-[11px] font-medium tracking-tight mt-1">달력</span>
          </button>

          {/* Tab 3: 기록 */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors active:scale-95 ${
              activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[11px] font-medium tracking-tight mt-1">기록</span>
          </button>

          {/* Tab 4: 설정 */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors active:scale-95 ${
              activeTab === 'settings' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[11px] font-medium tracking-tight mt-1">설정</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
