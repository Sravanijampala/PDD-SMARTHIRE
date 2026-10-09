/**
 * SmartHire AI - Object Detection Engine
 * Uses TensorFlow.js and COCO-SSD to detect cell phones and multiple people.
 * Uses the full mobilenet_v2 base model for better accuracy.
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export class ObjectDetectionEngine {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    try {
      // Set backend to webgl for GPU acceleration, fallback to cpu
      await tf.setBackend('webgl');
      await tf.ready();

      // Use the full mobilenet_v2 model — much better at detecting phones than 'lite_mobilenet_v2'
      this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
      this.isInitialized = true;
      console.log('[ObjectDetection] ✅ Model loaded successfully (mobilenet_v2).');
    } catch (error) {
      console.error('[ObjectDetection] ❌ Error initializing model:', error);
      // Try fallback lite model
      try {
        this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        this.isInitialized = true;
        console.log('[ObjectDetection] ✅ Fallback lite model loaded.');
      } catch (e2) {
        console.error('[ObjectDetection] ❌ Fallback also failed:', e2);
        this.isInitialized = false;
      }
    }
  }

  /**
   * Detects violations in a given video element.
   * Returns an object indicating if a cell phone is detected or if multiple people are in frame.
   */
  async detectViolations(videoElement: HTMLVideoElement): Promise<{ hasPhone: boolean, multiplePeople: boolean }> {
    if (!this.model || !this.isInitialized) {
      console.warn('[ObjectDetection] Model not ready, skipping frame.');
      return { hasPhone: false, multiplePeople: false };
    }

    // Make sure video has data
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return { hasPhone: false, multiplePeople: false };
    }

    try {
      const predictions = await this.model.detect(videoElement);

      // Log ALL predictions to help diagnose misses (only if something detected)
      if (predictions.length > 0) {
        console.log('[ObjectDetection] Predictions:', predictions.map(p => `${p.class}:${(p.score * 100).toFixed(0)}%`).join(', '));
      }

      // Check for cell phone with lowered threshold (0.25) — lite model scores phones lower
      const hasPhone = predictions.some(
        p => (p.class === 'cell phone' || p.class === 'remote' || p.class === 'book') && p.score > 0.25
      );

      // Count distinct 'person' predictions with confidence > 45%
      const personCount = predictions.filter(p => p.class === 'person' && p.score > 0.45).length;
      const multiplePeople = personCount > 1;

      if (hasPhone || multiplePeople) {
        console.log(`[ObjectDetection] 🚨 VIOLATION: phone=${hasPhone}, persons=${personCount}`);
      }

      return { hasPhone, multiplePeople };
    } catch (e) {
      console.error('[ObjectDetection] Error detecting objects:', e);
      return { hasPhone: false, multiplePeople: false };
    }
  }

  get initialized() {
    return this.isInitialized;
  }

  destroy() {
    this.model = null;
    this.isInitialized = false;
  }
}
