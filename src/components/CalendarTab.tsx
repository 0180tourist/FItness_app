import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar as CalendarIcon, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { DailyWorkout } from '../types/workout';

interface CalendarTabProps {
  workoutHistory: DailyWorkout[];
  todayWorkout: DailyWorkout;
  onCopyWorkoutToToday: (workout: DailyWorkout) => void;
  onDeleteWorkout?: (date: string) => void;
  onSelectDateForEditing?: (date: string) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  workoutHistory,
  todayWorkout,
  onCopyWorkoutToToday,
  onDeleteWorkout
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Combine history + today workout into a lookup map
  const allWorkoutsMap: Record<string, DailyWorkout> = {};
  workoutHistory.forEach(w => {
    allWorkoutsMap[w.date] = w;
  });
  if (todayWorkout) {
    allWorkoutsMap[todayWorkout.date] = todayWorkout;
  }

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedWorkout = allWorkoutsMap[selectedDateStr];

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <div className="space-y-4 pb-28">
      {/* Calendar Header Card */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CalendarIcon size={18} />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              {year}년 {monthNames[month]}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div key={day} className={`py-1 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 rounded-xl" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const workout = allWorkoutsMap[dateStr];
            const isSelected = selectedDateStr === dateStr;
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;

            const isCompleted = workout && workout.completed;
            const hasExercises = workout && workout.exercises.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-12 sm:h-14 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : isToday
                    ? 'bg-[#1B202D] text-amber-400 border border-amber-500/40 font-bold'
                    : 'bg-[#1B202D]/50 text-gray-300 hover:bg-[#1B202D] border border-transparent'
                }`}
              >
                <span className="text-xs font-mono tabular-nums">{dayNum}</span>

                {/* Status Dot */}
                {hasExercises && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {isCompleted ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-lime-400'}`} />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-amber-400'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-[#262D3D]/60 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span>완료 기록</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>예정 / 진행 루틴</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details Card */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#262D3D]">
          <div>
            <div className="text-xs font-mono text-gray-400">선택된 날짜</div>
            <h4 className="text-base font-bold text-white font-mono mt-0.5">{selectedDateStr}</h4>
          </div>

          {selectedWorkout ? (
            <div className="flex items-center gap-2">
              {selectedWorkout.completed ? (
                <span className="text-xs font-semibold text-lime-400 flex items-center gap-1">
                  <CheckCircle2 size={15} />
                  완료됨
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <Clock size={15} />
                  예정 루틴
                </span>
              )}

              {onDeleteWorkout && (
                <button
                  onClick={() => {
                    if (confirm(`${selectedDateStr}의 운동 기록을 완전히 삭제하시겠습니까?`)) {
                      onDeleteWorkout(selectedDateStr);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-[#262D3D] hover:border-red-500/30 flex items-center gap-1 transition-all active:scale-95 ml-1"
                  title="이 날짜의 운동 기록 삭제"
                >
                  <Trash2 size={13} />
                  <span>기록 삭제</span>
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">운동 기록 없음</span>
          )}
        </div>

        {selectedWorkout && selectedWorkout.exercises.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-amber-400">
                {selectedWorkout.title || '운동 세션'}
              </h5>
              {selectedWorkout.totalVolume ? (
                <span className="text-xs font-mono text-gray-300">
                  총 볼륨: <strong className="text-white font-mono">{selectedWorkout.totalVolume.toLocaleString()}kg</strong>
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              {selectedWorkout.exercises.map((ex, exIdx) => (
                <div key={ex.id || exIdx} className="bg-[#1B202D] p-3 rounded-xl border border-[#262D3D]/80">
                  <div className="text-xs font-bold text-white mb-1.5">{ex.exerciseName}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.sets.map((s, sIdx) => {
                      const w = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
                      const r = s.actualReps !== undefined ? s.actualReps : s.targetReps;
                      return (
                        <span
                          key={s.id || sIdx}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                            s.completed
                              ? 'bg-lime-500/10 text-lime-300 border-lime-500/30'
                              : 'bg-[#141720] text-gray-400 border-[#262D3D]'
                          }`}
                        >
                          {s.setNumber}set: {w}kg × {r}회
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Action: Copy to Today */}
            <div className="pt-2">
              <button
                onClick={() => onCopyWorkoutToToday(selectedWorkout)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 active:scale-95 transition-all"
              >
                <span>이 날짜의 루틴을 오늘로 불러오기</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400 space-y-1">
            <p>이 날짜에는 등록된 운동 루틴이 없습니다.</p>
            <p className="text-[11px] text-gray-400">오늘 탭에서 운동을 기록하거나 달력에서 이전 기록을 탐색해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
