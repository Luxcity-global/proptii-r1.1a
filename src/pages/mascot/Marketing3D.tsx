import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

type PosePreview = { src: string; caption: string; downloadFilename: string } | null;

const POSE_LIBRARY_BASE = '/images/mascot poses/3D';

const poseGallery: { src: string; caption: string; downloadFilename: string }[] = [
  { src: `${POSE_LIBRARY_BASE}/Hero pose.jpg`, caption: 'Hero pose – facing camera', downloadFilename: 'Scout-3D-hero-pose.jpg' },
  { src: `${POSE_LIBRARY_BASE}/Welcome pose.jpg`, caption: 'Welcoming pose – arm open to UI', downloadFilename: 'Scout-3D-welcome-pose.jpg' },
  { src: `${POSE_LIBRARY_BASE}/Celebration pose.jpg`, caption: 'Celebration pose – bigger movement', downloadFilename: 'Scout-3D-celebration-pose.jpg' },
  { src: `${POSE_LIBRARY_BASE}/Expression 1 - Neutral idle 2.png`, caption: 'Expression 1 – Neutral idle', downloadFilename: 'Scout-3D-expression-1-neutral-idle.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 2 - Happy Success.png`, caption: 'Expression 2 – Happy success', downloadFilename: 'Scout-3D-expression-2-happy-success.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 3 - Thinking.png`, caption: 'Expression 3 – Thinking', downloadFilename: 'Scout-3D-expression-3-thinking.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 4 - Helpful.png`, caption: 'Expression 4 – Helpful', downloadFilename: 'Scout-3D-expression-4-helpful.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 5 - Listening.png`, caption: 'Expression 5 – Listening', downloadFilename: 'Scout-3D-expression-5-listening.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 6 - Encouragement.png`, caption: 'Expression 6 – Encouragement', downloadFilename: 'Scout-3D-expression-6-encouragement.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 7 - Focused.png`, caption: 'Expression 7 – Focused', downloadFilename: 'Scout-3D-expression-7-focused.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 8 - Curiosity.png`, caption: 'Expression 8 – Curiosity', downloadFilename: 'Scout-3D-expression-8-curiosity.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 9 - Confidence.png`, caption: 'Expression 9 – Confidence', downloadFilename: 'Scout-3D-expression-9-confidence.png' },
  { src: `${POSE_LIBRARY_BASE}/Expression 10 - Empathetic.png`, caption: 'Expression 10 – Empathetic', downloadFilename: 'Scout-3D-expression-10-empathetic.png' },
];

const Marketing3D: React.FC = () => {
  const [posePreview, setPosePreview] = useState<PosePreview>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        3D implementation
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        3D Scout is reserved for high-attention marketing surfaces where emotional pull and storytelling are the
        priority.
      </p>

      <div
        id="marketing3d-comparison"
        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#0F2537] mb-1">2D vs 3D comparison</h3>
            <p className="text-xs text-[#6B7280]">
              Future interactive component: toggle between 2D and 3D versions of the same pose to compare usage.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl h-40 overflow-hidden bg-gray-50 flex items-center justify-center">
            <img
              src="/images/2D wave.png"
              alt="2D Scout wave pose"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="rounded-xl h-40 overflow-hidden bg-gray-50 flex items-center justify-center">
            <img
              src="/images/3D wave.png"
              alt="3D Scout wave pose"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      <div
        id="marketing3d-usage-contexts"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Primary usage contexts</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Website and app hero sections</li>
            <li>· Landing pages and campaign microsites</li>
            <li>· Social campaigns and paid ads</li>
            <li>· App store graphics and thumbnails</li>
            <li>· Product videos, explainers, and investor decks</li>
          </ul>
        </div>

        <div
          id="marketing3d-rendering-rules"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Rendering rules (3D)</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Soft, groomed fur with controlled, repeatable texture</li>
            <li>· Warm studio lighting with a clean, uncluttered background</li>
            <li>· Gentle depth of field to keep Scout in focus</li>
            <li>· Avoid harsh shadows, specular highlights, or hyper-real materials</li>
            <li>· Keep proportions and expressions aligned with 2D system</li>
          </ul>
        </div>
      </div>

      <div
        id="marketing3d-scenarios"
        className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
      >
        <h3 className="text-base font-semibold text-[#0F2537] mb-3">Common scenarios (marketing)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#374957]">
          <div className="rounded-xl bg-[#F3FAFF] border border-[#D9ECFF] p-3">
            <p className="font-semibold mb-1">Website hero</p>
            <p className="mb-1">Layer: Marketing</p>
            <p className="mb-1">Asset: 3D, large hero pose.</p>
            <p className="text-[#6B7280]">
              Use for top‑of‑page moments that introduce the product story.
            </p>
          </div>
          <div className="rounded-xl bg-[#FDF8EE] border border-[#F4D9A2] p-3">
            <p className="font-semibold mb-1">Social teaser</p>
            <p className="mb-1">Layer: Marketing</p>
            <p className="mb-1">Asset: 3D crop or close‑up.</p>
            <p className="text-[#6B7280]">
              Use when highlighting launches, campaigns, or new tools.
            </p>
          </div>
          <div className="rounded-xl bg-[#F4F5FF] border border-[#D5D8FF] p-3">
            <p className="font-semibold mb-1">Email header</p>
            <p className="mb-1">Layer: Marketing</p>
            <p className="mb-1">Asset: 2D or light 3D, medium.</p>
            <p className="text-[#6B7280]">
              Use for lifecycle, onboarding, or campaign emails where Scout opens the message.
            </p>
          </div>
        </div>
      </div>

      <div
        id="marketing3d-pose-library"
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Pose library</h3>
          <p className="text-xs text-[#6B7280] mb-2">
            Use these core poses for 3D Scout in campaigns and hero visuals.
          </p>
          <ul className="text-xs text-[#374957] space-y-1 mb-4">
            <li>Hero pose – facing camera</li>
            <li>Welcoming pose – arm open to UI</li>
            <li>Spotlight pose – slightly angled</li>
            <li>Celebration pose – bigger movement</li>
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
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Hero pose</p>
          <button
            type="button"
            onClick={() =>
              setPosePreview({
                src: '/images/mascot poses/3D/Hero pose.jpg',
                caption: 'Hero pose – facing camera',
                downloadFilename: 'Scout-3D-hero-pose.jpg',
              })
            }
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src="/images/mascot poses/3D/Hero pose.jpg"
              alt="3D Scout hero pose – facing camera"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 h-full min-h-0">
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Welcoming pose</p>
          <button
            type="button"
            onClick={() =>
              setPosePreview({
                src: '/images/mascot poses/3D/Welcome pose.jpg',
                caption: 'Welcoming pose – arm open to UI',
                downloadFilename: 'Scout-3D-welcome-pose.jpg',
              })
            }
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src="/images/mascot poses/3D/Welcome pose.jpg"
              alt="3D Scout welcoming pose – arm open to UI"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 h-full min-h-0">
          <p className="text-xs font-semibold text-[#0F2537] shrink-0">Celebration pose</p>
          <button
            type="button"
            onClick={() =>
              setPosePreview({
                src: '/images/mascot poses/3D/Celebration pose.jpg',
                caption: 'Celebration pose – bigger movement',
                downloadFilename: 'Scout-3D-celebration-pose.jpg',
              })
            }
            className="flex-1 min-h-0 rounded-xl min-w-[180px] overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#136C9E]/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
          >
            <img
              src="/images/mascot poses/3D/Celebration pose.jpg"
              alt="3D Scout celebration pose – bigger movement"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {galleryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pose library gallery"
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

      <div
        id="marketing3d-do-dont"
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="rounded-2xl bg-[#F3FAFF] border border-[#CFE6FF] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#136C9E] mb-2">
            Do
          </p>
          <p className="text-sm text-[#374957]">
            Use 3D Scout in campaign hero visuals, launch pages, and social where the goal is to grab attention and
            create emotional connection.
          </p>
        </div>
        <div className="rounded-2xl bg-[#FFF4F0] border border-[#F6B299] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B73A16] mb-2">
            Don&apos;t
          </p>
          <p className="text-sm text-[#374957]">
            Don&apos;t drop highly rendered 3D Scout into dense UI or data screens where it competes with core
            information.
          </p>
        </div>
      </div>

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
    </section>
  );
};

export default Marketing3D;

