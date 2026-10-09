/**
 * SmartHire AI - Background Blur Engine
 * Uses MediaPipe ImageSegmenter to separate the person from the background
 * and applies a strong blur to the background.
 */

import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

export class BackgroundBlurEngine {
  private segmenter: ImageSegmenter | null = null;
  private isInitialized = false;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private isRunning = false;

  async init() {
    if (this.isInitialized) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        outputCategoryMask: true,
        outputConfidenceMasks: false
      });
      
      this.isInitialized = true;
      console.log("[BackgroundBlur] Model loaded successfully.");
    } catch (error) {
      console.error("[BackgroundBlur] Error initializing model:", error);
    }
  }

  startBlurring(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    if (!this.segmenter || !this.isInitialized) return;
    
    this.canvasCtx = canvasElement.getContext('2d');
    if (!this.canvasCtx) return;
    
    this.isRunning = true;
    
    // Make sure canvas matches video dimensions
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (!this.isRunning) return;

      if (videoElement.readyState >= 2 && videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;
        
        // Ensure dimensions match
        if (canvasElement.width !== videoElement.videoWidth) {
           canvasElement.width = videoElement.videoWidth;
           canvasElement.height = videoElement.videoHeight;
        }

        const startTimeMs = performance.now();
        this.segmenter!.segmentForVideo(videoElement, startTimeMs, (result) => {
          if (!this.canvasCtx) return;
          const ctx = this.canvasCtx;
          
          ctx.save();
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

          if (result.categoryMask) {
            // Draw original video
            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            
            // Create a temporary canvas for the mask
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = result.categoryMask.width;
            maskCanvas.height = result.categoryMask.height;
            const maskCtx = maskCanvas.getContext('2d')!;
            
            const imageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
            const mask = result.categoryMask.getAsUint8Array();
            
            for (let i = 0; i < mask.length; i++) {
              // Usually class 0 is background in selfie segmenter
              const isBackground = mask[i] === 0;
              imageData.data[i * 4 + 0] = 0;
              imageData.data[i * 4 + 1] = 0;
              imageData.data[i * 4 + 2] = 0;
              imageData.data[i * 4 + 3] = isBackground ? 255 : 0; 
            }
            maskCtx.putImageData(imageData, 0, 0);

            // Cut out the person (destination-out will remove the background area from the drawn video)
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(maskCanvas, 0, 0, canvasElement.width, canvasElement.height);
            
            // Draw the blurred video over the background areas (destination-over puts it behind)
            ctx.globalCompositeOperation = 'destination-over';
            ctx.filter = 'blur(15px)';
            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          } else {
             // Fallback if no mask
             ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          }
          
          ctx.restore();
        });
      }

      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  stop() {
    this.isRunning = false;
  }

  destroy() {
    this.stop();
    if (this.segmenter) {
      this.segmenter.close();
      this.segmenter = null;
    }
    this.isInitialized = false;
  }
}
