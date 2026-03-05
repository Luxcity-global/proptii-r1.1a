import React from 'react';

const MascotOverview: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        Overview
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-4 max-w-2xl">
        This section introduces Scout as a mini design system within the broader Proptii brand. Use it as the primary
        reference for how Scout appears across product, marketing, and real-world experiences.
      </p>
      <p className="text-sm md:text-base text-[#374957] max-w-2xl">
        Designers, developers, and marketers should start here before creating new work with Scout. The other tabs go
        deeper into specific layers: product 2D usage, 3D marketing applications, physical executions, downloads, and
        strict guardrails.
      </p>
    </section>
  );
};

export default MascotOverview;

