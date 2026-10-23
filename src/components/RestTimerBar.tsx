import React, { useEffect, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Volume2, Plus, Minus, Bell } from 'lucide-react';
import { playTimerDoneSound, triggerVibration } from '../utils/audio';
import { SoundType } from '../types/workout';

interface RestTimerBarProps {
  initialSeconds?: number;
  soundEnabled: boolean;
  soundVolume?: number;
  soundType?: SoundType;
  vibrationEnabled: boolean;
  onDismiss: () => void;
  triggerKey?: number; // whenever this changes, timer resets and starts automatically
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  initialSeconds = 90,
  soundEnabled,
  soundVolume = 0.8,
  soundType = 'gym_beep',
  vibrationEnabled,
  onDismiss,
  triggerKey
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // When triggerKey changes (e.g. user checked a set), restart timer immediately
  useEffect(() => {
    if (triggerKey !== undefined) {
      setRemainingSeconds(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true);
      setIsCompleted(false);
    }
  }, [triggerKey, initialSeconds]);

  // Main countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playTimerDoneSound(soundEnabled, soundVolume, soundType);
            triggerVibration(vibrationEnabled, [200, 100, 200, 100, 300]);
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

  const handlePresetSelect = (sec: number) => {
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handleAdjustTime = (delta: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + delta));
    setTotalSeconds((prev) => Math.max(0, prev + delta));
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

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl border transition-all ${
            isCompleted
              ? 'bg-amber-500 text-black border-amber-400 font-bold animate-pulse'
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
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-amber-500 text-black animate-bounce'
                    : isRunning
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-[#1B202D] text-gray-400'
                }`}
              >
                {isCompleted ? <Bell size={20} /> : <Timer size={20} />}
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                    {formatTime(remainingSeconds)}
                  </span>
                  {isCompleted && (
                    <span className="text-xs font-bold text-amber-400 animate-pulse">
                      휴식 완료! 세트 시작
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span>목표 {totalSeconds}초</span>
                  <span>·</span>
                  <span className="text-gray-400">
                    {soundEnabled ? '소리 ON' : '소리 OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustTime(-15)}
                className="w-8 h-8 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all text-xs"
                title="-15초"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => handleAdjustTime(+15)}
                className="w-8 h-8 rounded-lg bg-[#1B202D] hover:bg-[#252B3D] text-gray-300 flex items-center justify-center border border-[#262D3D] active:scale-95 transition-all text-xs"
                title="+15초"
              >
                <Plus size={14} />
              </button>

              {isCompleted ? (
                <button
                  onClick={handleRestart}
                  className="px-3 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
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
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#262D3D]/60 overflow-x-auto">
            <span className="text-[11px] text-gray-400 shrink-0 mr-1">휴식:</span>
            {[45, 60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                onClick={() => handlePresetSelect(sec)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all shrink-0 ${
                  totalSeconds === sec && !isCompleted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-[#1B202D] text-gray-400 border-[#262D3D] hover:text-gray-200'
                }`}
              >
                {sec >= 60 ? `${sec / 60}분` : `${sec}초`}
              </button>
            ))}

            <button
              onClick={() => setIsMinimized(true)}
              className="ml-auto text-[11px] text-gray-400 hover:text-gray-200 px-2 py-1"
            >
              최소화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
