import React from 'react';

const RealWorld: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        Real-world & merchandise
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        When Scout becomes a physical object, we prioritise safety, durability, and recognisability. These specs apply
        to plush toys, statues, and character suits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Plush toy specs</h3>
          <ul className="text-sm text-[#374957] space-y-2">
            <li>· Simplified vest and accessory detail for manufacturability</li>
            <li>· Slightly increased head size for added cuteness</li>
            <li>· Embroidered eyes (no glued or hard plastic parts)</li>
            <li>· No small zipper pulls or detachable elements</li>
            <li>· Short plush microfibre with soft cotton fill and a velvet nose</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Convention & booth assets</h3>
          <ul className="text-sm text-[#374957] space-y-2 mb-4">
            <li>· Option A: 3–5 ft statue with matte paint finish and stable base</li>
            <li>· Option B: Foam character suit with oversized head and cooling ventilation</li>
            <li>· Both options: large, readable facial expression from a distance</li>
          </ul>
          <p className="text-xs text-[#B73A16] font-medium">
            Never exaggerate Scout into theme-park cartoon territory or off-model proportions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default RealWorld;

