import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { SoundType } from '../types/workout';

/**
 * High-Output Audio & Native Haptic Feedback Utility
 * - Web Audio API synthesis with a DynamicsCompressor + Preamp master chain for loud, clear smartphone speaker output.
 * - Native Android hardware vibration via @capacitor/haptics with multi-pulse continuous burst on timer completion.
 */

let audioCtx: AudioContext | null = null;
let vibrationTimers: ReturnType<typeof setTimeout>[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Creates a loud, punchy master output bus using a preamp GainNode + DynamicsCompressorNode
 * so phone speakers project maximum clarity without digital clipping.
 */
function createLoudOutputBus(ctx: AudioContext, volume: number, boostFactor = 2.8): AudioNode {
  const clamped = Math.max(0.01, Math.min(1.0, volume));

  const preGain = ctx.createGain();
  preGain.gain.setValueAtTime(clamped * boostFactor, ctx.currentTime);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-12, ctx.currentTime);
  compressor.knee.setValueAtTime(6, ctx.currentTime);
  compressor.ratio.setValueAtTime(10, ctx.currentTime);
  compressor.attack.setValueAtTime(0.002, ctx.currentTime);
  compressor.release.setValueAtTime(0.14, ctx.currentTime);

  const ceilingGain = ctx.createGain();
  ceilingGain.gain.setValueAtTime(0.98, ctx.currentTime);

  preGain.connect(compressor);
  compressor.connect(ceilingGain);
  ceilingGain.connect(ctx.destination);

  return preGain;
}

export const SOUND_TYPE_LABELS: Record<SoundType, { name: string; desc: string }> = {
  gym_beep: {
    name: '체육관 비프 (Gym Beep)',
    desc: '소음이 있는 헬스장에서도 선명하게 뚫고 나오는 고출력 비프음'
  },
  chime: {
    name: '디지털 차임 (Digital Chime)',
    desc: '경쾌하고 또렷한 3단 상승 하모닉 멜로디 차임'
  },
  boxing_bell: {
    name: '복싱 라운드 벨 (Boxing Bell)',
    desc: '라운드 시작을 알리는 묵직하고 힘찬 메탈릭 링 공(Gong)'
  },
  soft_pulse: {
    name: '소프트 펄스 (Soft Pulse)',
    desc: '홈짐이나 이어폰 착용 시 귀가 편안하면서도 분명한 더블 펄스'
  }
};

/**
 * Plays completion alert tone according to chosen sound type and volume level (0.0 ~ 1.0)
 */
export function playTimerDoneSound(
  soundEnabled = true,
  volume = 1.0,
  soundType: SoundType = 'gym_beep'
): void {
  if (!soundEnabled || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bus = createLoudOutputBus(ctx, volume, 2.8);
    const now = ctx.currentTime;

    switch (soundType) {
      case 'gym_beep':
        playGymBeep(ctx, bus, now);
        break;
      case 'chime':
        playChime(ctx, bus, now);
        break;
      case 'boxing_bell':
        playBoxingBell(ctx, bus, now);
        break;
      case 'soft_pulse':
        playSoftPulse(ctx, bus, now);
        break;
      default:
        playGymBeep(ctx, bus, now);
        break;
    }
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}

/**
 * Helper to trigger a rich harmonic voice (primary waveform + bright overtone)
 */
function triggerHarmonicTone(
  ctx: AudioContext,
  destination: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  primaryType: OscillatorType,
  primaryGain: number,
  overtoneType: OscillatorType = 'square',
  overtoneGain = 0.28,
  overtoneRatio = 2
) {
  // Primary body oscillator
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = primaryType;
  osc1.frequency.setValueAtTime(freq, startTime);

  gain1.gain.setValueAtTime(0.0001, startTime);
  gain1.gain.linearRampToValueAtTime(primaryGain, startTime + 0.012);
  gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(gain1);
  gain1.connect(destination);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.02);

  // Upper harmonic presence oscillator for small smartphone speakers
  if (overtoneGain > 0) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = overtoneType;
    osc2.frequency.setValueAtTime(freq * overtoneRatio, startTime);

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.linearRampToValueAtTime(overtoneGain, startTime + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.85);

    osc2.connect(gain2);
    gain2.connect(destination);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.02);
  }
}

/**
 * 1. Gym Beep: High-clarity 3-burst athletic timer alarm (C6 -> C6 -> G6)
 */
function playGymBeep(ctx: AudioContext, bus: AudioNode, now: number) {
  triggerHarmonicTone(ctx, bus, 1046.5, now, 0.16, 'triangle', 0.85, 'square', 0.35, 1);
  triggerHarmonicTone(ctx, bus, 1046.5, now + 0.2, 0.16, 'triangle', 0.85, 'square', 0.35, 1);
  triggerHarmonicTone(ctx, bus, 1567.98, now + 0.4, 0.42, 'triangle', 0.95, 'square', 0.4, 1);
}

/**
 * 2. Digital Chime: Bright ascending major arpeggio (E5 -> G#5 -> C#6 / E6)
 */
function playChime(ctx: AudioContext, bus: AudioNode, now: number) {
  const notes = [659.25, 830.61, 1046.5, 1318.51];
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.11;
    const dur = idx === notes.length - 1 ? 0.55 : 0.32;
    triggerHarmonicTone(ctx, bus, freq, startTime, dur, 'triangle', 0.8, 'sine', 0.35, 2);
  });
}

/**
 * 3. Boxing Round Bell: Resonant metallic strike tuned for phone speaker projection
 */
function playBoxingBell(ctx: AudioContext, bus: AudioNode, now: number) {
  const partials = [
    { freq: 587.33, gain: 0.85, type: 'triangle' as OscillatorType, dur: 0.95 },
    { freq: 1118, gain: 0.6, type: 'sine' as OscillatorType, dur: 0.8 },
    { freq: 1695, gain: 0.45, type: 'triangle' as OscillatorType, dur: 0.65 },
    { freq: 2420, gain: 0.35, type: 'square' as OscillatorType, dur: 0.35 }
  ];

  // Double strike like a classic gym round bell
  [0, 0.28].forEach((offset, strikeIdx) => {
    const strikeScale = strikeIdx === 1 ? 1.0 : 0.9;
    const decayScale = strikeIdx === 1 ? 1.15 : 0.55;
    partials.forEach(({ freq, gain, type, dur }) => {
      triggerHarmonicTone(
        ctx,
        bus,
        freq,
        now + offset,
        dur * decayScale,
        type,
        gain * strikeScale,
        'sine',
        0,
        1
      );
    });
  });
}

/**
 * 4. Soft Pulse: Warm yet clearly audible double harmonic pulse
 */
function playSoftPulse(ctx: AudioContext, bus: AudioNode, now: number) {
  [523.25, 659.25].forEach((freq, idx) => {
    const startTime = now + idx * 0.18;
    triggerHarmonicTone(ctx, bus, freq, startTime, 0.38, 'sine', 0.75, 'triangle', 0.3, 2);
  });
}

/**
 * Crisp confirmation tone when checking off a set
 */
export function playSetCompleteSound(soundEnabled = true, volume = 1.0): void {
  if (!soundEnabled || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bus = createLoudOutputBus(ctx, volume, 1.8);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.13); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(bus);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}

/**
 * Strong continuous hardware haptic vibration for rest timer completion & settings test.
 * Uses @capacitor/haptics on Android/iOS APK for guaranteed motor activation, with Web Vibration fallback.
 */
export function triggerVibration(
  vibrationEnabled = true,
  pattern: number[] = [450, 130, 450, 130, 600]
): void {
  if (!vibrationEnabled) return;

  // Cancel any leftover scheduled pulses from an earlier burst
  vibrationTimers.forEach((t) => clearTimeout(t));
  vibrationTimers = [];

  if (Capacitor.isNativePlatform()) {
    // Strong 3-burst continuous hardware vibration (~1.76s total)
    const bursts = [
      { delay: 0, duration: 450 },
      { delay: 580, duration: 450 },
      { delay: 1160, duration: 600 }
    ];

    bursts.forEach(({ delay, duration }) => {
      if (delay === 0) {
        Haptics.vibrate({ duration }).catch((err) => {
          console.warn('Native Haptics vibrate failed:', err);
        });
      } else {
        const timerId = setTimeout(() => {
          Haptics.vibrate({ duration }).catch(() => {});
        }, delay);
        vibrationTimers.push(timerId);
      }
    });
    return;
  }

  // Fallback for regular mobile web browsers
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored if browser/device does not support vibration
    }
  }
}
