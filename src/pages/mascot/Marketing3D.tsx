import React from 'react';

const Marketing3D: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        3D implementation (marketing)
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        3D Scout is reserved for high-attention marketing surfaces where emotional pull and storytelling are the
        priority.
      </p>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#0F2537] mb-1">2D vs 3D comparison</h3>
            <p className="text-xs text-[#6B7280]">
              Future interactive component: toggle between 2D and 3D versions of the same pose to compare usage.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center text-xs text-gray-400">
            2D Scout pose placeholder
          </div>
          <div className="border border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center text-xs text-gray-400">
            3D Scout pose placeholder
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
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

      <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Pose library – marketing</h3>
          <p className="text-xs text-[#6B7280] mb-2">
            Use these core poses for 3D Scout in campaigns and hero visuals.
          </p>
          <ul className="text-xs text-[#374957] space-y-1">
            <li>Hero pose – facing camera</li>
            <li>Welcoming pose – arm open to UI</li>
            <li>Spotlight pose – slightly angled</li>
            <li>Celebration pose – bigger movement</li>
          </ul>
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          3D hero pose placeholder
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          Welcoming pose placeholder
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          Spotlight / celebration pose placeholder
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </section>
  );
};

export default Marketing3D;

