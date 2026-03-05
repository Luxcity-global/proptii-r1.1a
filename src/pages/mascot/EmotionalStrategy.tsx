import React from 'react';

const EmotionalStrategy: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold font-archivo text-[#0F2537] mb-3">
        Emotional strategy & layers
      </h2>
      <p className="text-sm md:text-base text-[#374957] mb-6 max-w-2xl">
        Scout is designed to flex across three layers of experience: product, marketing, and physical. Each layer has a
        clear job and a preferred visual expression.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-[#136C9E] uppercase tracking-[0.18em] mb-2">
            Layer 1
          </p>
          <h3 className="text-lg font-semibold text-[#0F2537] mb-2">Product layer</h3>
          <p className="text-sm text-[#374957] mb-3">
            Scout supports clarity and usability inside core product surfaces.
          </p>
          <ul className="text-xs text-[#6B7280] list-disc list-inside space-y-1">
            <li>Empty states and helper moments</li>
            <li>Light, glanceable emotion</li>
            <li>Always secondary to UI clarity</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-[#E65D24] uppercase tracking-[0.18em] mb-2">
            Layer 2
          </p>
          <h3 className="text-lg font-semibold text-[#0F2537] mb-2">Marketing layer</h3>
          <p className="text-sm text-[#374957] mb-3">
            Scout leads with emotion in storytelling, campaigns, and hero visuals.
          </p>
          <ul className="text-xs text-[#6B7280] list-disc list-inside space-y-1">
            <li>High-attention hero moments</li>
            <li>3D rendering and motion-friendly poses</li>
            <li>Supports brand narrative first</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-[#F2C94C] uppercase tracking-[0.18em] mb-2">
            Layer 3
          </p>
          <h3 className="text-lg font-semibold text-[#0F2537] mb-2">Physical layer</h3>
          <p className="text-sm text-[#374957] mb-3">
            Scout becomes a tangible object that people can hold, meet, or photograph.
          </p>
          <ul className="text-xs text-[#6B7280] list-disc list-inside space-y-1">
            <li>Plush toys and physical installations</li>
            <li>Safe, durable, and huggable</li>
            <li>Optimised for memorability and delight</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-[#0F2537] mb-2">Who is Scout?</h3>
          <p className="text-sm text-[#374957] mb-3">
            Scout is the guide who sits between people and the complexity of renting. They are curious, calm, and
            quietly competent – always nudging you forward without shouting for attention.
          </p>
          <p className="text-sm text-[#374957]">
            In every surface, Scout&apos;s job is to make the journey feel understandable, safe, and a little more
            human – not to become the story themselves.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-[#0F2537] mb-3">Personality & voice</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-[#374957]">
            <div>
              <p className="font-semibold mb-1 text-[#136C9E]">Leans towards</p>
              <ul className="space-y-1">
                <li>Supportive</li>
                <li>Clear and warm</li>
                <li>Clever, not smug</li>
                <li>Calm and reassuring</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1 text-[#B73A16]">Avoid</p>
              <ul className="space-y-1">
                <li>Sarcastic or snarky</li>
                <li>Slapstick or chaotic</li>
                <li>Childish baby talk</li>
                <li>Overly dramatic reactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-semibold text-[#0F2537] mb-3">Emotion range examples</h3>
        <p className="text-sm text-[#374957] mb-4 max-w-2xl">
          Use a narrow, intentional set of emotions so Scout feels consistent across product, marketing, and physical
          experiences.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-[#374957]">
          <div>
            <p className="font-semibold mb-1">Soft encouragement</p>
            <p className="mb-1">Small smile, relaxed posture.</p>
            <p className="text-[#6B7280]">Use for: explaining steps, empty states, gentle nudges.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Celebration</p>
            <p className="mb-1">Open smile, slight jump or raised paw.</p>
            <p className="text-[#6B7280]">Use for: milestones, approvals, finishing flows.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Warning</p>
            <p className="mb-1">Concerned eyes, grounded stance.</p>
            <p className="text-[#6B7280]">Use for: important alerts where tone should stay calm.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Focus</p>
            <p className="mb-1">Attentive eyes, leaning slightly forward.</p>
            <p className="text-[#6B7280]">Use for: walkthroughs, how‑to content, education.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmotionalStrategy;

