import type { VoiceAlertPayload } from '../types/index.ts';

// In-memory set of spoken alert IDs to ensure 100% idempotency
const spokenAlertIds = new Set<string>();

// Track when this client session mounted to prevent speaking old arrivals
const CLIENT_SESSION_START_TIME = Date.now();

// FIFO Queue for sequential speech without collision
interface QueuedSpeech {
  alert: VoiceAlertPayload;
  language?: 'hi' | 'en' | 'auto';
  onDone?: () => void;
}

const speechQueue: QueuedSpeech[] = [];
let isCurrentlySpeaking = false;
let watchdogTimer: any = null;
let lastAlertPayload: VoiceAlertPayload | null = null;
let isAutoplayBlocked = false;

/**
 * Check if the browser supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Check if browser autoplay policy currently blocks audio playback
 */
export function isAudioAutoplayBlocked(): boolean {
  return isAutoplayBlocked;
}

/**
 * Prime audio context / unlock speech synthesis on user interaction (tap/click/enable)
 */
export function unlockSpeechSynthesis(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    isAutoplayBlocked = false;
    window.speechSynthesis.resume();
    // Speak a micro-silent character to satisfy mobile Safari & Chromium autoplay policies
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0.01;
    utterance.rate = 2.0;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[VOICE] SpeechSynthesis unlock failed:', err);
    return false;
  }
}

/**
 * Replay the last received voice alert on user gesture
 */
export function replayLastVoiceAlert(language: 'hi' | 'en' = 'hi'): boolean {
  if (!lastAlertPayload || !isSpeechSynthesisSupported()) return false;
  unlockSpeechSynthesis();
  speechQueue.push({
    alert: lastAlertPayload,
    language,
  });
  processNextInQueue();
  return true;
}

/**
 * Check if alert has already been spoken (in-memory or sessionStorage)
 */
export function hasAlertBeenSpoken(alertId: string): boolean {
  if (!alertId) return false;
  if (spokenAlertIds.has(alertId)) return true;
  try {
    const stored = sessionStorage.getItem(`wcr_spoken_${alertId}`);
    if (stored) {
      spokenAlertIds.add(alertId);
      return true;
    }
  } catch {
    // sessionStorage fallback
  }
  return false;
}

/**
 * Mark alert as spoken
 */
export function markAlertAsSpoken(alertId: string): void {
  if (!alertId) return;
  spokenAlertIds.add(alertId);
  try {
    sessionStorage.setItem(`wcr_spoken_${alertId}`, Date.now().toString());
  } catch {
    // sessionStorage fallback
  }
}

/**
 * Select the optimal voice for natural Hindi / Hinglish announcements
 */
function getPreferredVoice(isHindi: boolean): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (isHindi) {
    // 1. Look for Hindi voices (hi-IN, hi_IN, Google हिन्दी, etc.)
    const hiVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('lekha')
    );
    if (hiVoice) return hiVoice;

    // 2. Fall back to Indian English voice for natural Hinglish cadence (en-IN)
    const enInVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india')
    );
    if (enInVoice) return enInVoice;
  } else {
    // Look for Indian English or standard English
    const enInVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india')
    );
    if (enInVoice) return enInVoice;
  }

  // Fallback to default or first English voice
  return voices.find((v) => v.default) || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
}

/**
 * Process the speech queue one announcement at a time
 */
function processNextInQueue(): void {
  if (!isSpeechSynthesisSupported()) {
    speechQueue.length = 0;
    isCurrentlySpeaking = false;
    return;
  }

  if (isCurrentlySpeaking || speechQueue.length === 0) {
    return;
  }

  const item = speechQueue.shift();
  if (!item) {
    isCurrentlySpeaking = false;
    return;
  }

  const { alert, language = 'hi', onDone } = item;

  // Choose spoken phrase: Hindi/Hinglish (default) or English
  const isHindiPreferred = language === 'hi' || language === 'auto';
  const textToSpeak = isHindiPreferred && alert.spokenText
    ? alert.spokenText
    : alert.spokenTextEn || alert.spokenText;

  if (!textToSpeak) {
    processNextInQueue();
    return;
  }

  isCurrentlySpeaking = true;

  try {
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Apply voice tuning for clear, authoritative professional speech
    const voice = getPreferredVoice(isHindiPreferred);
    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    } else {
      utterance.lang = isHindiPreferred ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = 0.95; // Slightly measured rate for clear office acoustic
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const cleanup = () => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      isCurrentlySpeaking = false;
      if (onDone) onDone();
      // Brief 500ms pause before speaking next queued announcement
      setTimeout(processNextInQueue, 500);
    };

    utterance.onend = () => {
      console.log(`[VOICE] Completed speech for alert: ${alert.id}`);
      cleanup();
    };

    utterance.onerror = (e) => {
      console.warn(`[VOICE] Speech error for alert: ${alert.id}`, e);
      if ((e as any).error === 'not-allowed') {
        isAutoplayBlocked = true;
        console.warn('[VOICE] Autoplay blocked by browser policy. User interaction required to play audio.');
      }
      cleanup();
    };

    // Watchdog timer: If browser stalls or suspends utterance, force advance after 8 seconds
    watchdogTimer = setTimeout(() => {
      if (isCurrentlySpeaking) {
        console.warn(`[VOICE] Watchdog timed out for alert: ${alert.id}. Advancing queue.`);
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
        cleanup();
      }
    }, 8000);

    console.log(`[VOICE] Speaking to host (${alert.targetHostName}): "${textToSpeak}"`);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('[VOICE] Failed executing speechSynthesis.speak:', err);
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
    isCurrentlySpeaking = false;
    setTimeout(processNextInQueue, 300);
  }
}

/**
 * Main Entry Point: Dispatches voice alert ONLY IF current user is the exact intended target host!
 *
 * Rules strictly enforced:
 * 1. Checks if user has voice alerts enabled.
 * 2. Checks currentUserId === voiceAlert.targetUserId.
 * 3. Never speaks old arrivals (older than 25 seconds or before client mounted).
 * 4. Never speaks duplicate alert IDs.
 * 5. Queues sequential announcements without collision.
 */
export function dispatchHostVoiceAlert(params: {
  voiceAlert: VoiceAlertPayload | null | undefined;
  currentUserId: string;
  isVoiceAlertsEnabled: boolean;
  language?: 'hi' | 'en' | 'auto';
  isResyncedEvent?: boolean;
}): { delivered: boolean; reason?: string } {
  const { voiceAlert, currentUserId, isVoiceAlertsEnabled, language = 'hi', isResyncedEvent = false } = params;

  if (!voiceAlert) {
    return { delivered: false, reason: 'No voiceAlert in payload' };
  }

  // Cache for user-triggered replay or unlock
  lastAlertPayload = voiceAlert;

  // 1. Strict Target User Enforcement: Must be the intended host user!
  if (!currentUserId || voiceAlert.targetUserId !== currentUserId) {
    // Unrelated user's device remains completely silent!
    return { delivered: false, reason: 'Current user is not the intended target host' };
  }

  // 2. Respect User Voice Preference
  if (!isVoiceAlertsEnabled) {
    return { delivered: false, reason: 'Voice alerts are muted or disabled by user' };
  }

  // 3. Prevent repeated speech on SSE reconnect / resync
  if (isResyncedEvent) {
    return { delivered: false, reason: 'Resynced event: voice speech suppressed' };
  }

  // 4. Check for duplicate speech
  if (hasAlertBeenSpoken(voiceAlert.id)) {
    return { delivered: false, reason: 'Alert already spoken on this device' };
  }

  // 5. Stale / Old Arrivals Protection
  // Never unexpectedly speak old arrivals when a user logs in or reconnects
  if (voiceAlert.timestamp) {
    const alertTime = new Date(voiceAlert.timestamp).getTime();
    const now = Date.now();
    const ageSeconds = (now - alertTime) / 1000;

    // Discard if older than 25 seconds
    if (ageSeconds > 25) {
      markAlertAsSpoken(voiceAlert.id);
      return { delivered: false, reason: `Alert is stale (${Math.round(ageSeconds)}s old)` };
    }

    // Discard if arrival occurred before this client session initialized
    if (alertTime < CLIENT_SESSION_START_TIME - 3000) {
      markAlertAsSpoken(voiceAlert.id);
      return { delivered: false, reason: 'Arrival occurred before active session started' };
    }
  }

  // 6. Browser compatibility check
  if (!isSpeechSynthesisSupported()) {
    return { delivered: false, reason: 'SpeechSynthesis API not supported by browser' };
  }

  // Mark as spoken before enqueueing to prevent any race condition
  markAlertAsSpoken(voiceAlert.id);

  // Push to FIFO Speech Queue
  speechQueue.push({
    alert: voiceAlert,
    language,
  });

  // Trigger queue runner
  processNextInQueue();

  return { delivered: true };
}

/**
 * Preview / Test Speech for current user
 */
export function playTestVoiceAlert(userName: string, language: 'hi' | 'en' = 'hi'): void {
  if (!isSpeechSynthesisSupported()) return;
  unlockSpeechSynthesis();

  const mockAlert: VoiceAlertPayload = {
    id: `test-${Date.now()}`,
    targetUserId: 'self',
    targetHostName: userName,
    visitorName: 'Rahul Sharma',
    purpose: 'interview',
    spokenText: `${userName}, voice alerts enabled hain. Naye aane wale mehmaano ki audio suchna sirf aapke device par aayegi.`,
    spokenTextEn: `${userName}, voice alerts are enabled. Arrival announcements will play only on your device.`,
    timestamp: new Date().toISOString(),
  };

  speechQueue.push({
    alert: mockAlert,
    language,
  });

  processNextInQueue();
}
