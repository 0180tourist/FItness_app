import React, { useState } from 'react';
import { Search, Trophy, Flame, Zap, Dumbbell, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { DailyWorkout } from '../types/workout';
import { buildExercisePRSummaries, ExercisePRSummary } from '../utils/prEngine';

interface HistoryTabProps {
  workoutHistory: DailyWorkout[];
  todayWorkout: DailyWorkout;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  workoutHistory,
  todayWorkout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);

  // Combine history + today
  const allWorkouts = [...workoutHistory];
  if (todayWorkout && todayWorkout.exercises.length > 0) {
    const existingIndex = allWorkouts.findIndex(w => w.date === todayWorkout.date);
    if (existingIndex >= 0) {
      allWorkouts[existingIndex] = todayWorkout;
    } else {
      allWorkouts.push(todayWorkout);
    }
  }

  const summaries = buildExercisePRSummaries(allWorkouts);
  const exerciseNames = Object.keys(summaries).sort((a, b) => {
    // Sort by recent session date descending
    return (summaries[b]?.lastSessionDate || '').localeCompare(summaries[a]?.lastSessionDate || '');
  });

  const filteredNames = exerciseNames.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If an exercise is selected, find all session occurrences
  const selectedSummary = selectedExerciseName ? summaries[selectedExerciseName] : null;

  const exerciseSessions: {
    date: string;
    workoutTitle: string;
    sets: { setNumber: number; weight: number; reps: number; completed: boolean }[];
    dayVolume: number;
  }[] = [];

  if (selectedExerciseName) {
    allWorkouts.forEach(day => {
      day.exercises.forEach(ex => {
        if (ex.exerciseName.trim().toLowerCase() === selectedExerciseName.trim().toLowerCase()) {
          let dayVol = 0;
          const setsData = ex.sets.map(s => {
            const w = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
            const r = s.actualReps !== undefined ? s.actualReps : s.targetReps;
            if (s.completed) dayVol += w * r;
            return {
              setNumber: s.setNumber,
              weight: w,
              reps: r,
              completed: s.completed
            };
          });

          exerciseSessions.push({
            date: day.date,
            workoutTitle: day.title || '운동 세션',
            sets: setsData,
            dayVolume: dayVol
          });
        }
      });
    });

    // Sort latest first
    exerciseSessions.sort((a, b) => b.date.localeCompare(a.date));
  }

  return (
    <div className="space-y-4 pb-28">
      {/* If viewing detailed exercise view */}
      {selectedExerciseName && selectedSummary ? (
        <div className="space-y-4">
          {/* Header with Back button */}
          <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg">
            <button
              onClick={() => setSelectedExerciseName(null)}
              className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 mb-3 transition-colors"
            >
              <ArrowLeft size={16} />
              전체 운동 목록으로 돌아가기
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Dumbbell size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedExerciseName}</h3>
                <p className="text-xs text-gray-400">총 {selectedSummary.totalSessions}회 기록 수행</p>
              </div>
            </div>

            {/* PR Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[#262D3D]/60">
              <div className="bg-[#1B202D] p-3 rounded-xl border border-[#262D3D]">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                  <Trophy size={14} />
                  역대 최고 무게
                </div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {selectedSummary.maxWeight} <span className="text-xs text-gray-400">kg</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {selectedSummary.maxWeightDate || '기록일 없음'}
                </div>
              </div>

              <div className="bg-[#1B202D] p-3 rounded-xl border border-[#262D3D]">
                <div className="flex items-center gap-1.5 text-xs text-lime-400 font-semibold mb-1">
                  <Flame size={14} />
                  추정 1RM
                </div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {selectedSummary.estimated1RM} <span className="text-xs text-gray-400">kg</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Epley 공식 추정</div>
              </div>

              <div className="bg-[#1B202D] p-3 rounded-xl border border-[#262D3D] col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
                  <Zap size={14} />
                  하루 최고 볼륨
                </div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {selectedSummary.maxDailyVolume.toLocaleString()} <span className="text-xs text-gray-400">kg</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {selectedSummary.maxDailyVolumeDate || '기록일 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Sessions List */}
          <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              날짜별 수행 이력 ({exerciseSessions.length}건)
            </h4>

            <div className="space-y-3">
              {exerciseSessions.map((session, sIdx) => (
                <div key={sIdx} className="bg-[#1B202D] p-3.5 rounded-xl border border-[#262D3D] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-white">{session.date}</span>
                      <span className="text-xs text-gray-400 ml-2">· {session.workoutTitle}</span>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-semibold">
                      {session.dayVolume.toLocaleString()}kg 볼륨
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {session.sets.map((set, setIdx) => (
                      <span
                        key={setIdx}
                        className={`text-xs font-mono px-2 py-0.5 rounded-md border ${
                          set.completed
                            ? 'bg-lime-500/10 text-lime-300 border-lime-500/30 font-semibold'
                            : 'bg-[#141720] text-gray-400 border-[#262D3D]'
                        }`}
                      >
                        {set.setNumber}세트: {set.weight}kg × {set.reps}회
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Exercise Group List View */
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">운동별 기록 & PR 관리</h3>
                <p className="text-xs text-gray-400">운동명을 선택하여 역대 최고 무게와 히스토리를 확인하세요.</p>
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="운동명 검색..."
                className="w-full h-11 pl-10 pr-4 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Exercise Summaries Cards */}
          {filteredNames.length === 0 ? (
            <div className="bg-[#141720] rounded-2xl p-8 border border-[#262D3D] text-center text-xs text-gray-400">
              검색된 운동 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNames.map((name) => {
                const summary = summaries[name];
                return (
                  <div
                    key={name}
                    onClick={() => setSelectedExerciseName(name)}
                    className="bg-[#141720] hover:bg-[#1A1E2A] p-4 rounded-2xl border border-[#262D3D] cursor-pointer active:scale-99 transition-all flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{name}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>
                          최고: <strong className="text-amber-400">{summary.maxWeight}kg</strong>
                        </span>
                        <span>·</span>
                        <span>
                          추정 1RM: <strong className="text-lime-400">{summary.estimated1RM}kg</strong>
                        </span>
                        <span>·</span>
                        <span className="text-gray-400">{summary.totalSessions}회 완료</span>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-gray-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
