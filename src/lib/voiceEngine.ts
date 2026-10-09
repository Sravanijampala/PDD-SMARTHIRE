/**
 * SmartHire Voice Engine
 * Handles Text-to-Speech and Speech-to-Text pipeline
 * with Voice Activity Detection and silence detection.
 */

export interface VoiceOptions {
  rate?: number;      // 0.1–2.0 (default: 0.92)
  pitch?: number;     // 0.0–2.0 (default: 1.0)
  volume?: number;    // 0.0–1.0 (default: 1.0)
  voiceName?: string; // specific voice name
}

export interface TranscriptEvent {
  interim: string;
  final: string;
  confidence: number;
}

export interface VoiceEngine {
  speak: (text: string, options?: VoiceOptions) => Promise<void>;
  stopSpeaking: () => void;
  startListening: (
    onTranscript: (event: TranscriptEvent) => void,
    onSilence: (finalTranscript: string) => void,
    onError: (error: string) => void
  ) => void;
  stopListening: () => void;
  isSpeaking: () => boolean;
  isListening: () => boolean;
  getAvailableVoices: () => SpeechSynthesisVoice[];
  getBestVoice: () => SpeechSynthesisVoice | null;
}

// ─────────────────────────────────────────────
//  Preferred voice names (natural-sounding)
// ─────────────────────────────────────────────
const PREFERRED_VOICES = [
  'Google US English',
  'Microsoft David - English (United States)',
  'Microsoft Mark - English (United States)',
  'Microsoft Guy Online (Natural) - English (United States)',
  'Alex',
  'Daniel',
  'Samantha',
  'Google UK English Male',
  'en-US',
];

function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Try to find a preferred voice
  for (const preferred of PREFERRED_VOICES) {
    const found = voices.find(v =>
      v.name.toLowerCase().includes(preferred.toLowerCase()) ||
      v.lang.startsWith('en')
    );
    if (found) return found;
  }

  // Fallback: first English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

// ─────────────────────────────────────────────
//  Speech state
// ─────────────────────────────────────────────
let _isSpeaking = false;
let _isListening = false;
let _recognition: any = null;
let _silenceTimer: ReturnType<typeof setTimeout> | null = null;
let _finalTranscript = '';

const SILENCE_TIMEOUT_MS = 2800; // 2.8s of silence = end of answer

// ─────────────────────────────────────────────
//  Text-to-Speech
// ─────────────────────────────────────────────
export function speak(text: string, options: VoiceOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTimeout(resolve, 2000);
      return;
    }

    window.speechSynthesis.cancel();
    _isSpeaking = false;

    // Small delay to let cancel() take effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 0.92;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      // Load voices with retry
      const trySpeak = () => {
        const voice = options.voiceName
          ? window.speechSynthesis.getVoices().find(v => v.name === options.voiceName)
          : findBestVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => { _isSpeaking = true; };
        utterance.onend = () => { _isSpeaking = false; resolve(); };
        utterance.onerror = (e) => {
          _isSpeaking = false;
          // 'interrupted' is not a real error
          if (e.error === 'interrupted' || e.error === 'canceled') { resolve(); return; }
          reject(new Error(`TTS error: ${e.error}`));
        };

        window.speechSynthesis.speak(utterance);
        _isSpeaking = true;
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        trySpeak();
      } else {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          trySpeak();
        };
        // Fallback if onvoiceschanged never fires
        setTimeout(trySpeak, 500);
      }
    }, 80);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    _isSpeaking = false;
  }
}

// ─────────────────────────────────────────────
//  Speech-to-Text with VAD + Silence Detection
// ─────────────────────────────────────────────
export function startListening(
  onTranscript: (event: TranscriptEvent) => void,
  onSilence: (finalTranscript: string) => void,
  onError: (error: string) => void,
): void {
  if (typeof window === 'undefined') { onError('Not in browser environment'); return; }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  // Stop any existing session
  if (_recognition) {
    try { _recognition.stop(); } catch {}
    _recognition = null;
  }
  if (_silenceTimer) { clearTimeout(_silenceTimer); _silenceTimer = null; }

  _finalTranscript = '';

  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  _recognition = rec;
  _isListening = false;

  const resetSilenceTimer = () => {
    if (_silenceTimer) clearTimeout(_silenceTimer);
    _silenceTimer = setTimeout(() => {
      // Silence detected — stop and fire callback
      if (_recognition) {
        try { _recognition.stop(); } catch {}
        _recognition = null;
      }
      _isListening = false;
      onSilence(_finalTranscript.trim());
    }, SILENCE_TIMEOUT_MS);
  };

  rec.onstart = () => {
    _isListening = true;
    _finalTranscript = '';
    resetSilenceTimer();
  };

  rec.onresult = (event: any) => {
    let interim = '';
    let finalStr = '';

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalStr += result[0].transcript + ' ';
      } else {
        interim += result[0].transcript;
      }
    }

    _finalTranscript = finalStr;

    onTranscript({
      interim,
      final: _finalTranscript,
      confidence: event.results[event.results.length - 1]?.[0]?.confidence ?? 0.8,
    });

    // Reset silence timer whenever speech is detected
    if (interim || finalStr) {
      resetSilenceTimer();
    }
  };

  rec.onerror = (event: any) => {
    if (_silenceTimer) clearTimeout(_silenceTimer);

    if (event.error === 'no-speech') {
      // Silence — treat as end of response
      _isListening = false;
      onSilence(_finalTranscript.trim());
    } else if (event.error === 'aborted' || event.error === 'interrupted') {
      _isListening = false;
      // Intentionally stopped
    } else if (event.error === 'not-allowed') {
      _isListening = false;
      onError('Microphone access denied. Please allow microphone permission in your browser.');
    } else if (event.error === 'network') {
      _isListening = false;
      onError('Network error. Please check your internet connection.');
    } else {
      _isListening = false;
      onError(`Recognition error: ${event.error}`);
    }
  };

  rec.onend = () => {
    if (_silenceTimer) clearTimeout(_silenceTimer);
    if (_isListening) {
      // Auto-stopped by browser — fire silence callback if we have transcript
      _isListening = false;
      if (_finalTranscript.trim()) {
        onSilence(_finalTranscript.trim());
      } else {
        // Restart if no speech was captured (continuous mode)
        setTimeout(() => {
          if (_isListening) return;
          try { rec.start(); } catch {}
        }, 300);
      }
    }
  };

  try {
    rec.start();
  } catch (e: any) {
    onError(`Could not start microphone: ${e.message}`);
  }
}

export function stopListening(): void {
  if (_silenceTimer) { clearTimeout(_silenceTimer); _silenceTimer = null; }
  if (_recognition) {
    try { _recognition.stop(); } catch {}
    _recognition = null;
  }
  _isListening = false;
}

export function isSpeaking(): boolean { return _isSpeaking; }
export function isListening(): boolean { return _isListening; }

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
}

export function getBestVoice(): SpeechSynthesisVoice | null {
  return findBestVoice();
}

// ─────────────────────────────────────────────
//  Microphone level meter via Web Audio API
// ─────────────────────────────────────────────
export interface MicMeter {
  getLevel: () => number;   // 0–100
  destroy: () => void;
}

export async function createMicMeter(stream: MediaStream): Promise<MicMeter> {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let level = 0;
    let running = true;

    const loop = () => {
      if (!running) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      level = Math.min(100, Math.max(0, Math.round((avg / 128) * 100)));
      requestAnimationFrame(loop);
    };
    loop();

    return {
      getLevel: () => level,
      destroy: () => {
        running = false;
        ctx.close().catch(() => {});
      },
    };
  } catch {
    return { getLevel: () => 0, destroy: () => {} };
  }
}

// ─────────────────────────────────────────────
//  Replay last spoken text
// ─────────────────────────────────────────────
let _lastSpokenText = '';

export async function speakWithReplay(text: string, options?: VoiceOptions): Promise<void> {
  _lastSpokenText = text;
  return speak(text, options);
}

export async function replayLastQuestion(options?: VoiceOptions): Promise<void> {
  if (_lastSpokenText) {
    return speak(_lastSpokenText, options);
  }
}
