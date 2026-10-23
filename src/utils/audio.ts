import { SoundType } from '../types/workout';

/**
 * Audio & Haptic Feedback Utility
 * Uses Web Audio API oscillator synthesis so it functions 100% offline without external mp3 files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SOUND_TYPE_LABELS: Record<SoundType, { name: string; desc: string }> = {
  gym_beep: { name: '체육관 비프 (Gym Beep)', desc: '소음이 있는 헬스장에 적합한 고주파 더블 비프음' },
  chime: { name: '디지털 차임 (Digital Chime)', desc: '경쾌하고 깔끔한 3단 상승 멜로디 차임' },
  boxing_bell: { name: '복싱 라운드 벨 (Boxing Bell)', desc: '라운드 시작/종료를 알리는 묵직한 링 공(Gong)' },
  soft_pulse: { name: '소프트 펄스 (Soft Pulse)', desc: '홈짐이나 이어폰 착용 시 귀가 편안한 부드러운 톤' }
};

/**
 * Plays completion alert tone according to chosen sound type and volume level (0.0 ~ 1.0)
 */
export function playTimerDoneSound(
  soundEnabled = true,
  volume = 0.8,
  soundType: SoundType = 'gym_beep'
): void {
  if (!soundEnabled || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const clampedVolume = Math.max(0.01, Math.min(1.0, volume));
    const now = ctx.currentTime;

    switch (soundType) {
      case 'gym_beep':
        playGymBeep(ctx, now, clampedVolume);
        break;
      case 'chime':
        playChime(ctx, now, clampedVolume);
        break;
      case 'boxing_bell':
        playBoxingBell(ctx, now, clampedVolume);
        break;
      case 'soft_pulse':
        playSoftPulse(ctx, now, clampedVolume);
        break;
      default:
        playGymBeep(ctx, now, clampedVolume);
        break;
    }
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}

/**
 * 1. Gym Beep: 880Hz -> 1760Hz high clarity double beep
 */
function playGymBeep(ctx: AudioContext, now: number, vol: number) {
  // Beep 1 (A5 880Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.3 * vol, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.22);

  // Beep 2 (A6 1760Hz, higher pitch)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1760, now + 0.2);
  gain2.gain.setValueAtTime(0, now + 0.2);
  gain2.gain.linearRampToValueAtTime(0.35 * vol, now + 0.23);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.2);
  osc2.stop(now + 0.6);
}

/**
 * 2. Digital Chime: 3-note ascending major arpeggio C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
 */
function playChime(ctx: AudioContext, now: number, vol: number) {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35 * vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}

/**
 * 3. Boxing Round Bell: 440Hz with resonant metallic ring
 */
function playBoxingBell(ctx: AudioContext, now: number, vol: number) {
  const partials = [
    { freq: 440, gainMultiplier: 0.4 },
    { freq: 845, gainMultiplier: 0.25 },
    { freq: 1280, gainMultiplier: 0.15 },
    { freq: 1820, gainMultiplier: 0.1 }
  ];

  partials.forEach(({ freq, gainMultiplier }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainMultiplier * vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  });
}

/**
 * 4. Soft Pulse: Gentle warm double pulse
 */
function playSoftPulse(ctx: AudioContext, now: number, vol: number) {
  [440, 554.37].forEach((freq, idx) => {
    const startTime = now + idx * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25 * vol, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.35);
  });
}

/**
 * Subtle confirmation tone when completing a set
 */
export function playSetCompleteSound(soundEnabled = true, volume = 0.5): void {
  if (!soundEnabled || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

    const clampedVolume = Math.max(0.01, Math.min(1.0, volume));
    gain.gain.setValueAtTime(0.18 * clampedVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}

/**
 * Mobile haptic vibration with pattern fallback
 */
export function triggerVibration(vibrationEnabled = true, pattern: number[] = [150, 100, 200]): void {
  if (!vibrationEnabled) return;
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored if device does not support vibration
    }
  }
}
