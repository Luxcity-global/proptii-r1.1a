import React from 'react';

const MascotDownloads: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        Downloads & approved assets
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        Use only the approved, up-to-date Scout assets from this section. Each asset includes guidance on where and how
        it should be used.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          id="downloads-2d-assets"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center text-xs text-gray-400">
            Sticker sheet preview
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[#0F2537] mb-1">Scout sticker pack (2D)</h3>
            <p className="text-xs text-[#6B7280] mb-3">
              For internal docs, slides, and light-touch product moments.
            </p>
            <button
              type="button"
              className="mt-auto inline-flex justify-center rounded-full border border-[#E65D24] text-[#E65D24] text-xs font-semibold px-4 py-1.5 bg-white hover:bg-[#FFF3EB] transition-colors"
            >
              Download (coming soon)
            </button>
          </div>
        </div>

        <div
          id="downloads-print-swag"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center text-xs text-gray-400">
            Notebook cover mockup
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[#0F2537] mb-1">Notebook & cover art</h3>
            <p className="text-xs text-[#6B7280] mb-3">
              For swag, internal events, and partner giveaways.
            </p>
            <button
              type="button"
              className="mt-auto inline-flex justify-center rounded-full border border-[#E65D24] text-[#E65D24] text-xs font-semibold px-4 py-1.5 bg-white hover:bg-[#FFF3EB] transition-colors"
            >
              Download (coming soon)
            </button>
          </div>
        </div>

        <div
          id="downloads-merch-artwork"
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center text-xs text-gray-400">
            T‑shirt mockup
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[#0F2537] mb-1">T-shirt artwork</h3>
            <p className="text-xs text-[#6B7280] mb-3">
              For events, internal swag, and partner activations.
            </p>
            <button
              type="button"
              className="mt-auto inline-flex justify-center rounded-full border border-[#E65D24] text-[#E65D24] text-xs font-semibold px-4 py-1.5 bg-white hover:bg-[#FFF3EB] transition-colors"
            >
              Download (coming soon)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MascotDownloads;

