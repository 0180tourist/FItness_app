import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Sparkles, ArrowRight, BookmarkPlus, 
  HelpCircle, AlertCircle, FileText 
} from 'lucide-react';
import { 
  parseAIRoutineText, ParsedExercise, AI_PROMPT_COPY_TEMPLATE, 
  SAMPLE_AI_ROUTINE_TEXT 
} from '../utils/aiRoutineParser';
import { WorkoutExercise, RoutineTemplate } from '../types/workout';

interface AiRoutineImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToToday: (exercises: WorkoutExercise[], routineTitle: string) => void;
  onSaveAsTemplate: (template: RoutineTemplate) => void;
  onRegisterExercises: (names: string[]) => void;
}

export const AiRoutineImportModal: React.FC<AiRoutineImportModalProps> = ({
  isOpen,
  onClose,
  onApplyToToday,
  onSaveAsTemplate,
  onRegisterExercises
}) => {
  const [inputText, setInputText] = useState(SAMPLE_AI_ROUTINE_TEXT);
  const [routineTitle, setRoutineTitle] = useState('AI 맞춤 추천 루틴');
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setParsedExercises(parseAIRoutineText(inputText));
    }
  }, [isOpen, inputText]);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_COPY_TEMPLATE);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
      alert('클립보드 복사 권한이 없어 수동 복사가 필요합니다.');
    }
  };

  const handleApplySample = () => {
    setInputText(SAMPLE_AI_ROUTINE_TEXT);
  };

  const totalSetsCount = parsedExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const convertToWorkoutExercises = (): WorkoutExercise[] => {
    return parsedExercises.map((pex, exIdx) => ({
      id: `ex-ai-${Date.now()}-${exIdx}`,
      exerciseName: pex.exerciseName,
      sets: pex.sets.map((s, sIdx) => ({
        id: `set-ai-${Date.now()}-${exIdx}-${sIdx}`,
        setNumber: s.setNumber,
        targetWeight: s.targetWeight,
        targetReps: s.targetReps,
        completed: false
      }))
    }));
  };

  const handleApplyToday = () => {
    if (parsedExercises.length === 0) return;
    const converted = convertToWorkoutExercises();
    onRegisterExercises(parsedExercises.map(e => e.exerciseName));
    onApplyToToday(converted, routineTitle);
    onClose();
  };

  const handleSaveTemplate = () => {
    if (parsedExercises.length === 0) return;
    const newTemplate: RoutineTemplate = {
      id: `tmpl-ai-${Date.now()}`,
      title: routineTitle || 'AI 루틴 템플릿',
      description: `AI 텍스트에서 파싱된 루틴 (${parsedExercises.length}개 운동)`,
      exercises: parsedExercises.map(pex => ({
        exerciseName: pex.exerciseName,
        sets: pex.sets.map(s => ({
          targetWeight: s.targetWeight,
          targetReps: s.targetReps
        }))
      }))
    };
    onRegisterExercises(parsedExercises.map(e => e.exerciseName));
    onSaveAsTemplate(newTemplate);
    setActionFeedback('템플릿으로 저장되었습니다!');
    setTimeout(() => {
      setActionFeedback(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#141720] border border-[#262D3D] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#262D3D] bg-[#10121A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI 운동 계획 텍스트 가져오기</h3>
              <p className="text-xs text-gray-400">ChatGPT, Gemini가 작성해준 계획을 루틴으로 변환</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Action Helper Bar */}
          <div className="p-3 rounded-2xl bg-[#1B202D] border border-[#262D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs text-gray-300 flex items-center gap-1.5">
              <FileText size={15} className="text-amber-400 shrink-0" />
              <span>추천 포맷: <strong className="font-mono text-white">Exercise Name, Set, Weight, Reps</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                  copiedPrompt
                    ? 'bg-lime-500 text-black border-lime-400'
                    : 'bg-[#141720] text-amber-400 hover:bg-[#202534] border-amber-500/40'
                }`}
              >
                {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPrompt ? '프롬프트 복사됨!' : '📋 AI 프롬프트 복사'}</span>
              </button>

              <button
                type="button"
                onClick={handleApplySample}
                className="px-2.5 py-1.5 rounded-xl bg-[#141720] hover:bg-[#202534] border border-[#262D3D] text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                예시 텍스트
              </button>
            </div>
          </div>

          {/* Routine Title Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              루틴 이름
            </label>
            <input
              type="text"
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder="예: 가슴 & 어깨 볼륨 루틴"
              className="w-full h-11 px-3.5 bg-[#0B0D12] border border-[#262D3D] rounded-xl text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Raw Text Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-300">
                AI 응답 텍스트 붙여넣기
              </label>
              <span className="text-[11px] text-gray-400">
                단위 없는 순수 숫자 및 한국어/단위 포함 텍스트 모두 호환
              </span>
            </div>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dumbbell Press, 1, 10, 10&#10;Dumbbell Press, 2, 10, 11&#10;Bench Press, 1, 60, 10"
              className="w-full p-3 font-mono text-xs bg-[#0B0D12] border border-[#262D3D] rounded-xl text-gray-200 focus:outline-none focus:border-amber-500 leading-relaxed tabular-nums"
            />
          </div>

          {/* Live Parsed Preview */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Check size={14} className="text-lime-400" />
                파싱된 루틴 미리보기
              </span>
              <span className="text-xs font-mono text-amber-400 font-semibold">
                {parsedExercises.length}개 운동 · 총 {totalSetsCount}세트 감지
              </span>
            </div>

            {parsedExercises.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#1B202D]/40 border border-[#262D3D] text-center text-xs text-gray-400">
                인식된 운동 데이터가 없습니다. 추천 형식(Exercise Name, Set, Weight, Reps)으로 입력해 주세요.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedExercises.map((ex, exIdx) => (
                  <div 
                    key={exIdx} 
                    className="p-3 rounded-xl bg-[#1B202D] border border-[#262D3D] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{ex.exerciseName}</span>
                      <span className="text-[11px] font-mono text-gray-400">{ex.sets.length}세트</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#141720] border border-[#262D3D] text-gray-300"
                        >
                          {s.setNumber}set: <strong className="text-amber-400">{s.targetWeight}kg</strong> × <strong className="text-lime-400">{s.targetReps}회</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[#262D3D] bg-[#10121A] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {actionFeedback && (
            <span className="text-xs font-bold text-lime-400 mr-auto">
              {actionFeedback}
            </span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={parsedExercises.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#1B202D] hover:bg-[#252B3D] text-gray-200 border border-[#262D3D] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
            >
              <BookmarkPlus size={15} className="text-amber-400" />
              템플릿으로 저장
            </button>

            <button
              type="button"
              onClick={handleApplyToday}
              disabled={parsedExercises.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40"
            >
              <span>오늘 루틴으로 적용</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
