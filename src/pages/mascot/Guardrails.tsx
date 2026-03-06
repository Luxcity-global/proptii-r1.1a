import React from 'react';

const MascotGuardrails: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        Guardrails & forbidden implementations
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        These rules keep Scout recognisable and on-brand. When something isn&apos;t covered here, choose the simplest
        treatment and check with the brand team before you ship.
      </p>

      <div
        id="guardrails-do-dont"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Do</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Keep compositions simple, with Scout as the clear focal point.</li>
            <li>· Use approved poses, expressions, and files from the Downloads tab.</li>
            <li>· Place Scout in moments of guidance, reassurance, or completion – not for every state.</li>
            <li>· Ask the brand team if you&apos;re exploring a new context or treatment.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-[#FFF4F4] border border-[#F97373] shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#B91C1C] mb-3">Don&apos;t</h3>
          <ul className="text-sm text-[#7F1D1D] space-y-2">
            <li>· Don&apos;t use complex, cluttered scenes where Scout is tiny or lost.</li>
            <li>· Don&apos;t create pins or small metal items that include the full body – use face-only instead.</li>
            <li>· Don&apos;t use Scout in loading animations or spinners that block interaction.</li>
            <li>· Don&apos;t remix Scout with off-brand props, costumes, memes, or trends that could date quickly.</li>
          </ul>
        </div>
      </div>

      <div
        id="guardrails-before-after"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
      >
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Before / after – composition</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#374957]">
            <div className="border border-dashed border-[#F97373] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Cluttered scene, tiny Scout, many props.
            </div>
            <div className="border border-dashed border-[#22C55E] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Clean background, Scout as clear focal point.
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Before / after – detail level</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#374957]">
            <div className="border border-dashed border-[#F97373] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Over‑rendered fur, complex lighting, realistic props.
            </div>
            <div className="border border-dashed border-[#22C55E] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Soft, stylised fur and simple lighting that matches UI.
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-[#0F2537] mb-2">Before / after – usage</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#374957]">
            <div className="border border-dashed border-[#F97373] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Scout as loading spinner, blocking interaction.
            </div>
            <div className="border border-dashed border-[#22C55E] rounded-lg h-20 flex items-center justify-center text-center px-2">
              Scout in a completion or success state, after the task is done, never covering controls or critical
              content.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MascotGuardrails;

