import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { COMING_SOON_COPY, parseComingSoonFeature } from '../utils/comingSoonNavigation';

const ComingSoonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const feature = parseComingSoonFeature(searchParams.get('feature'));
  const copy = feature ? COMING_SOON_COPY[feature] : null;

  return (
    <div className="min-h-screen flex flex-col font-nunito bg-[#f5f6f8]">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-20 md:py-24 min-h-[85vh] relative">
        {/* Background texture / gradients (main area only, so it won't affect Footer) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#E65D24]/20 blur-3xl" />
          <div className="absolute top-10 right-[-80px] h-80 w-80 rounded-full bg-[#3D2E1A]/10 blur-3xl" />
          <div className="absolute bottom-[-140px] left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
        </div>

        <div className="w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm">
            {/* Accent shapes */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-24 h-56 w-56 rounded-full bg-[#E65D24]/15 blur-2xl" />
              <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#6BB2E8]/10 blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(230,93,36,0.14),transparent_45%)]" />
            </div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-12">
                {/* Left: illustration (reuses onboarding dog) */}
                <div className="flex-shrink-0 w-full md:w-auto md:max-w-[320px] flex justify-center md:justify-end">
                  <img
                    src="/images/onboard%20que.png"
                    alt=""
                    className="w-56 md:w-72 h-auto object-contain object-bottom transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>

                {/* Right: copy */}
                <div className="flex-1 w-full text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-gray-200 px-4 py-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-[#E65D24] animate-pulse" />
                    <span className="font-semibold uppercase tracking-wider text-[#E65D24]">
                      Coming soon
                    </span>
                  </div>

                  <h1 className="mt-6 text-3xl md:text-4xl font-bold text-[#374957] leading-tight">
                    {copy?.title ?? 'This feature is coming soon'}
                  </h1>

                  <p className="mt-4 mx-auto md:mx-0 max-w-2xl text-gray-600 leading-relaxed">
                    {copy?.description ??
                      'We are working on this experience. Check back later or explore the rest of Proptii from the home page.'}
                  </p>

                  <div className="mt-8 flex flex-col gap-3 max-w-md">
                    <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Want a heads-up?
                      </p>
                      <p className="text-sm text-gray-700">
                        We’ll surface this in your dashboard as soon as it’s ready.
                      </p>
                    </div>
                    <Link
                      to="/home-v2"
                      className="inline-flex items-center justify-center rounded-xl bg-[#E65D24] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#cf4f1c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E65D24] focus-visible:ring-offset-2"
                    >
                      Back to home
                    </Link>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-500">
                    <span className="rounded-full bg-white/70 border border-gray-200 px-3 py-1">
                      Built for landlords
                    </span>
                    <span className="rounded-full bg-white/70 border border-gray-200 px-3 py-1">
                      Zero hassle
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoonPage;
