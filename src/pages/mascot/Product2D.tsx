import React from 'react';

const Product2D: React.FC = () => {
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
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Pose library – product</h3>
          <p className="text-xs text-[#6B7280] mb-2">
            Use these core poses as the default set for 2D Scout.
          </p>
          <ul className="text-xs text-[#374957] space-y-1">
            <li>Hero pose – onboarding overview</li>
            <li>Helping pose – pointing to UI</li>
            <li>Explaining pose – open paws</li>
            <li>Celebrating pose – small jump</li>
          </ul>
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          Hero pose placeholder
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          Helping pose placeholder
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center text-[11px] text-gray-400">
          Explaining / celebrating pose placeholder
        </div>
      </div>

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

