import React from 'react';
import { useNavigate } from 'react-router-dom';

type ServicesVariant = 'v1' | 'v2' | 'v3';

interface ServicesSectionProps {
  /**
   * Visual layout variant for the services strip below the hero.
   * - v1: Current Figma implementation (three feature cards on soft background)
   * - v2 / v3: Additional layout variants.
   */
  variant?: ServicesVariant;
  /** When true, renders an inline variant toggle above the section */
  showVariantToggle?: boolean;
  /** Optional callback so parent can control the active variant */
  onVariantChange?: (variant: ServicesVariant) => void;
}

interface ServiceCardConfig {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

const SERVICE_CARDS: ServiceCardConfig[] = [
  {
    id: 'book-viewing',
    title: 'Book Viewing',
    description:
      'Schedule property viewings in seconds with AI-powered booking.',
    imageSrc: '/images/viewing-room.jpg',
    imageAlt: 'Viewing room',
    href: '/bookviewing',
  },
  {
    id: 'referencing',
    title: 'Referencing',
    description:
      'Verify identity, income and rental history in one secure check.',
    imageSrc: '/images/referencing-person.jpg',
    imageAlt: 'Referencing process',
    href: '/referencing',
  },
  {
    id: 'contract',
    title: 'Contract',
    description:
      'Create and sign lease agreements fast with customizable templates.',
    imageSrc: '/images/contracts.jpg',
    imageAlt: 'Digital contracts illustration',
    href: '/contracts',
  },
];

const ServicesLayoutV1: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 md:py-24 bg-[#f5efe7] z-20 overflow-hidden font-archive">
      {/* Background image / blobs */}
      <img
        src="/images/middle-section.png"
        alt="Background design"
        loading="lazy"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="rounded-[32px] md:rounded-[40px] bg-[#0B3D5B]/95 text-white px-6 md:px-10 lg:px-16 py-10 md:py-14 lg:py-16 shadow-[0_24px_60px_rgba(0,0,0,0.32)] border border-white/5">
          {/* Heading */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-archive font-semibold tracking-tight">
              With us you can...
            </h2>
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12 items-center">
            {SERVICE_CARDS.map((card, index) => {
              const isMiddle = index === 1;

              const ImageBlock = (
                <button
                  type="button"
                  onClick={() => navigate(card.href)}
                  className="group relative block w-full overflow-hidden rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.35)] bg-slate-900/40 transform transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E65D24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3D5B]"
                >
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#062536] via-[#0B3D5B]/70 to-transparent opacity-0 origin-bottom scale-y-75 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-500 ease-out"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-6">
                    <span className="flex flex-wrap text-white text-xl md:text-2xl font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                      {card.title.split('').map((char, charIndex) => (
                        <span
                          key={`${card.id}-${charIndex}`}
                          className="inline-block opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out"
                          style={{ transitionDelay: `${90 + charIndex * 45}ms` }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                  </div>
                </button>
              );

              const TextBlock = (
                <button
                  type="button"
                  onClick={() => navigate(card.href)}
                  className="group mt-4 md:mt-6 w-full rounded-full bg-white text-left px-6 md:px-7 lg:px-8 py-4 md:py-4.5 flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] transform transition-all duration-200 ease-out hover:-translate-y-1"
                >
                  <span className="text-sm md:text-base text-slate-800 font-medium leading-relaxed">
                    {card.description}
                  </span>
                  <span className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border-[2.2px] border-[#E65D24] text-[#E65D24] bg-white group-hover:bg-[#E65D24] group-hover:text-white transition-colors duration-200 transform transition-transform duration-200 group-hover:translate-x-0.5 group-hover:rotate-45 shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.5 11.5L11 5M11 5H5.75M11 5V10.25"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              );

              return (
                <div key={card.id} className="flex flex-col items-stretch">
                  {/* Mobile: always show pill above its image */}
                  <div className="md:hidden">
                    {TextBlock}
                    <div className="mt-5">{ImageBlock}</div>
                  </div>

                  {/* Desktop: asymmetric layout from Figma */}
                  <div className="hidden md:block">
                    {isMiddle ? (
                      <>
                        {TextBlock}
                        <div className="mt-5 md:mt-7">{ImageBlock}</div>
                      </>
                    ) : (
                      <>
                        {ImageBlock}
                        {TextBlock}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const ServicesLayoutV2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 md:py-24 bg-[#f5efe7] z-20 overflow-hidden font-archive">
      <img
        src="/images/middle-section.png"
        alt="Background design"
        loading="lazy"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-multiply"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="rounded-[32px] md:rounded-[40px] px-6 md:px-10 lg:px-14 py-10 md:py-14 lg:py-16">
          <div className="mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-archive font-semibold tracking-tight text-[#374957]">
              With us you can...
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {SERVICE_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.href)}
                className="group relative flex h-full w-full min-h-[360px] md:min-h-[420px] overflow-hidden rounded-[28px] bg-slate-900 text-left shadow-[0_20px_50px_rgba(15,23,42,0.45)] transition-transform duration-200 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-[#F15A22]"
              >
                <img
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-slate-900/0" />

                <div className="relative z-10 flex w-full items-end p-6 md:p-7 lg:p-8">
                  <div className="flex w-full items-end justify-between gap-4 md:gap-5">
                    <div className="max-w-[80%]">
                      <h3 className="text-white text-xl md:text-2xl font-semibold mb-1 md:mb-1.5">
                        {card.id === 'contract' ? 'Manage Contracts' : card.title}
                      </h3>
                      <p className="text-xs md:text-sm lg:text-base text-slate-100/90 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <span className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/70 text-white bg-white/10 backdrop-blur-sm transition-all duration-200 transform group-hover:bg-white group-hover:text-[#1E293B] group-hover:translate-x-0.5 group-hover:rotate-45 shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.5 11.5L11 5M11 5H5.75M11 5V10.25"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ServicesLayoutV3: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 md:py-24 bg-[#f5efe7] z-20 overflow-hidden font-archive">
      {/* Shared soft blob background behind container */}
      <img
        src="/images/middle-section.png"
        alt="Background design"
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
      />

      <div className="relative max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Shared card + heading container with iso background inside */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[40px] bg-white/80 border border-[#E5E7EB] shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
          {/* Iso background image behind heading + cards */}
          <img
            src="/images/proptii iso.png"
            alt="Proptii background motif"
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-70 origin-center scale-[0.6] md:scale-75"
          />

          <div className="relative z-10 px-6 md:px-10 lg:px-14 py-10 md:py-14 lg:py-16">
            {/* Heading */}
            <div className="mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-archive font-semibold tracking-tight text-[#374957]">
                What we offer
              </h2>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {SERVICE_CARDS.map((card) => (
            <article
              key={card.id}
              className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-[#E5E7EB]"
            >
              <div className="overflow-hidden">
                <img
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              <div className="flex flex-1 flex-col px-6 md:px-7 lg:px-8 pt-5 md:pt-6 pb-6 md:pb-7 font-archive">
                <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2 md:mb-2.5">
                  {card.id === 'contract'
                    ? 'Contract'
                    : card.id === 'referencing'
                      ? 'Referencing'
                      : card.title}
                </h3>

                <p className="text-sm md:text-base text-[#374957] leading-relaxed flex-1 mb-5 md:mb-6">
                  {card.id === 'book-viewing'
                    ? 'Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.'
                    : card.id === 'referencing'
                      ? 'Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.'
                      : 'Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.'}
                </p>

                <button
                  type="button"
                  onClick={() => navigate(card.href)}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#F15A22] text-[#F15A22] px-7 py-3.5 text-sm font-semibold tracking-wide bg-white hover:bg-[#FFF4EE] transition-colors duration-200"
                >
                  <span>Learn More</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current transform transition-transform duration-200 group-hover:translate-x-0.5 group-hover:rotate-45">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.5 11.5L11 5M11 5H5.75M11 5V10.25"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </article>
          ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  variant = 'v1',
  showVariantToggle = false,
  onVariantChange,
}) => {
  const currentVariant = variant;

  const renderLayout = () => {
    switch (currentVariant) {
      case 'v2':
        return <ServicesLayoutV2 />;
      case 'v3':
        return <ServicesLayoutV3 />;
      case 'v1':
      default:
        return <ServicesLayoutV1 />;
    }
  };

  if (!showVariantToggle) {
    return renderLayout();
  }

  return (
    <div className="relative bg-[#f5efe7]">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-3 text-sm text-[#374957] mb-3 md:mb-4">
        <span className="hidden md:inline text-xs uppercase tracking-[0.18em] text-[#6B7280]">
          Services layout
        </span>
        <div className="inline-flex rounded-full border border-[#E5E7EB] bg-white/80 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => onVariantChange?.('v1')}
            className={`px-3.5 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors ${
              currentVariant === 'v1'
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
          >
            Variant 1
          </button>
          <button
            type="button"
            onClick={() => onVariantChange?.('v2')}
            className={`px-3.5 md:px-4 py-1.5 text-xs md:text-sm font-medium border-l border-[#E5E7EB] transition-colors ${
              currentVariant === 'v2'
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
          >
            Variant 2
          </button>
          <button
            type="button"
            onClick={() => onVariantChange?.('v3')}
            className={`px-3.5 md:px-4 py-1.5 text-xs md:text-sm font-medium border-l border-[#E5E7EB] transition-colors ${
              currentVariant === 'v3'
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
          >
            Variant 3
          </button>
        </div>
      </div>

      {renderLayout()}
    </div>
  );
};