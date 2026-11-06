import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import SignaturePadComponent from './SignaturePad';

type CaptureMode = 'type' | 'draw' | 'upload';

interface SignatureCaptureModalProps {
  isOpen: boolean;
  defaultName?: string;
  onClose: () => void;
  /** Receives a PNG data URL. pdf-lib only embeds PNG on this path. */
  onAdopt: (pngDataUrl: string) => void;
}

const SIGNATURE_FONTS = [
  { family: 'Dancing Script', label: 'Dancing Script' },
  { family: 'Great Vibes', label: 'Great Vibes' },
  { family: 'Caveat', label: 'Caveat Modern' },
  { family: 'Pacifico', label: 'Pacifico' },
] as const;

const FONT_LINK_ID = 'proptii-signature-fonts';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Dancing+Script:wght@400..700&family=Great+Vibes&family=Pacifico&display=swap';

const INK_COLORS = ['#136C9E', '#1e293b'] as const;

function ensureSignatureFonts() {
  if (typeof document === 'undefined' || document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

async function typedSignatureToPng(name: string, family: string, color: string): Promise<string> {
  const width = 600;
  const height = 300;
  let size = 110;
  try {
    await document.fonts.load(`${size}px "${family}"`);
  } catch {
    // Falls back to the browser cursive font.
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the signature.');

  const font = (px: number) => `${px}px "${family}", cursive`;
  ctx.font = font(size);
  while (size > 24 && ctx.measureText(name).width > width - 40) {
    size -= 4;
    ctx.font = font(size);
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, width / 2, height / 2);
  return canvas.toDataURL('image/png');
}

function imageToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not read the signature image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Could not read the signature image.'));
    img.src = dataUrl;
  });
}

const SignatureCaptureModal: React.FC<SignatureCaptureModalProps> = ({ isOpen, defaultName = '', onClose, onAdopt }) => {
  const [mode, setMode] = useState<CaptureMode>('type');
  const [typedName, setTypedName] = useState(defaultName);
  const [fontFamily, setFontFamily] = useState<string>(SIGNATURE_FONTS[0].family);
  const [inkColor, setInkColor] = useState<string>(INK_COLORS[0]);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const padWrapRef = useRef<HTMLDivElement>(null);
  const [padWidth, setPadWidth] = useState(460);

  useEffect(() => {
    if (isOpen) ensureSignatureFonts();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !typedName && defaultName) setTypedName(defaultName);
    // Only prefill when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    setDrawnSignature(null);
  }, [inkColor, padWidth]);

  useLayoutEffect(() => {
    if (!isOpen || mode !== 'draw' || !padWrapRef.current) return;
    const measure = () => {
      const width = padWrapRef.current?.clientWidth;
      if (width) setPadWidth(Math.floor(width));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const signatureReady =
    (mode === 'type' && typedName.trim().length > 0) ||
    (mode === 'draw' && Boolean(drawnSignature)) ||
    (mode === 'upload' && Boolean(uploadedSignature));

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadedSignature((e.target?.result as string) || null);
    reader.readAsDataURL(file);
  };

  const handleAdopt = async () => {
    if (!signatureReady || !consented) return;
    setIsAdopting(true);
    setAdoptError(null);
    try {
      let png: string;
      if (mode === 'type') png = await typedSignatureToPng(typedName.trim(), fontFamily, inkColor);
      else if (mode === 'draw') png = drawnSignature as string;
      else png = await imageToPng(uploadedSignature as string);
      onAdopt(png);
    } catch (error) {
      setAdoptError(error instanceof Error ? error.message : 'Could not prepare the signature.');
    } finally {
      setIsAdopting(false);
    }
  };

  const tabClass = (tab: CaptureMode) =>
    `flex-1 py-1.5 text-xs rounded-lg transition-all ${
      mode === tab ? 'font-bold bg-[#136C9E] text-white shadow-sm' : 'font-semibold text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-nunito-sans"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-capture-title"
        className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] w-full max-w-lg border border-slate-200 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 id="signature-capture-title" className="font-archivo font-extrabold text-base text-slate-900 tracking-tight">
              Create Your Signature
            </h3>
            <p className="text-xs text-slate-500">Pick a calligraphy style, draw with mouse or finger, or upload a photo.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setMode('type')} className={tabClass('type')}>Type</button>
            <button type="button" onClick={() => setMode('draw')} className={tabClass('draw')}>Draw</button>
            <button type="button" onClick={() => setMode('upload')} className={tabClass('upload')}>Upload</button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {mode === 'type' && (
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="signature-typed-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  id="signature-typed-name"
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full text-base sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/30"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Choose Calligraphy Style</span>
                <div className="grid grid-cols-2 gap-2">
                  {SIGNATURE_FONTS.map((option) => {
                    const active = option.family === fontFamily;
                    return (
                      <button
                        type="button"
                        key={option.family}
                        onClick={() => setFontFamily(option.family)}
                        className={`text-left p-3 rounded-xl transition-all flex flex-col justify-between ${
                          active ? 'border-2 border-[#136C9E] bg-blue-50/40' : 'border border-slate-200 bg-white hover:border-[#136C9E]/60'
                        }`}
                      >
                        <span
                          className="text-2xl truncate"
                          style={{ fontFamily: `"${option.family}", cursive`, color: active ? '#136C9E' : '#334155' }}
                        >
                          {typedName.trim() || 'Your Signature'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 mt-1">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {mode === 'draw' && (
            <div className="flex flex-col gap-3">
              <div ref={padWrapRef} className="w-full overflow-hidden">
                <SignaturePadComponent
                  key={`${inkColor}-${padWidth}`}
                  onSignatureChange={setDrawnSignature}
                  width={padWidth}
                  height={Math.round(padWidth / 2.5)}
                  penColor={inkColor}
                />
              </div>
              <p className="text-[11px] text-slate-400">Changing the ink colour clears the pad.</p>
            </div>
          )}

          {mode === 'upload' && (
            <div className="flex flex-col gap-3">
              <div className="relative border-2 border-dashed border-slate-300 hover:border-[#136C9E] bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Upload signature image"
                />
                <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-800">Upload signature image</span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG with a transparent background works best</span>
              </div>
              {uploadedSignature && (
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-center">
                  <img src={uploadedSignature} alt="Uploaded signature" className="max-h-16 object-contain" />
                </div>
              )}
            </div>
          )}

          {mode !== 'upload' && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Ink:</span>
              {INK_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setInkColor(color)}
                  aria-label={`Ink colour ${color}`}
                  className={`w-5 h-5 rounded-full ${inkColor === color ? 'ring-2 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color, ['--tw-ring-color' as string]: color }}
                />
              ))}
            </div>
          )}

          <label className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 leading-normal flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#136C9E]"
            />
            <span>I agree that this signature is my legally binding electronic signature for this document.</span>
          </label>

          {adoptError && <p className="text-xs text-red-600">{adoptError}</p>}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleAdopt()}
            disabled={!signatureReady || !consented || isAdopting}
            className="px-5 py-2 rounded-xl bg-[#136C9E] hover:bg-[#0f567e] text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isAdopting ? 'Preparing…' : 'Adopt & Apply to Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureModal;
