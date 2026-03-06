import React from 'react';

const MascotOverview: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">Overview</h2>
      <div
        id="overview-at-a-glance"
        className="mb-4 rounded-2xl bg-[#F5FBFF] border border-[#CDE6F7] p-4 text-xs md:text-sm text-[#0F2537]"
      >
        <p className="font-semibold mb-1">At a glance</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use Scout to humanise complex or high-stakes moments, not as generic decoration.</li>
          <li>Prefer simple compositions where Scout is clearly readable at small sizes.</li>
          <li>If in doubt about a new context, pause and ask the brand team.</li>
        </ul>
      </div>
      <p
        id="overview-overview"
        className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl"
      >
        Scout is our brand mascot. Use this page as your primary reference for how Scout looks, behaves, and shows up
        across product, marketing, and physical touchpoints.
      </p>

      <h3
        id="overview-when-to-use"
        className="text-lg font-semibold font-archivo text-[#0F2537] mb-2"
      >
        When to use Scout
      </h3>
      <p className="text-sm md:text-base text-[#374957] mb-3 max-w-2xl">
        Use Scout when you need to humanise a moment, guide someone through a process, or add warmth without clutter.
        Good fits: empty states and first-time experiences, onboarding and help content, success or completion moments,
        campaign heroes and landing pages, and real-world touchpoints (events, merch).
      </p>
      <p className="text-sm md:text-base text-[#374957] max-w-2xl">
        Before you add Scout to a screen, campaign, or physical item, read the relevant tab: 2D, 3D, real-world &amp;
        merch, downloads, and guardrails. If your use case isn&apos;t covered, check with the brand team before
        shipping.
      </p>
    </section>
  );
};

export default MascotOverview;

