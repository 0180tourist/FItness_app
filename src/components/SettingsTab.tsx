import React, { useState } from 'react';
import { 
  SlidersHorizontal, Scale, Volume2, VolumeX, Vibrate, Download, Upload, 
  RotateCcw, Plus, Trash2, Check, CheckCircle2, ShieldCheck, 
  Edit2, FolderPlus, Layers, Play 
} from 'lucide-react';
import { AppSettings, DailyWorkout, PlateInventoryItem, PlatePreset, SoundType } from '../types/workout';
import { getPlateColor } from '../utils/plateCalculator';
import { exportCSV, exportAppJSON } from '../utils/csvExport';
import { playTimerDoneSound, triggerVibration, SOUND_TYPE_LABELS } from '../utils/audio';

interface SettingsTabProps {
  settings: AppSettings;
  workoutHistory: DailyWorkout[];
  todayWorkout: DailyWorkout;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRestoreData: (workouts: DailyWorkout[], settings?: AppSettings) => void;
  onResetSeedData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  workoutHistory,
  todayWorkout,
  onUpdateSettings,
  onRestoreData,
  onResetSeedData
}) => {
  const [customPlateWeight, setCustomPlateWeight] = useState('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Preset management modal / prompt states
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isEditingPresetName, setIsEditingPresetName] = useState(false);
  const [editPresetNameVal, setEditPresetNameVal] = useState('');

  // Active preset
  const activePreset = settings.presets.find(p => p.id === settings.activePresetId) || settings.presets[0];
  const activePlates = activePreset ? activePreset.plates : settings.plates;

  // Helper to save updated active plates into presets array
  const updateActivePlates = (newPlates: PlateInventoryItem[]) => {
    const updatedPresets = settings.presets.map(p =>
      p.id === settings.activePresetId ? { ...p, plates: newPlates } : p
    );
    onUpdateSettings({
      ...settings,
      presets: updatedPresets,
      plates: newPlates
    });
  };

  // Switch Active Preset
  const handleSelectPreset = (presetId: string) => {
    const target = settings.presets.find(p => p.id === presetId);
    if (!target) return;
    onUpdateSettings({
      ...settings,
      activePresetId: presetId,
      plates: target.plates
    });
  };

  // Create New Preset
  const handleCreatePreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    const newPreset: PlatePreset = {
      id: `preset_${Date.now()}`,
      name,
      plates: [
        { weight: 20, pairs: 2, enabled: true, color: '#3B82F6' },
        { weight: 15, pairs: 1, enabled: true, color: '#EAB308' },
        { weight: 10, pairs: 2, enabled: true, color: '#10B981' },
        { weight: 5, pairs: 2, enabled: true, color: '#F3F4F6' },
        { weight: 2.5, pairs: 2, enabled: true, color: '#4B5563' },
        { weight: 1.25, pairs: 2, enabled: true, color: '#9CA3AF' }
      ]
    };
    const updatedPresets = [...settings.presets, newPreset];
    onUpdateSettings({
      ...settings,
      presets: updatedPresets,
      activePresetId: newPreset.id,
      plates: newPreset.plates
    });
    setNewPresetName('');
    setIsAddingPreset(false);
  };

  // Rename Current Preset
  const handleSaveRenamePreset = () => {
    const name = editPresetNameVal.trim();
    if (!name) return;
    const updatedPresets = settings.presets.map(p =>
      p.id === settings.activePresetId ? { ...p, name } : p
    );
    onUpdateSettings({
      ...settings,
      presets: updatedPresets
    });
    setIsEditingPresetName(false);
  };

  // Delete Current Preset
  const handleDeletePreset = () => {
    if (settings.presets.length <= 1) {
      alert('최소 1개 이상의 원반 프리셋이 유지되어야 합니다.');
      return;
    }
    if (!confirm(`'${activePreset.name}' 프리셋을 정말 삭제하시겠습니까?`)) return;

    const remaining = settings.presets.filter(p => p.id !== settings.activePresetId);
    onUpdateSettings({
      ...settings,
      presets: remaining,
      activePresetId: remaining[0].id,
      plates: remaining[0].plates
    });
  };

  // Toggle Plate Active/Disabled in Current Preset
  const handleTogglePlate = (weight: number) => {
    const updated = activePlates.map(p =>
      p.weight === weight ? { ...p, enabled: !p.enabled } : p
    );
    updateActivePlates(updated);
  };

  // Adjust Plate Pair Count
  const handleAdjustPairs = (weight: number, delta: number) => {
    const updated = activePlates.map(p => {
      if (p.weight === weight) {
        const nextPairs = Math.max(1, p.pairs + delta);
        return { ...p, pairs: nextPairs };
      }
      return p;
    });
    updateActivePlates(updated);
  };

  // Add Custom Plate to Current Preset
  const handleAddCustomPlate = () => {
    const w = parseFloat(customPlateWeight);
    if (!w || w <= 0) return;
    if (activePlates.some(p => p.weight === w)) {
      alert('현재 프리셋에 이미 등록된 원반 무게입니다.');
      return;
    }
    const newPlate: PlateInventoryItem = {
      weight: w,
      pairs: 1,
      enabled: true,
      color: getPlateColor(w)
    };
    const updated = [...activePlates, newPlate].sort((a, b) => b.weight - a.weight);
    updateActivePlates(updated);
    setCustomPlateWeight('');
  };

  // Delete ANY Plate from Current Preset (Zero restrictions!)
  const handleDeletePlate = (weight: number) => {
    const updated = activePlates.filter(p => p.weight !== weight);
    updateActivePlates(updated);
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    const all = [...workoutHistory];
    if (todayWorkout && todayWorkout.exercises.length > 0) {
      if (!all.some(w => w.date === todayWorkout.date)) {
        all.push(todayWorkout);
      }
    }
    const res = await exportCSV(all, settings.unit);
    if (res.success) {
      setExportFeedback(res.shared ? '공유 시트가 열렸습니다.' : 'CSV 파일이 다운로드되었습니다.');
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const all = [...workoutHistory];
    if (todayWorkout && todayWorkout.exercises.length > 0) {
      if (!all.some(w => w.date === todayWorkout.date)) {
        all.push(todayWorkout);
      }
    }
    exportAppJSON({
      workouts: all,
      settings,
      exportedAt: new Date().toISOString()
    });
    setExportFeedback('전체 백업 JSON 파일이 다운로드되었습니다.');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.workouts && Array.isArray(parsed.workouts)) {
          onRestoreData(parsed.workouts, parsed.settings);
          setExportFeedback('백업 파일로부터 정상 복원되었습니다!');
          setTimeout(() => setExportFeedback(null), 3500);
        } else {
          alert('유효하지 않은 백업 JSON 파일 형식입니다.');
        }
      } catch {
        alert('JSON 파싱 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Feedback Toast */}
      {exportFeedback && (
        <div className="fixed top-18 left-4 right-4 z-50 max-w-sm mx-auto p-3.5 rounded-xl bg-lime-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 size={16} />
          {exportFeedback}
        </div>
      )}

      {/* 1. Barbell Settings (Direct Custom Numeric Input) */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Scale size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">기본 바벨 바(Bar) 무게</h3>
            <p className="text-xs text-gray-400">원반 계산 시 제외할 바 자체 무게 (사용자 직접 입력 가능)</p>
          </div>
        </div>

        {/* Numeric Input & Quick Chips */}
        <div className="bg-[#1B202D] p-3.5 rounded-xl border border-[#262D3D] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.5"
                min="0"
                value={settings.barWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ ...settings, barWeight: isNaN(val) ? 0 : val });
                }}
                className="w-full h-12 px-3.5 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-amber-500 tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                kg
              </span>
            </div>

            {/* Quick +/- buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, barWeight: Math.max(0, settings.barWeight - 1) })}
                className="w-10 h-12 rounded-xl bg-[#141720] hover:bg-[#202534] border border-[#262D3D] text-gray-200 font-bold active:scale-95 transition-all"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, barWeight: settings.barWeight + 1 })}
                className="w-10 h-12 rounded-xl bg-[#141720] hover:bg-[#202534] border border-[#262D3D] text-gray-200 font-bold active:scale-95 transition-all"
              >
                +1
              </button>
            </div>
          </div>

          {/* Rapid Presets Chips */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs">
            <span className="text-[11px] text-gray-400 shrink-0">빠른 선택:</span>
            {[20, 15, 10, 8, 5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, barWeight: w })}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all ${
                  settings.barWeight === w
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-[#141720] text-gray-400 border-[#262D3D] hover:text-white'
                }`}
              >
                {w}kg {w === 20 ? '(올림픽)' : w === 15 ? '(여성용)' : w === 10 ? '(이지바)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Custom Plate Presets Management (내집 무게, 헬스장 등 사용자 직접 추가) */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">커스텀 원반 프리셋 프로필</h3>
              <p className="text-xs text-gray-400">장소별(내집, 헬스장 등)로 보유 원반을 직접 등록하고 전환하세요.</p>
            </div>
          </div>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {settings.presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 active:scale-95 ${
                settings.activePresetId === preset.id
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/15'
                  : 'bg-[#1B202D] text-gray-300 border-[#262D3D] hover:text-white'
              }`}
            >
              {preset.name}
            </button>
          ))}

          <button
            onClick={() => setIsAddingPreset(true)}
            className="px-3 py-2 rounded-xl bg-[#141720] hover:bg-[#202534] border border-dashed border-[#262D3D] hover:border-amber-500/50 text-xs font-semibold text-gray-400 hover:text-amber-400 flex items-center gap-1 shrink-0 transition-colors"
          >
            <Plus size={14} />
            새 프리셋 추가
          </button>
        </div>

        {/* Add Preset Inline Form */}
        {isAddingPreset && (
          <div className="p-3.5 rounded-xl bg-[#1B202D] border border-amber-500/40 space-y-2.5 animate-fade-in">
            <div className="text-xs font-bold text-white">새 원반 프리셋 등록</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="프리셋 이름 (예: 내집 무게, 헬스장 B)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 h-10 px-3 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <button
                onClick={handleCreatePreset}
                disabled={!newPresetName.trim()}
                className="h-10 px-4 rounded-xl bg-amber-500 text-black text-xs font-bold disabled:opacity-40"
              >
                저장
              </button>
              <button
                onClick={() => setIsAddingPreset(false)}
                className="h-10 px-3 rounded-xl bg-[#141720] text-gray-400 hover:text-white text-xs"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Active Preset Header (Rename & Delete options) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1B202D] border border-[#262D3D]">
          <div className="flex items-center gap-2">
            {isEditingPresetName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editPresetNameVal}
                  onChange={(e) => setEditPresetNameVal(e.target.value)}
                  className="h-8 px-2.5 bg-[#0B0D12] border border-amber-500 rounded-lg text-xs font-bold text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRenamePreset}
                  className="px-2.5 h-8 bg-amber-500 text-black text-xs font-bold rounded-lg"
                >
                  확인
                </button>
                <button
                  onClick={() => setIsEditingPresetName(false)}
                  className="px-2 h-8 text-xs text-gray-400"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs font-bold text-white">{activePreset.name}</span>
                <button
                  onClick={() => {
                    setEditPresetNameVal(activePreset.name);
                    setIsEditingPresetName(true);
                  }}
                  className="text-gray-400 hover:text-white p-1"
                  title="프리셋 이름 변경"
                >
                  <Edit2 size={13} />
                </button>
              </>
            )}
          </div>

          {settings.presets.length > 1 && (
            <button
              onClick={handleDeletePreset}
              className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              프리셋 삭제
            </button>
          )}
        </div>

        {/* Active Plates List (Unrestricted deletion & strict exclusion) */}
        <div className="space-y-2">
          {activePlates.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#1B202D]/40 border border-[#262D3D] text-center text-xs text-gray-400">
              등록된 원반이 없습니다. 아래에서 원반 무게를 추가하세요.
            </div>
          ) : (
            activePlates.map((plate) => (
              <div
                key={plate.weight}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  plate.enabled
                    ? 'bg-[#1B202D] border-[#262D3D]'
                    : 'bg-[#141720]/40 border-transparent opacity-45'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={plate.enabled}
                    onChange={() => handleTogglePlate(plate.weight)}
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                    title={plate.enabled ? '체크해제 시 계산에서 완전 제외' : '클릭하여 계산에 포함'}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/30"
                    style={{ backgroundColor: plate.color }}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm text-white">
                      {plate.weight}kg 원반
                    </span>
                    {!plate.enabled && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        체크해제됨 (계산 시 완전 제외)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    {plate.pairs}쌍 (양쪽 {plate.pairs}장)
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustPairs(plate.weight, -1)}
                      disabled={!plate.enabled}
                      className="w-7 h-7 rounded-lg bg-[#141720] hover:bg-[#202534] text-gray-300 flex items-center justify-center border border-[#262D3D] text-xs font-bold disabled:opacity-30"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustPairs(plate.weight, +1)}
                      disabled={!plate.enabled}
                      className="w-7 h-7 rounded-lg bg-[#141720] hover:bg-[#202534] text-gray-300 flex items-center justify-center border border-[#262D3D] text-xs font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  {/* Any plate can now be deleted freely! */}
                  <button
                    onClick={() => handleDeletePlate(plate.weight)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    title="원반 완전 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Custom Plate Input to current preset */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            step="0.25"
            placeholder="새 원반 무게 (예: 20, 15, 12.5, 0.5kg)"
            value={customPlateWeight}
            onChange={(e) => setCustomPlateWeight(e.target.value)}
            className="flex-1 h-11 px-3.5 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAddCustomPlate}
            className="h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus size={16} />
            원반 추가
          </button>
        </div>
      </div>

      {/* 3. Audio & Vibration Alert Settings */}
      {/* 3. Audio & Vibration Alert Settings */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Volume2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">휴식 타이머 알림음 & 진동</h3>
              <p className="text-xs text-gray-400">알림음 종류, 음량 크기 및 햅틱 진동 조절</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Main Sound Toggle & Test */}
          <div className="p-3.5 rounded-xl bg-[#1B202D] border border-[#262D3D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 size={18} className="text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">완료 알림음 사용</span>
                <span className="text-[11px] text-gray-400">휴식 타이머 만료 시 오디오 재생</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => playTimerDoneSound(true, settings.soundVolume, settings.soundType)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-200 bg-[#141720] hover:text-white hover:bg-[#202534] border border-[#262D3D] rounded-lg active:scale-95 transition-all"
              >
                소리 테스트
              </button>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Sound Controls (Volume Slider & Sound Tone Options) */}
          {settings.soundEnabled && (
            <div className="p-4 rounded-xl bg-[#1B202D] border border-[#262D3D] space-y-4 animate-fade-in">
              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    {settings.soundVolume === 0 ? <VolumeX size={15} className="text-gray-400" /> : <Volume2 size={15} className="text-amber-400" />}
                    <span>알림음 크기 (볼륨)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      onUpdateSettings({ ...settings, soundVolume: vol });
                    }}
                    onMouseUp={() => playTimerDoneSound(true, settings.soundVolume, settings.soundType)}
                    onTouchEnd={() => playTimerDoneSound(true, settings.soundVolume, settings.soundType)}
                    className="w-full h-2 bg-[#0B0D12] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Quick Volume Preset Chips */}
                <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-xs">
                  <span className="text-[11px] text-gray-400 shrink-0">빠른 설정:</span>
                  {[
                    { label: '30% (조용히)', val: 0.3 },
                    { label: '60% (보통)', val: 0.6 },
                    { label: '80% (헬스장)', val: 0.8 },
                    { label: '100% (최대)', val: 1.0 }
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ ...settings, soundVolume: p.val });
                        playTimerDoneSound(true, p.val, settings.soundType);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                        Math.abs(settings.soundVolume - p.val) < 0.05
                          ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm'
                          : 'bg-[#141720] text-gray-400 border-[#262D3D] hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Tone Preset Cards */}
              <div className="pt-2 border-t border-[#262D3D]/60 space-y-2">
                <label className="text-xs font-semibold text-gray-300 block">
                  알림음 종류 선택
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(SOUND_TYPE_LABELS) as SoundType[]).map((type) => {
                    const info = SOUND_TYPE_LABELS[type];
                    const isSelected = settings.soundType === type;

                    return (
                      <div
                        key={type}
                        onClick={() => {
                          onUpdateSettings({ ...settings, soundType: type });
                          playTimerDoneSound(true, settings.soundVolume, type);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                            : 'bg-[#141720] border-[#262D3D] hover:border-gray-500'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                              {info.name}
                            </span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{info.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateSettings({ ...settings, soundType: type });
                            playTimerDoneSound(true, settings.soundVolume, type);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500 text-black border-amber-400'
                              : 'bg-[#1B202D] text-gray-300 border-[#262D3D] hover:text-white'
                          }`}
                          title="미리듣기"
                        >
                          <Play size={12} className="ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Vibration Settings */}
          <div className="p-3.5 rounded-xl bg-[#1B202D] border border-[#262D3D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Vibrate size={18} className="text-lime-400" />
              <div>
                <span className="text-xs font-bold text-white block">완료 햅틱 진동</span>
                <span className="text-[11px] text-gray-400">모바일 기기 3단 진동 패턴 피드백</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => triggerVibration(true)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-200 bg-[#141720] hover:text-white hover:bg-[#202534] border border-[#262D3D] rounded-lg active:scale-95 transition-all"
              >
                진동 테스트
              </button>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-lime-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Export & Backup */}
      <div className="bg-[#141720] rounded-2xl p-4 sm:p-5 border border-[#262D3D] shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Download size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">데이터 내보내기 & 백업</h3>
            <p className="text-xs text-gray-400">CSV 스프레드시트 공유 및 전체 JSON 데이터 복원</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="p-3.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-left flex items-start gap-3 active:scale-98 transition-all"
          >
            <Download size={18} className="text-lime-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">CSV 내보내기</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                date, exercise, set_no, weight, reps, volume 컬럼 규격 공유
              </div>
            </div>
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="p-3.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-left flex items-start gap-3 active:scale-98 transition-all"
          >
            <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">JSON 전체 백업</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                모든 세션 기록, 커스텀 프리셋 및 설정 정보를 파일로 저장
              </div>
            </div>
          </button>
        </div>

        {/* JSON Import & Reset */}
        <div className="pt-2 border-t border-[#262D3D]/60 flex items-center justify-between gap-3">
          <label className="px-3.5 py-2 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] border border-[#262D3D] text-xs font-medium text-gray-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
            <Upload size={14} className="text-amber-400" />
            <span>JSON 백업 복원</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('샘플 데이터(기본 벤치/스쿼트/데드 기록 및 프리셋)로 복구하시겠습니까?')) {
                onResetSeedData();
              }
            }}
            className="px-3 py-2 text-xs text-gray-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={13} />
            샘플 데이터 리셋
          </button>
        </div>
      </div>
    </div>
  );
};
