/**
 * SmartHire AI - Face Detection Engine
 * Wraps @vladmandic/face-api for client-side face detection.
 */

export class FaceDetectionEngine {
  private isInitialized = false;
  private faceapi: any = null;

  async init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return; // Safety for SSR
    
    try {
      // Lazy load to prevent Next.js SSR crashes (TextEncoder is not defined, etc.)
      this.faceapi = await import('@vladmandic/face-api');
      
      // Load the models from the public folder
      await Promise.all([
        this.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        this.faceapi.nets.faceLandmark68Net.loadFromUri('/models')
      ]);
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing Face API", error);
      this.isInitialized = false;
    }
  }

  /**
   * Analyzes a video frame for faces.
   */
  async detectFaces(videoElement: HTMLVideoElement) {
    if (!this.isInitialized || !this.faceapi) return { numFaces: 1, mouthOpenness: 0 }; // Assume 1 if not loaded
    
    try {
      const detections = await this.faceapi.detectAllFaces(
        videoElement, 
        new this.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks();
      
      let mouthOpenness = 0;
      if (detections.length > 0) {
        // getMouth returns array of 20 points. Indices 12-19 are the inner lip.
        // Index 14 is top inner lip, Index 18 is bottom inner lip.
        const mouth = detections[0].landmarks.getMouth();
        if (mouth && mouth.length >= 19) {
          mouthOpenness = Math.abs(mouth[18].y - mouth[14].y);
        }
      }
      
      return { 
        numFaces: detections.length,
        mouthOpenness
      };
    } catch (e) {
      console.error("Face detection failed:", e);
      return { numFaces: 1, mouthOpenness: 0 };
    }
  }

  destroy() {
    this.isInitialized = false;
    this.faceapi = null;
  }
}

