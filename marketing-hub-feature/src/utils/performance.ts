import * as fabric from 'fabric';
import React from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  objectCount: number;
  canvasSize: { width: number; height: number };
  timestamp: number;
}

export interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  renderTime: { warning: number; critical: number };
  objectCount: { warning: number; critical: number };
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 30, critical: 15 },
  memoryUsage: { warning: 200, critical: 500 },
  renderTime: { warning: 16, critical: 33 },
  objectCount: { warning: 100, critical: 500 }
};

export class PerformanceMonitor {
  private canvas: fabric.Canvas | null = null;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private memoryUsage = 0;
  private renderTime = 0;
  private objectCount = 0;
  private canvasSize = { width: 0, height: 0 };
  private thresholds = DEFAULT_THRESHOLDS;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private rafId: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(canvas?: fabric.Canvas, thresholds?: Partial<PerformanceThresholds>) {
    if (canvas) {
      this.setCanvas(canvas);
    }
    if (thresholds) {
      this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    }
  }

  setCanvas(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.canvasSize = {
      width: canvas.width || 0,
      height: canvas.height || 0
    };
  }

  startMonitoring(interval = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    
    const measureFPS = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        this.rafId = requestAnimationFrame(measureFPS);
      }
    };
    
    this.rafId = requestAnimationFrame(measureFPS);
    
    this.intervalId = setInterval(() => {
      this.updateMetrics();
    }, interval);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
    } else {
      this.memoryUsage = this.objectCount * 0.5;
    }

    if (this.canvas) {
      const startTime = performance.now();
      this.canvas.renderAll();
      const endTime = performance.now();
      this.renderTime = endTime - startTime;
    }

    this.objectCount = this.canvas ? this.canvas.getObjects().length : 0;

    if (this.canvas) {
      this.canvasSize = {
        width: this.canvas.width || 0,
        height: this.canvas.height || 0
      };
    }

    const metrics: PerformanceMetrics = {
      fps: this.fps,
      memoryUsage: this.memoryUsage,
      renderTime: this.renderTime,
      objectCount: this.objectCount,
      canvasSize: this.canvasSize,
      timestamp: Date.now()
    };

    this.callbacks.forEach(callback => callback(metrics));
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      memoryUsage: this.memoryUsage,
      renderTime: this.renderTime,
      objectCount: this.objectCount,
      canvasSize: this.canvasSize,
      timestamp: Date.now()
    };
  }

  getPerformanceStatus(): 'good' | 'warning' | 'critical' {
    const metrics = this.getMetrics();
    
    if (
      metrics.fps < this.thresholds.fps.critical ||
      metrics.memoryUsage > this.thresholds.memoryUsage.critical ||
      metrics.renderTime > this.thresholds.renderTime.critical ||
      metrics.objectCount > this.thresholds.objectCount.critical
    ) {
      return 'critical';
    }
    
    if (
      metrics.fps < this.thresholds.fps.warning ||
      metrics.memoryUsage > this.thresholds.memoryUsage.warning ||
      metrics.renderTime > this.thresholds.renderTime.warning ||
      metrics.objectCount > this.thresholds.objectCount.warning
    ) {
      return 'warning';
    }
    
    return 'good';
  }

  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.fps < this.thresholds.fps.warning) {
      recommendations.push('Low FPS detected. Consider reducing object count or complexity.');
    }

    if (metrics.memoryUsage > this.thresholds.memoryUsage.warning) {
      recommendations.push('High memory usage. Consider implementing object pooling or cleanup.');
    }

    if (metrics.renderTime > this.thresholds.renderTime.warning) {
      recommendations.push('Slow rendering. Optimize canvas operations or reduce visual complexity.');
    }

    if (metrics.objectCount > this.thresholds.objectCount.warning) {
      recommendations.push('High object count. Consider grouping objects or implementing culling.');
    }

    return recommendations;
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  dispose() {
    this.stopMonitoring();
    this.callbacks = [];
    this.canvas = null;
  }
}

export function usePerformanceMonitor(canvas: fabric.Canvas | null, interval = 1000) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    objectCount: 0,
    canvasSize: { width: 0, height: 0 },
    timestamp: 0
  });

  const monitorRef = React.useRef<PerformanceMonitor | null>(null);

  React.useEffect(() => {
    if (canvas) {
      monitorRef.current = new PerformanceMonitor(canvas);
      monitorRef.current.startMonitoring(interval);
      
      const unsubscribe = monitorRef.current.onMetricsUpdate(setMetrics);
      
      return () => {
        unsubscribe();
        monitorRef.current?.dispose();
      };
    }
  }, [canvas, interval]);

  return {
    ...metrics,
    getStatus: () => monitorRef.current?.getPerformanceStatus() || 'good',
    getRecommendations: () => monitorRef.current?.getRecommendations() || [],
    setThresholds: (thresholds: Partial<PerformanceThresholds>) => {
      monitorRef.current?.setThresholds(thresholds);
    }
  };
}