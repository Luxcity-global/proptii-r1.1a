import React, { useState } from 'react';
import { PRICING_FAQS } from './compareData';

/** S2-08 — FAQ accordion (min 5 items). */
const PricingFaqSection: React.FC = () => {
  const [openFaqs, setOpenFaqs] = useState<number[]>([0]);

  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  return (
    <section className="pr-faq-wrap">
      <div className="pr-faq-section">
        <h3>Frequently Asked Questions</h3>
        <p className="sub">
          Get quick answers about our pricing and plans — whether you are a tenant,
          landlord, or agent.
        </p>
        <div className="pr-faq-list">
          {PRICING_FAQS.map((faq, i) => (
            <div
              key={i}
              className={`pr-faq-item${openFaqs.includes(i) ? ' open' : ''}`}
            >
              <button
                type="button"
                className="pr-faq-q"
                onClick={() => toggleFaq(i)}
              >
                {faq.q}
                <span className="pr-faq-icon">
                  <svg viewBox="0 0 14 14">
                    <line x1="7" y1="2" x2="7" y2="12" />
                    <line x1="2" y1="7" x2="12" y2="7" />
                  </svg>
                </span>
              </button>
              <div className="pr-faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingFaqSection;
