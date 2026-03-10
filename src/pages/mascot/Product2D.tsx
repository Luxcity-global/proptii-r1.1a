import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

type PosePreview = { src: string; caption: string; downloadFilename: string } | null;

const POSE_LIBRARY_BASE = '/images/mascot poses/2D';

const poseGallery: { src: string; caption: string; downloadFilename: string }[] = [
  { src: `${POSE_LIBRARY_BASE}/Pose 1 - Relaxed Stance.png`, caption: 'Pose 1 – Relaxed stance', downloadFilename: 'Scout-2D-pose-1-relaxed.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 2 - Greeting.png`, caption: 'Pose 2 – Greeting', downloadFilename: 'Scout-2D-pose-2-greeting.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 3 - Thinking.png`, caption: 'Pose 3 – Thinking', downloadFilename: 'Scout-2D-pose-3-thinking.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 4 - Helpful.png`, caption: 'Pose 4 – Helpful', downloadFilename: 'Scout-2D-pose-4-helpful.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 5 - Listening.png`, caption: 'Pose 5 – Listening', downloadFilename: 'Scout-2D-pose-5-listening.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 6 - Encouraging.png`, caption: 'Pose 6 – Encouraging', downloadFilename: 'Scout-2D-pose-6-encouraging.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 7 - Focused.png`, caption: 'Pose 7 – Focused', downloadFilename: 'Scout-2D-pose-7-focused.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 8 - Curious.png`, caption: 'Pose 8 – Curious', downloadFilename: 'Scout-2D-pose-8-curious.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 9 - Confident.png`, caption: 'Pose 9 – Confident', downloadFilename: 'Scout-2D-pose-9-confident.png' },
  { src: `${POSE_LIBRARY_BASE}/Pose 10 - Empathetic.png`, caption: 'Pose 10 – Empathetic', downloadFilename: 'Scout-2D-pose-10-empathetic.png' },
];

const Product2D: React.FC = () => {
  const [posePreview, setPosePreview] = useState<PosePreview>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        2D implementation
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        Use 2D Scout wherever clarity and speed matter most. The 2D system is built to feel native to the interface grid
        and typography.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div
          id="product2d-primary-usage"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Primary usage contexts</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Web and mobile UI surfaces</li>
            <li>· Dashboard empty states and helper panels</li>
            <li>· Tooltips, inline tips, and form feedback</li>
            <li>· Product emails and notifications</li>
            <li>· Help centre documentation and guides</li>
          </ul>
        </div>

        <div
          id="product2d-rendering-rules"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Rendering rules (2D)</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Flat vector only (no gradients or painterly shading)</li>
            <li>· Minimal cel shading to keep forms readable at small sizes</li>
            <li>· Background is transparent or white only</li>
            <li>· No realistic textures, noise, or photographic elements</li>
            <li>· Stroke and corner radii should align with product UI language</li>
          </ul>
        </div>
      </div>

      <div
        id="product2d-scenarios"
        className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
      >
        <h3 className="text-base font-semibold text-[#0F2537] mb-3">Common scenarios (product)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#374957]">
          <div className="rounded-xl bg-[#F3FAFF] border border-[#D9ECFF] p-3">
            <p className="font-semibold mb-1">Empty state</p>
            <p className="mb-1">Layer: Product</p>
            <p className="mb-1">Asset: 2D, small to medium.</p>
            <p className="text-[#6B7280]">
              Use when there&apos;s no data yet and Scout can explain what will appear here.
            </p>
          </div>
          <div className="rounded-xl bg-[#FDF8EE] border border-[#F4D9A2] p-3">
            <p className="font-semibold mb-1">Form feedback</p>
            <p className="mb-1">Layer: Product</p>
            <p className="mb-1">Asset: 2D icon‑scale.</p>
            <p className="text-[#6B7280]">
              Use for success or gentle error moments alongside clear text.
            </p>
          </div>
          <div className="rounded-xl bg-[#F4F5FF] border border-[#D5D8FF] p-3">
            <p className="font-semibold mb-1">Help panel</p>
            <p className="mb-1">Layer: Product</p>
            <p className="mb-1">Asset: 2D medium pose.</p>
            <p className="text-[#6B7280]">
              Use when Scout introduces a help article, checklist, or getting‑started guide.
            </p>
          </div>
        </div>
      </div>

      <div
        id="product2d-pose-library"
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Pose library</h3>
          <p className="text-xs text-[#6B7280] mb-2">
            Use these core poses as the default set for 2D Scout.
          </p>
          <ul className="text-xs text-[#374957] space-y-1 mb-4">
            <li>Relaxed stance – onboarding overview</li>
            <li>Greeting – pointing to UI</li>
            <li>Thinking / helpful – open paws</li>
            <li>Encouraging – small jump</li>
          </ul>
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold border-2 border-[#136C9E] text-[#136C9E] bg-white hover:bg-[#136C9E]/5 transition-colors"
          >
            View gallery
          </button>
        </div>
        <div className="flex flex-col gap-1.5 h-full min-h-0">
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Relaxed stance</p>
          <button
            type="button"
            onClick={() => setPosePreview(poseGallery[0])}
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src={`${POSE_LIBRARY_BASE}/Pose 1 - Relaxed Stance.png`}
              alt="2D Scout relaxed stance"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 h-full min-h-0">
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Greeting</p>
          <button
            type="button"
            onClick={() => setPosePreview(poseGallery[1])}
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src={`${POSE_LIBRARY_BASE}/Pose 2 - Greeting.png`}
              alt="2D Scout greeting pose"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 h-full min-h-0">
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Encouraging</p>
          <button
            type="button"
            onClick={() => setPosePreview(poseGallery[5])}
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src={`${POSE_LIBRARY_BASE}/Pose 6 - Encouraging.png`}
              alt="2D Scout encouraging pose"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {galleryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="2D pose library gallery"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-[#0F2537]">Pose library</h3>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close gallery"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <p className="text-sm text-[#6B7280] mb-4">
                Click any image to view full size and download.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {poseGallery.map((pose) => (
                  <div key={pose.src} className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-[#0F2537] line-clamp-2">{pose.caption}</p>
                    <button
                      type="button"
                      onClick={() => setPosePreview(pose)}
                      className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                    >
                      <img
                        src={pose.src}
                        alt={pose.caption}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {posePreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pose preview"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setPosePreview(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-sm font-semibold text-[#0F2537]">{posePreview.caption}</p>
              <div className="flex items-center gap-2">
                <a
                  href={posePreview.src}
                  download={posePreview.downloadFilename}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#136C9E] text-white hover:bg-[#0F5A85] transition-colors"
                >
                  <Download size={16} />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPosePreview(null)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-4 flex items-center justify-center bg-gray-50">
              <img
                src={posePreview.src}
                alt={posePreview.caption}
                className="max-w-full max-h-[calc(90vh-80px)] w-auto h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div
        id="product2d-do-dont"
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="rounded-2xl bg-[#F3FAFF] border border-[#CFE6FF] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#136C9E] mb-2">
            Do
          </p>
          <p className="text-sm text-[#374957]">
            Use 2D Scout in product empty states, inline helpers, and onboarding flows where the primary goal is clarity
            and reassurance.
          </p>
        </div>
        <div className="rounded-2xl bg-[#FFF4F0] border border-[#F6B299] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B73A16] mb-2">
            Don&apos;t
          </p>
          <p className="text-sm text-[#374957]">
            Don&apos;t use 3D or highly rendered versions of Scout in core UI where they compete with controls, inputs,
            or key data.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Product2D;

