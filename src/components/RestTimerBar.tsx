import React, { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Plus, Minus, Bell, SlidersHorizontal, Check } from 'lucide-react';
import { playTimerDoneSound, triggerVibration } from '../utils/audio';
import { SoundType } from '../types/workout';

export const REST_PRESET_SECONDS = [45, 60, 90, 120, 180] as const;

export function formatRestDurationLabel(sec: number): string {
  if (sec === 90) return '1.5분';
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60}분`;
  return `${sec}초`;
}

interface RestTimerBarProps {
  initialSeconds?: number;
  soundEnabled: boolean;
  soundVolume?: number;
  soundType?: SoundType;
  vibrationEnabled: boolean;
  onUpdateDefaultSeconds?: (seconds: number) => void;
  onDismiss: () => void;
  triggerKey?: number; // whenever this changes, timer resets to saved defaultRestSeconds and starts automatically
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  initialSeconds = 90,
  soundEnabled,
  soundVolume = 1.0,
  soundType = 'gym_beep',
  vibrationEnabled,
  onUpdateDefaultSeconds,
  onDismiss,
  triggerKey
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Inline custom seconds input state
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [customSecondsInput, setCustomSecondsInput] = useState<string>(String(initialSeconds));

  const prevTriggerKeyRef = useRef<number | undefined>(triggerKey);
  const prevInitialSecondsRef = useRef<number>(initialSeconds);

  // Sync timer when a new set is checked (triggerKey increments) OR when defaultRestSeconds changes externally
  useEffect(() => {
    const triggerChanged = triggerKey !== prevTriggerKeyRef.current;
    const defaultChanged = initialSeconds !== prevInitialSecondsRef.current;

    prevTriggerKeyRef.current = triggerKey;
    prevInitialSecondsRef.current = initialSeconds;

    if (triggerChanged) {
      setRemainingSeconds(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true);
      setIsCompleted(false);
      setIsCustomOpen(false);
    } else if (defaultChanged) {
      setRemainingSeconds(initialSeconds);
      setTotalSeconds(initialSeconds);
      setCustomSecondsInput(String(initialSeconds));
    }
  }, [triggerKey, initialSeconds]);

  // Main countdown loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playTimerDoneSound(soundEnabled, soundVolume, soundType);
            triggerVibration(vibrationEnabled);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, soundEnabled, soundVolume, soundType, vibrationEnabled]);

  // Selecting a preset persists as the new default rest duration AND restarts current timer
  const handlePresetSelect = (sec: number) => {
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
    setIsCompleted(false);
    setIsCustomOpen(false);
    setCustomSecondsInput(String(sec));
    onUpdateDefaultSeconds?.(sec);
  };

  // Submitting custom seconds persists as the new default rest duration AND restarts current timer
  const handleApplyCustomSeconds = () => {
    const parsed = parseInt(customSecondsInput, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    const clamped = Math.max(5, Math.min(900, parsed));
    setTotalSeconds(clamped);
    setRemainingSeconds(clamped);
    setIsRunning(true);
    setIsCompleted(false);
    setIsCustomOpen(false);
    setCustomSecondsInput(String(clamped));
    onUpdateDefaultSeconds?.(clamped);
  };

  // +/-15s buttons adjust ONLY the current set's timer without changing saved defaultRestSeconds
  const handleAdjustTime = (delta: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev + delta);
      if (next > 0 && isCompleted) {
        setIsCompleted(false);
        setIsRunning(true);
      }
      return next;
    });
    setTotalSeconds((prev) => Math.max(5, prev + delta));
  };

  const handleRestart = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);
    setIsCompleted(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCustomDefault = !(REST_PRESET_SECONDS as readonly number[]).includes(initialSeconds);
  const isTemporarilyAdjusted = totalSeconds !== initialSeconds;
  const progressPercent =
    totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full shadow-2xl border transition-all whitespace-nowrap shrink-0 ${
            isCompleted
              ? 'bg-amber-500 text-black border-amber-400 font-bold'
              : 'bg-[#141720] text-amber-400 border-amber-500/40'
          }`}
        >
          <Timer size={16} />
          <span className="font-mono text-sm tabular-nums font-bold">
            {isCompleted ? '휴식 완료!' : formatTime(remainingSeconds)}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-18 left-0 right-0 z-40 px-3 max-w-lg mx-auto animate-slide-up">
      <div
        className={`bg-[#141720] rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isCompleted ? 'border-amber-400 shadow-amber-500/10' : 'border-[#262D3D]'
        }`}
      >
        {/* Progress Bar Line */}
        <div className="w-full h-1 bg-[#1F2536] relative overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-amber-400' : 'bg-gradient-to-r from-amber-500 to-lime-400'
            }`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Timer Display */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isCompleted
                    ? 'bg-amber-500 text-black'
                    : isRunning
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-[#1B202D] text-gray-400'
                }`}
              >
                {isCompleted ? <Bell size={20} /> : <Timer size={20} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                    {formatTime(remainingSeconds)}
                  </span>
                  {isCompleted && (
                    <span className="text-xs font-bold text-amber-400 whitespace-nowrap">
                      휴식 완료! 세트 시작
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-mono tabular-nums truncate">
                  {isTemporarilyAdjusted ? (
                    <>
                      <span className="text-amber-300">이번 세트 {totalSeconds}초</span>
                      <span aria-hidden="true">·</span>
                      <span>기본 {formatRestDurationLabel(initialSeconds)} 유지</span>
                    </>
                  ) : (
                    <>
                      <span>기본 {formatRestDurationLabel(initialSeconds)} 유지</span>
                      <span aria-hidden="true">·</span>
                      <span>{soundEnabled ? '소리 ON' : '소리 OFF'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Controls (+/-15s apply to current set only) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleAdjustTime(-15)}
                className="w-9 h-9 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all text-xs"
                title="이번 세트만 -15초"
                aria-label="이번 세트만 15초 감소"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => handleAdjustTime(+15)}
                className="w-9 h-9 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all text-xs"
                title="이번 세트만 +15초"
                aria-label="이번 세트만 15초 추가"
              >
                <Plus size={14} />
              </button>

              {isCompleted ? (
                <button
                  onClick={handleRestart}
                  className="px-3 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all whitespace-nowrap shrink-0"
                >
                  <RotateCcw size={13} />
                  재시작
                </button>
              ) : (
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all font-bold ${
                    isRunning
                      ? 'bg-[#1B202D] text-amber-400 hover:bg-[#252B3D] border border-amber-500/30'
                      : 'bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/20'
                  }`}
                  aria-label={isRunning ? '일시정지' : '시작'}
                >
                  {isRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
              )}

              <button
                onClick={onDismiss}
                className="w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Preset & Custom Seconds Selector Row (Persists to defaultRestSeconds) */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#262D3D]/60 overflow-x-auto">
            <span className="text-[11px] text-gray-400 shrink-0 mr-0.5">기본 휴식:</span>
            {REST_PRESET_SECONDS.map((sec) => {
              const isSelectedDefault = initialSeconds === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handlePresetSelect(sec)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums font-semibold border transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                    isSelectedDefault
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                      : 'bg-[#1B202D] text-gray-400 border-[#262D3D] hover:text-gray-200'
                  }`}
                >
                  {formatRestDurationLabel(sec)}
                </button>
              );
            })}

            {/* Custom Seconds Trigger / Active Custom Badge */}
            <button
              type="button"
              onClick={() => {
                setCustomSecondsInput(String(initialSeconds));
                setIsCustomOpen((prev) => !prev);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums font-semibold border transition-all flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
                isCustomDefault || isCustomOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-[#1B202D] text-gray-400 border-[#262D3D] hover:text-gray-200'
              }`}
            >
              <SlidersHorizontal size={11} />
              <span>{isCustomDefault ? `${initialSeconds}초` : '직접 입력'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="ml-auto text-[11px] text-gray-400 hover:text-gray-200 px-2 py-1.5 whitespace-nowrap shrink-0"
            >
              최소화
            </button>
          </div>

          {/* Inline Custom Seconds Form */}
          {isCustomOpen && (
            <div className="mt-2.5 pt-2.5 border-t border-[#262D3D]/60 flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-gray-300 font-medium whitespace-nowrap shrink-0">
                초 직접 설정:
              </span>
              <div className="relative flex-1 max-w-[140px]">
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={900}
                  step={5}
                  placeholder="예: 70"
                  value={customSecondsInput}
                  onChange={(e) => setCustomSecondsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyCustomSeconds();
                    }
                  }}
                  autoFocus
                  className="w-full h-9 pl-3 pr-8 bg-[#0B0D12] border border-amber-500/60 rounded-lg text-white font-mono text-xs font-bold tabular-nums focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-mono">
                  초
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyCustomSeconds}
                className="h-9 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <Check size={13} strokeWidth={2.5} />
                유지 적용
              </button>
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="h-9 px-2.5 rounded-lg bg-[#1B202D] text-gray-400 hover:text-white text-xs whitespace-nowrap shrink-0"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
