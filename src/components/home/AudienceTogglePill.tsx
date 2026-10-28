export type HomeAudience = 'renters' | 'landlords';

interface AudienceTogglePillProps {
  value: HomeAudience;
  onChange: (audience: HomeAudience) => void;
}

const OPTIONS: { value: HomeAudience; label: string }[] = [
  { value: 'renters', label: "I'm renting or buying" },
  { value: 'landlords', label: "I'm a landlord or agent" },
];

/** Guest-only hero toggle that switches the home hero between renter and landlord/agent experiences. */
export const AudienceTogglePill = ({ value, onChange }: AudienceTogglePillProps) => (
  <div
    className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 p-1 mb-6 md:mb-8"
    role="tablist"
    aria-label="Who are you?"
    data-testid="home-audience-toggle"
  >
    {OPTIONS.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => !selected && onChange(option.value)}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
            selected ? 'bg-white text-[#14385C]' : 'text-white/85 hover:text-white hover:bg-white/10'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
