import React, { useState } from 'react';
import { 
  Plus, Check, Trash2, ArrowUpDown, Scale, Flame, Trophy, Zap, 
  RotateCcw, FolderOpen, Calendar, Sparkles, CheckCheck, FileText
} from 'lucide-react';
import { DailyWorkout, WorkoutExercise, WorkoutSet, PRType, RoutineTemplate } from '../types/workout';
import { evaluateSetPR } from '../utils/prEngine';
import { playSetCompleteSound } from '../utils/audio';
import { AiRoutineImportModal } from './AiRoutineImportModal';

interface TodayTabProps {
  todayWorkout: DailyWorkout;
  workoutHistory: DailyWorkout[];
  exerciseList: string[];
  templates: RoutineTemplate[];
  soundEnabled: boolean;
  soundVolume?: number;
  vibrationEnabled: boolean;
  onUpdateWorkout: (workout: DailyWorkout) => void;
  onRegisterExercise: (name: string) => void;
  onRegisterExercises: (names: string[]) => void;
  onDeleteMasterExercise?: (name: string) => void;
  onSaveTemplate: (template: RoutineTemplate) => void;
  onOpenPlateCalc: (weight: number, onApply: (w: number) => void) => void;
  onTriggerRestTimer: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  todayWorkout,
  workoutHistory,
  exerciseList,
  templates,
  soundEnabled,
  soundVolume = 1.0,
  vibrationEnabled,
  onUpdateWorkout,
  onRegisterExercise,
  onRegisterExercises,
  onDeleteMasterExercise,
  onSaveTemplate,
  onOpenPlateCalc,
  onTriggerRestTimer
}) => {
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [newExerciseSearch, setNewExerciseSearch] = useState('');
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [isLoadHistoryModalOpen, setIsLoadHistoryModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Calculate statistics
  const totalCompletedSets = todayWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );
  const totalSets = todayWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const totalVolume = todayWorkout.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((sAcc, s) => {
      if (s.completed) {
        const w = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
        const r = s.actualReps !== undefined ? s.actualReps : s.targetReps;
        return sAcc + (w * r);
      }
      return sAcc;
    }, 0);
  }, 0);

  // All PRs achieved today
  const allAchievedPRs: { exerciseName: string; weight: number; reps: number; types: PRType[] }[] = [];
  todayWorkout.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      if (s.completed && s.prTypes && s.prTypes.length > 0) {
        allAchievedPRs.push({
          exerciseName: ex.exerciseName,
          weight: s.actualWeight || s.targetWeight,
          reps: s.actualReps || s.targetReps,
          types: s.prTypes
        });
      }
    });
  });

  // Handle Set Update
  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    const updatedExercises = todayWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;

      const updatedSets = ex.sets.map(set => {
        if (set.id !== setId) return set;

        const newSet = { ...set, ...updates };

        // If completion was toggled to true, evaluate PRs and trigger rest timer (sound only, vibration reserved for rest timer completion)
        if (updates.completed === true && !set.completed) {
          playSetCompleteSound(soundEnabled, soundVolume);
          onTriggerRestTimer();

          const targetW = newSet.actualWeight !== undefined ? newSet.actualWeight : newSet.targetWeight;
          const targetR = newSet.actualReps !== undefined ? newSet.actualReps : newSet.targetReps;

          const prTypes = evaluateSetPR(
            ex.exerciseName,
            targetW,
            targetR,
            workoutHistory,
            ex,
            todayWorkout.date
          );
          newSet.prTypes = prTypes;
        } else if (updates.completed === false) {
          newSet.prTypes = [];
        }

        return newSet;
      });

      return { ...ex, sets: updatedSets };
    });

    onUpdateWorkout({
      ...todayWorkout,
      exercises: updatedExercises,
      totalVolume
    });
  };

  // Add Set to an Exercise
  const handleAddSet = (exerciseId: string) => {
    const updatedExercises = todayWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSetNumber = ex.sets.length + 1;
      const newSet: WorkoutSet = {
        id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        setNumber: newSetNumber,
        targetWeight: lastSet ? lastSet.targetWeight : 60,
        targetReps: lastSet ? lastSet.targetReps : 10,
        completed: false
      };
      return { ...ex, sets: [...ex.sets, newSet] };
    });

    onUpdateWorkout({ ...todayWorkout, exercises: updatedExercises });
  };

  // Delete Set from Exercise
  const handleDeleteSet = (exerciseId: string, setId: string) => {
    const updatedExercises = todayWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const remainingSets = ex.sets
        .filter(s => s.id !== setId)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return { ...ex, sets: remainingSets };
    });
    onUpdateWorkout({ ...todayWorkout, exercises: updatedExercises });
  };

  // Add Exercise to Workout
  const handleAddExercise = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    onRegisterExercise(trimmed);

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      exerciseName: trimmed,
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, targetWeight: 60, targetReps: 10, completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, targetWeight: 60, targetReps: 10, completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, targetWeight: 60, targetReps: 10, completed: false }
      ]
    };

    onUpdateWorkout({
      ...todayWorkout,
      exercises: [...todayWorkout.exercises, newEx]
    });

    setIsAddExerciseModalOpen(false);
    setNewExerciseSearch('');
  };

  // Remove Exercise
  const handleRemoveExercise = (exerciseId: string) => {
    const updated = todayWorkout.exercises.filter(ex => ex.id !== exerciseId);
    onUpdateWorkout({ ...todayWorkout, exercises: updated });
  };

  // Load Template Routine
  const handleApplyTemplate = (tmpl: RoutineTemplate) => {
    const exercises: WorkoutExercise[] = tmpl.exercises.map((item, idx) => ({
      id: `ex-${Date.now()}-${idx}`,
      exerciseName: item.exerciseName,
      sets: item.sets.map((s, sIdx) => ({
        id: `set-${Date.now()}-${idx}-${sIdx}`,
        setNumber: sIdx + 1,
        targetWeight: s.targetWeight,
        targetReps: s.targetReps,
        completed: false
      }))
    }));

    onUpdateWorkout({
      ...todayWorkout,
      title: tmpl.title,
      exercises,
      completed: false
    });
    setIsLoadTemplateModalOpen(false);
  };

  // Load Previous Workout Routine
  const handleApplyPastWorkout = (past: DailyWorkout) => {
    const exercises: WorkoutExercise[] = past.exercises.map((ex, exIdx) => ({
      id: `ex-${Date.now()}-${exIdx}`,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s, sIdx) => ({
        id: `set-${Date.now()}-${exIdx}-${sIdx}`,
        setNumber: sIdx + 1,
        targetWeight: s.actualWeight || s.targetWeight,
        targetReps: s.actualReps || s.targetReps,
        completed: false
      }))
    }));

    onUpdateWorkout({
      ...todayWorkout,
      title: `${past.title || '이전 루틴'} 복사본`,
      exercises,
      completed: false
    });
    setIsLoadHistoryModalOpen(false);
  };

  const filteredExercises = exerciseList.filter(name =>
    name.toLowerCase().includes(newExerciseSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-28">
      {/* Session Header Card */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 font-mono tracking-wider">
                TODAY WORKOUT
              </span>
              <span className="text-xs text-gray-400">· {todayWorkout.date}</span>
            </div>
            <input
              type="text"
              value={todayWorkout.title || ''}
              placeholder="오늘의 운동 루틴 제목 (예: 가슴 & 삼두)"
              onChange={(e) => onUpdateWorkout({ ...todayWorkout, title: e.target.value })}
              className="mt-1 text-lg sm:text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-[#262D3D] focus:border-amber-500 focus:outline-none w-full"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-400/10 hover:from-amber-500/35 hover:to-amber-400/25 border border-amber-500/50 text-xs font-bold text-amber-300 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              title="ChatGPT/Gemini 계획 텍스트 붙여넣기"
            >
              <Sparkles size={14} className="text-amber-400" />
              AI 루틴 가져오기
            </button>
            <button
              onClick={() => setIsLoadTemplateModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-xs font-medium text-gray-200 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <FolderOpen size={14} className="text-amber-400" />
              템플릿
            </button>
            <button
              onClick={() => setIsLoadHistoryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-xs font-medium text-gray-200 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Calendar size={14} className="text-lime-400" />
              이전 기록
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#262D3D]/60 text-center">
          <div className="bg-[#0B0D12]/60 p-2.5 rounded-xl border border-[#262D3D]/40">
            <div className="text-[11px] text-gray-400">완료 세트</div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
              <span className="text-lime-400">{totalCompletedSets}</span> / {totalSets}
            </div>
          </div>
          <div className="bg-[#0B0D12]/60 p-2.5 rounded-xl border border-[#262D3D]/40">
            <div className="text-[11px] text-gray-400">총 볼륨 (kg)</div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tabular-nums">
              {totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0B0D12]/60 p-2.5 rounded-xl border border-[#262D3D]/40">
            <div className="text-[11px] text-gray-400">달성한 PR</div>
            <div className="text-base sm:text-lg font-bold font-mono text-lime-400 tabular-nums">
              {allAchievedPRs.length}개
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      {todayWorkout.exercises.length === 0 ? (
        <div className="bg-[#141720] rounded-2xl p-8 border border-[#262D3D] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">오늘 예정된 운동이 없습니다</h4>
            <p className="text-xs text-gray-400 mt-1">
              템플릿을 불러오거나 새로운 운동을 추가하여 루틴을 시작해보세요!
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-400/10 hover:from-amber-500/35 border border-amber-500/50 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Sparkles size={14} className="text-amber-400" />
              AI 루틴 가져오기
            </button>
            <button
              onClick={() => setIsLoadTemplateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] text-xs font-semibold text-white border border-[#262D3D] flex items-center gap-1.5 transition-all"
            >
              <FolderOpen size={14} className="text-amber-400" />
              템플릿 로드
            </button>
            <button
              onClick={() => setIsAddExerciseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus size={16} />
              새 운동 추가
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {todayWorkout.exercises.map((exercise, exIndex) => (
            <div
              key={exercise.id}
              className="bg-[#141720] rounded-2xl border border-[#262D3D] shadow-md overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="px-4 py-3 bg-[#10121A] border-b border-[#262D3D] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[#1B202D] text-[11px] font-bold font-mono text-gray-400 flex items-center justify-center shrink-0">
                    {exIndex + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white truncate">
                    {exercise.exerciseName}
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
                    title="운동 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="p-3 sm:p-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 px-2 pb-1">
                  <div className="col-span-2 text-center">세트</div>
                  <div className="col-span-4 text-center">중량 (kg)</div>
                  <div className="col-span-4 text-center">반복 (회)</div>
                  <div className="col-span-2 text-center">완료</div>
                </div>

                {exercise.sets.map((set) => {
                  const currentWeight = set.actualWeight !== undefined ? set.actualWeight : set.targetWeight;
                  const currentReps = set.actualReps !== undefined ? set.actualReps : set.targetReps;

                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                        set.completed
                          ? 'bg-lime-500/5 border-lime-500/30'
                          : 'bg-[#1B202D]/60 border-[#262D3D]/60 hover:border-[#262D3D]'
                      }`}
                    >
                      {/* Set Number & PR Badge */}
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <span className="font-mono text-xs font-bold text-gray-300">
                          {set.setNumber}
                        </span>
                        {set.prTypes && set.prTypes.length > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {set.prTypes.includes('weight') && (
                              <span title="최고 무게 PR" className="text-amber-400">
                                <Trophy size={11} />
                              </span>
                            )}
                            {set.prTypes.includes('reps') && (
                              <span title="동일 무게 최다 반복 PR" className="text-orange-400">
                                <Flame size={11} />
                              </span>
                            )}
                            {set.prTypes.includes('volume') && (
                              <span title="역대 최고 볼륨 PR" className="text-lime-400">
                                <Zap size={11} />
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Weight Input + Plate Calc Button */}
                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={currentWeight || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdateSet(exercise.id, set.id, {
                              targetWeight: val,
                              actualWeight: val
                            });
                          }}
                          className={`w-full h-11 px-2.5 text-center font-mono font-bold text-sm rounded-lg border focus:outline-none focus:border-amber-500 tabular-nums ${
                            set.completed
                              ? 'bg-[#141720] border-lime-500/40 text-lime-300'
                              : 'bg-[#141720] border-[#262D3D] text-white'
                          }`}
                        />
                        {/* Plate Calc Trigger Button */}
                        <button
                          type="button"
                          onClick={() => {
                            onOpenPlateCalc(currentWeight, (newWeight) => {
                              handleUpdateSet(exercise.id, set.id, {
                                targetWeight: newWeight,
                                actualWeight: newWeight
                              });
                            });
                          }}
                          className="w-10 h-11 rounded-lg bg-[#141720] hover:bg-[#202534] border border-[#262D3D] flex items-center justify-center text-amber-400 active:scale-95 transition-all shrink-0"
                          title="원반 계산기 열기"
                        >
                          <Scale size={15} />
                        </button>
                      </div>

                      {/* Reps Input */}
                      <div className="col-span-4 flex items-center">
                        <input
                          type="number"
                          min="0"
                          value={currentReps || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleUpdateSet(exercise.id, set.id, {
                              targetReps: val,
                              actualReps: val
                            });
                          }}
                          className={`w-full h-11 px-2.5 text-center font-mono font-bold text-sm rounded-lg border focus:outline-none focus:border-amber-500 tabular-nums ${
                            set.completed
                              ? 'bg-[#141720] border-lime-500/40 text-lime-300'
                              : 'bg-[#141720] border-[#262D3D] text-white'
                          }`}
                        />
                      </div>

                      {/* Complete Checkbox & Delete */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateSet(exercise.id, set.id, {
                              completed: !set.completed,
                              completedAt: !set.completed ? new Date().toISOString() : undefined
                            });
                          }}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            set.completed
                              ? 'bg-lime-500 text-black shadow-md shadow-lime-500/20'
                              : 'bg-[#141720] text-gray-500 border border-[#262D3D] hover:border-gray-400'
                          }`}
                          aria-label={set.completed ? '완료 취소' : '세트 완료'}
                        >
                          <Check size={18} strokeWidth={set.completed ? 3 : 2} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Exercise Bottom Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleAddSet(exercise.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-xs font-medium text-gray-300 flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus size={13} className="text-amber-400" />
                    세트 추가
                  </button>

                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() => {
                        const lastSet = exercise.sets[exercise.sets.length - 1];
                        handleDeleteSet(exercise.id, lastSet.id);
                      }}
                      className="text-[11px] text-gray-400 hover:text-red-400 px-2 py-1 transition-colors"
                    >
                      마지막 세트 삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAddExerciseModalOpen(true)}
              className="w-full h-13 rounded-2xl bg-[#141720] hover:bg-[#1B202D] border-2 border-dashed border-[#262D3D] hover:border-amber-500/50 text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Plus size={18} className="text-amber-400" />
              운동 추가하기
            </button>

            {todayWorkout.exercises.length > 0 && (
              <button
                onClick={() => {
                  onUpdateWorkout({
                    ...todayWorkout,
                    completed: true,
                    completedAt: new Date().toISOString(),
                    totalVolume
                  });
                  setShowCompletionModal(true);
                }}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 active:scale-98 transition-all"
              >
                <CheckCheck size={20} />
                오늘 운동 세션 완료 ({totalCompletedSets}/{totalSets} 세트)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#141720] border border-[#262D3D] rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262D3D]">
              <h3 className="text-base font-bold text-white">운동 추가</h3>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                닫기
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={newExerciseSearch}
                onChange={(e) => setNewExerciseSearch(e.target.value)}
                placeholder="운동명 검색 또는 직접 입력 (예: Dumbbell Press)"
                className="w-full h-11 px-3.5 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newExerciseSearch.trim()) {
                    handleAddExercise(newExerciseSearch);
                  }
                }}
              />
            </div>

            {newExerciseSearch.trim() && !exerciseList.includes(newExerciseSearch.trim()) && (
              <button
                onClick={() => handleAddExercise(newExerciseSearch)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between hover:bg-amber-500/25 transition-colors"
              >
                <span>&quot;{newExerciseSearch.trim()}&quot; 새로 등록하고 추가</span>
                <Plus size={14} />
              </button>
            )}

            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
              <div className="text-[11px] font-semibold text-gray-400 mb-1">등록된 운동 목록</div>
              {filteredExercises.map((name) => (
                <div
                  key={name}
                  className="w-full p-2 sm:p-2.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-transparent hover:border-[#262D3D] transition-colors flex items-center justify-between gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => handleAddExercise(name)}
                    className="flex-1 text-left flex items-center justify-between min-w-0"
                  >
                    <span className="text-white text-xs font-medium truncate pr-2">{name}</span>
                    <span className="w-7 h-7 rounded-lg bg-[#141720] group-hover:bg-amber-500/20 group-hover:text-amber-400 flex items-center justify-center text-gray-400 transition-colors shrink-0">
                      <Plus size={14} />
                    </span>
                  </button>

                  {onDeleteMasterExercise && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${name}' 운동을 목록에서 삭제하시겠습니까?\n(기존에 저장된 과거 운동 기록은 안전하게 유지됩니다)`)) {
                          onDeleteMasterExercise(name);
                        }
                      }}
                      className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0 ml-1"
                      title="운동 목록에서 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {isLoadTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#141720] border border-[#262D3D] rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262D3D]">
              <h3 className="text-base font-bold text-white">루틴 템플릿 불러오기</h3>
              <button
                onClick={() => setIsLoadTemplateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                닫기
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {/* AI Import Banner inside Template Modal */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AI 운동 계획 텍스트 가져오기</div>
                    <div className="text-[11px] text-gray-400">ChatGPT, Gemini 응답을 바로 템플릿/루틴으로 변환</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsLoadTemplateModalOpen(false);
                    setIsAiModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 active:scale-95 transition-all"
                >
                  텍스트 붙여넣기
                </button>
              </div>

              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl bg-[#1B202D] border border-[#262D3D] space-y-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{tmpl.title}</h4>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold active:scale-95 transition-all"
                    >
                      불러오기
                    </button>
                  </div>
                  {tmpl.description && (
                    <p className="text-xs text-gray-400">{tmpl.description}</p>
                  )}
                  <div className="text-[11px] text-gray-400">
                    운동: {tmpl.exercises.map(e => e.exerciseName).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Load Past Workout Modal */}
      {isLoadHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#141720] border border-[#262D3D] rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262D3D]">
              <h3 className="text-base font-bold text-white">이전 날짜 기록 불러오기</h3>
              <button
                onClick={() => setIsLoadHistoryModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                닫기
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5">
              {workoutHistory.filter(w => w.date !== todayWorkout.date).length === 0 ? (
                <div className="text-xs text-gray-400 py-6 text-center">
                  불러올 수 있는 이전 완료 기록이 없습니다.
                </div>
              ) : (
                workoutHistory
                  .filter(w => w.date !== todayWorkout.date)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((past) => (
                    <div
                      key={past.date}
                      className="p-3.5 rounded-xl bg-[#1B202D] border border-[#262D3D] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{past.date}</div>
                        <div className="text-xs text-amber-400 font-medium">{past.title || '운동 세션'}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {past.exercises.length}개 운동 · {past.totalVolume?.toLocaleString() || 0}kg 볼륨
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyPastWorkout(past)}
                        className="px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold active:scale-95 transition-all shrink-0"
                      >
                        복사하기
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Celebration Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#141720] border border-lime-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center mx-auto animate-bounce">
              <Trophy size={32} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">오늘의 운동 완료!</h3>
              <p className="text-xs text-gray-400 mt-1">오늘 하루도 훌륭하게 완주하셨습니다.</p>
            </div>

            <div className="bg-[#1B202D] p-4 rounded-2xl border border-[#262D3D] text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">완료 세트:</span>
                <span className="font-bold text-white font-mono">{totalCompletedSets} 세트</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">오늘 총 볼륨:</span>
                <span className="font-bold text-amber-400 font-mono">{totalVolume.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">갱신한 PR:</span>
                <span className="font-bold text-lime-400 font-mono">{allAchievedPRs.length}개</span>
              </div>
            </div>

            <button
              onClick={() => setShowCompletionModal(false)}
              className="w-full h-12 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-sm active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* AI Routine Import Modal */}
      <AiRoutineImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyToToday={(exercises, title) => {
          onUpdateWorkout({
            ...todayWorkout,
            title: title || todayWorkout.title,
            exercises,
            completed: false
          });
        }}
        onSaveAsTemplate={(newTmpl) => {
          onSaveTemplate(newTmpl);
        }}
        onRegisterExercises={(names) => {
          onRegisterExercises(names);
        }}
      />
    </div>
  );
};
