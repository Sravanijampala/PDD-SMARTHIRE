/**
 * SmartHire AI - Proctoring Engine
 * Monitors the interview environment for violations (fullscreen exit, tab switching, etc.)
 */

export type ViolationType = 
  | 'fullscreen_exit'
  | 'tab_switch'
  | 'multiple_faces'
  | 'no_face'
  | 'background_noise'
  | 'devtools_opened'
  | 'copy_paste'
  | 'mobile_phone'
  | 'multiple_people'
  | 'off_camera_speaker';

export interface ViolationEvent {
  type: ViolationType;
  timestamp: number;
  message: string;
}

export class ProctoringEngine {
  private violations: ViolationEvent[] = [];
  private onViolation: (event: ViolationEvent, totalViolations: number) => void;
  private isMonitoring = false;
  
  // Thresholds
  private maxViolations = 3;

  // Audio Monitoring
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioInterval: any = null;
  private noiseThreshold = 30; // 0-255 scale
  private consecutiveNoiseViolations = 0;
  public expectedToSpeak = true;

  constructor(onViolationCallback: (event: ViolationEvent, totalViolations: number) => void) {
    this.onViolation = onViolationCallback;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
    this.handleCopyPaste = this.handleCopyPaste.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.violations = [];
    
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
      window.addEventListener('blur', this.handleBlur);
      document.addEventListener('copy', this.handleCopyPaste);
      document.addEventListener('paste', this.handleCopyPaste);
      
      // DevTools detection loop
      this.startDevToolsMonitor();
    }
  }

  stop() {
    this.isMonitoring = false;
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      window.removeEventListener('blur', this.handleBlur);
      document.removeEventListener('copy', this.handleCopyPaste);
      document.removeEventListener('paste', this.handleCopyPaste);
    }
    this.stopAudioMonitoring();
  }

  // -- Audio Monitoring --
  startAudioMonitoring(stream: MediaStream) {
    if (!this.isMonitoring) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.audioInterval = setInterval(() => {
        if (!this.analyser || !this.isMonitoring) return;
        this.analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // If candidate is NOT expected to speak (AI is talking), and volume is high → another person is speaking
        if (!this.expectedToSpeak && average > this.noiseThreshold) {
          this.consecutiveNoiseViolations++;
          if (this.consecutiveNoiseViolations >= 1) { // ⚡ INSTANT: first detection fires immediately
            this.addViolation('background_noise', '🚨 Voice detected while AI is speaking — another person may be coaching the candidate.');
            this.consecutiveNoiseViolations = 0;
          }
        } else if (this.expectedToSpeak && average > this.noiseThreshold * 2) {
          // Even when candidate IS expected to speak, if volume is VERY loud, might be background voices
          // Don't flag this — candidate is allowed to speak loudly
          this.consecutiveNoiseViolations = 0;
        } else {
          this.consecutiveNoiseViolations = Math.max(0, this.consecutiveNoiseViolations - 1);
        }
      }, 1000);
    } catch (e) {
      console.warn('Could not start audio monitoring for proctoring:', e);
    }
  }

  stopAudioMonitoring() {
    if (this.audioInterval) clearInterval(this.audioInterval);
    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {});
        }
      } catch (e) {
        // Ignore InvalidStateError if already closed
      }
    }
    this.audioContext = null;
    this.analyser = null;
  }

  getViolations() {
    return this.violations;
  }

  private addViolation(type: ViolationType, message: string) {
    if (!this.isMonitoring) return;
    
    // FATAL violations (another person, phone, noise) → always fire, no dedup
    const fatalTypes: ViolationType[] = [
      'multiple_faces', 'multiple_people', 'mobile_phone',
      'background_noise', 'off_camera_speaker'
    ];
    const isFatal = fatalTypes.includes(type);
    
    if (!isFatal) {
      // For non-fatal violations, prevent duplicate spamming within 5 seconds
      const lastEvent = this.violations[this.violations.length - 1];
      if (lastEvent && lastEvent.type === type && Date.now() - lastEvent.timestamp < 5000) {
        return; 
      }
    } else {
      // For fatal violations, only deduplicate within 1 second to avoid double-fire
      const lastSameType = [...this.violations].reverse().find(v => v.type === type);
      if (lastSameType && Date.now() - lastSameType.timestamp < 1500) {
        return;
      }
    }

    const event: ViolationEvent = { type, timestamp: Date.now(), message };
    this.violations.push(event);
    this.onViolation(event, this.violations.length);
  }

  // Exposed for face tracking / audio tracking to report issues
  reportViolation(type: ViolationType, message: string) {
    this.addViolation(type, message);
  }

  // -- Event Handlers --

  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.addViolation('tab_switch', 'Candidate switched tabs or minimized the browser.');
    }
  }

  private handleBlur() {
    // Sometimes blur fires when they open a system menu, treat as tab switch warning
    this.addViolation('tab_switch', 'Browser window lost focus.');
  }

  private handleFullscreenChange() {
    if (!document.fullscreenElement) {
      this.addViolation('fullscreen_exit', 'Candidate exited fullscreen mode.');
    }
  }

  private handleCopyPaste(e: Event) {
    this.addViolation('copy_paste', `Clipboard ${e.type} action detected.`);
    e.preventDefault();
  }

  private startDevToolsMonitor() {
    // Simple heuristic to detect DevTools opening
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    const checkDevTools = () => {
      if (!this.isMonitoring) return;
      
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        // We only trigger if it changes rapidly, but this is a simple check
        this.addViolation('devtools_opened', 'Developer tools may have been opened.');
      }
      
      setTimeout(checkDevTools, 2000);
    };
    setTimeout(checkDevTools, 2000);
  }
}
