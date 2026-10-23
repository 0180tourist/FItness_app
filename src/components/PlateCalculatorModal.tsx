import React, { useState } from 'react';
import { X, Scale, AlertTriangle, CheckCircle2, ChevronRight, SlidersHorizontal, Layers } from 'lucide-react';
import { PlateInventoryItem, PlatePreset } from '../types/workout';
import { calculatePlates } from '../utils/plateCalculator';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  barWeight: number;
  plates: PlateInventoryItem[];
  presets?: PlatePreset[];
  activePresetId?: string;
  onSelectPreset?: (presetId: string) => void;
  onApplyWeight?: (weight: number) => void;
  onOpenSettings?: () => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeight = 60,
  barWeight,
  plates,
  presets = [],
  activePresetId,
  onSelectPreset,
  onApplyWeight,
  onOpenSettings
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);

  if (!isOpen) return null;

  const result = calculatePlates(targetWeight, barWeight, plates);

  const handleQuickAdd = (delta: number) => {
    setTargetWeight(prev => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  const plateHeightMap: Record<number, string> = {
    25: 'h-24',
    20: 'h-22',
    15: 'h-18',
    10: 'h-14',
    5: 'h-11',
    2.5: 'h-9',
    1.25: 'h-7'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#141720] border border-[#262D3D] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#262D3D] bg-[#10121A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">바벨 원반 추천 계산기</h3>
              <p className="text-xs text-gray-400">바 무게 {barWeight}kg 제외 후 양쪽 원반 계산</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Preset Selector inside Calculator */}
          {presets.length > 0 && onSelectPreset && (
            <div className="flex items-center gap-1.5 p-1 bg-[#10121A] rounded-xl border border-[#262D3D] overflow-x-auto">
              <span className="text-[11px] font-semibold text-gray-400 px-2 shrink-0 flex items-center gap-1">
                <Layers size={13} className="text-amber-400" />
                원반 프로필:
              </span>
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activePresetId === p.id
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Target Weight Input Section */}
          <div className="bg-[#1B202D] p-4 rounded-2xl border border-[#262D3D]/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300">목표 총 중량 (kg)</label>
              <span className="text-xs text-gray-400">
                (목표 {targetWeight} - 바 {barWeight}) ÷ 2 = <strong className="text-amber-400 font-mono">{Math.max(0, (targetWeight - barWeight) / 2)}kg</strong> / 한쪽
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.5"
                  min={barWeight}
                  value={targetWeight || ''}
                  onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-13 px-4 text-2xl font-bold font-mono text-white bg-[#0B0D12] border border-[#262D3D] rounded-xl focus:outline-none focus:border-amber-500 tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  kg
                </span>
              </div>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {[+1.25, +2.5, +5, +10, +20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="h-10 text-xs font-semibold font-mono text-gray-300 bg-[#141720] hover:bg-[#202636] border border-[#262D3D] rounded-lg active:scale-95 transition-all flex items-center justify-center"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-gray-400 shrink-0 mr-1">프리셋:</span>
              {[40, 60, 80, 100, 120, 140].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetWeight(preset)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs font-medium border transition-all shrink-0 ${
                    targetWeight === preset
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-[#141720] text-gray-400 border-[#262D3D] hover:text-white'
                  }`}
                >
                  {preset}kg
                </button>
              ))}
            </div>
          </div>

          {/* Barbell Visual Representation */}
          <div className="bg-[#0B0D12] p-4 rounded-2xl border border-[#262D3D] flex flex-col items-center">
            <span className="text-[11px] text-gray-400 font-medium mb-3">바벨 단면 그래픽 (한쪽 장착 모습)</span>
            
            {/* Visual Barbell Shaft & Collar */}
            <div className="w-full flex items-center justify-center min-h-[110px] relative px-2">
              {/* Center Bar Shaft */}
              <div className="w-16 h-3 bg-zinc-600 rounded-l-sm relative flex items-center justify-center">
                <span className="text-[9px] text-zinc-300 font-mono -top-5 absolute">바 {barWeight}kg</span>
              </div>
              
              {/* Collar (바벨 안쪽 걸림턱) */}
              <div className="w-3.5 h-14 bg-zinc-400 border border-zinc-300 rounded-sm shadow-sm z-10" />

              {/* Stacked Plates from inside to outside */}
              <div className="flex items-center gap-1 pl-1 pr-3">
                {result.platesPerSide.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 italic">
                    원반 없음 (빈 바만 사용)
                  </div>
                ) : (
                  result.platesPerSide.map((group, groupIdx) => (
                    <React.Fragment key={groupIdx}>
                      {Array.from({ length: group.count }).map((_, i) => (
                        <div
                          key={`${groupIdx}-${i}`}
                          style={{ backgroundColor: group.color }}
                          className={`w-5 sm:w-6 ${
                            plateHeightMap[group.weight] || 'h-16'
                          } rounded-sm border border-black/30 shadow-md flex items-center justify-center relative group transition-transform hover:scale-105`}
                        >
                          <span
                            className={`text-[9px] font-bold font-mono tracking-tighter ${
                              group.weight === 5 ? 'text-zinc-900' : 'text-white'
                            }`}
                            style={{ writingMode: 'vertical-rl' }}
                          >
                            {group.weight}
                          </span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </div>

              {/* Bar Sleeve Outer End */}
              <div className="w-8 h-3.5 bg-zinc-500 rounded-r-sm" />
            </div>

            <div className="w-full flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-[#262D3D]/50">
              <span>바벨 안쪽 (손잡이)</span>
              <span>바벨 바깥쪽 (끝)</span>
            </div>
          </div>

          {/* Result Status & Breakdown */}
          <div className="space-y-3">
            {/* Status Alert Banner */}
            {result.isExact ? (
              <div className="p-3.5 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-lime-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-lime-400">목표 무게와 정확히 일치합니다!</div>
                  <div className="text-lime-300/80 mt-0.5">
                    양쪽 각각 <strong className="font-mono text-lime-200">{result.perSideWeight}kg</strong>을 장착하여 총 <strong className="font-mono text-lime-200">{result.totalActualWeight}kg</strong> 구성
                  </div>
                </div>
              </div>
            ) : result.isImpossible ? (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-red-400">현재 활성화된 원반으로 목표 무게에 도달할 수 없습니다</div>
                  <div className="text-red-300/80 mt-0.5">
                    현재 프로필 최대 장착 가능 무게: <strong className="font-mono text-red-200">{result.totalActualWeight}kg</strong> (부족량: {result.differenceKg}kg)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-amber-400">
                    +{result.differenceKg}kg 초과 추천 (실제 {result.totalActualWeight}kg)
                  </div>
                  <div className="text-amber-300/80 mt-0.5">
                    정확한 조합이 없어 활성화된 원반 중 <strong>최소 초과 조합</strong>을 추천합니다.
                  </div>
                </div>
              </div>
            )}

            {/* Per-Side Plate Breakdown List */}
            <div className="bg-[#1B202D] p-3.5 rounded-xl border border-[#262D3D]">
              <div className="text-xs font-semibold text-gray-300 mb-2.5 flex items-center justify-between">
                <span>양쪽 각각 꽂을 원반 목록</span>
                <span className="font-mono text-amber-400 text-xs">한쪽 {result.perSideWeight}kg</span>
              </div>

              {result.platesPerSide.length === 0 ? (
                <div className="text-xs text-gray-400 py-1">원반을 꽂지 않고 빈 바({barWeight}kg)로 진행합니다.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {result.platesPerSide.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-[#141720] rounded-lg border border-[#262D3D]"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-black/20"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs font-bold text-white font-mono">{p.weight}kg</span>
                      <span className="text-xs text-amber-400 font-semibold ml-auto font-mono">× {p.count}장</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#262D3D] bg-[#10121A] flex items-center justify-between gap-3">
          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal size={14} />
              원반 재고 편집
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onApplyWeight ? (
              <button
                onClick={() => {
                  onApplyWeight(result.totalActualWeight);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                이 무게({result.totalActualWeight}kg) 세트에 적용
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] text-white font-semibold text-xs border border-[#262D3D] active:scale-95 transition-all"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
