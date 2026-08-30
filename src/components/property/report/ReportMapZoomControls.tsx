import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ReportMapZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Google Maps–style zoom buttons for the static map fallback. */
export const ReportMapZoomControls: React.FC<ReportMapZoomControlsProps> = ({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
}) => (
  <div
    className="no-print absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
    data-testid="report-map-zoom-controls"
  >
    <button
      type="button"
      onClick={onZoomIn}
      disabled={zoom >= maxZoom}
      aria-label="Zoom in"
      className="flex h-10 w-10 items-center justify-center text-[#5f6368] transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Plus className="h-5 w-5" strokeWidth={2.25} />
    </button>
    <div className="h-px bg-[#dadce0]" />
    <button
      type="button"
      onClick={onZoomOut}
      disabled={zoom <= minZoom}
      aria-label="Zoom out"
      className="flex h-10 w-10 items-center justify-center text-[#5f6368] transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Minus className="h-5 w-5" strokeWidth={2.25} />
    </button>
  </div>
);
