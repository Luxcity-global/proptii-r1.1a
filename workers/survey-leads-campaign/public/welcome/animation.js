/**
 * Proptii Bespoke Welcome Landing Page
 * Interactive Unboxing Sequence, Confetti Engine, & Real Estate Photo Slideshow
 */

(function () {
  'use strict';

  // --- Confetti Engine ---
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let confettiAnimationId = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const BRAND_COLORS = [
    '#DC5F12', // Proptii Orange
    '#f97316', // Bright Tangerine
    '#136C9E', // Proptii Blue
    '#0f766e', // Deep Teal
    '#f59e0b', // Luxury Gold
    '#10b981', // Emerald
    '#ffffff', // Sparkle White
    '#fde047'  // Yellow Gold
  ];

  class ConfettiParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 16;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - (4 + Math.random() * 6);
      this.size = 6 + Math.random() * 8;
      this.color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 12;
      this.tilt = Math.random() * 10;
      this.tiltSpeed = 0.08 + Math.random() * 0.12;
      this.tiltAngle = 0;
      this.gravity = 0.28 + Math.random() * 0.18;
      this.drag = 0.96;
      this.opacity = 1;
      this.decay = 0.003 + Math.random() * 0.005;
      this.isRibbon = Math.random() > 0.6;
    }

    update() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.tiltAngle += this.tiltSpeed;
      this.tilt = Math.sin(this.tiltAngle) * 12;
      this.opacity -= this.decay;
    }

    draw(ctx) {
      if (this.opacity <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;

      if (this.isRibbon) {
        ctx.fillRect(-this.size / 2, -this.size * 1.5, this.size * 0.8, this.size * 2.6);
      } else {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size + this.tilt);
      }
      ctx.restore();
    }
  }

  function launchConfetti(originX, originY, count = 220) {
    if (!ctx) return;
    resizeCanvas();
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new ConfettiParticle(originX, originY));
    }

    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.opacity <= 0 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiAnimationId = null;
      }
    }

    render();
  }

  // --- Unboxing Sequence Controller ---
  const overlay = document.getElementById('unboxing-overlay');
  const giftBox = document.getElementById('gift-box');
  const boxGlow = document.getElementById('box-glow');
  const boxShadow = document.getElementById('box-shadow');
  const statusTitle = document.getElementById('unboxing-title');
  const statusSub = document.getElementById('unboxing-subtitle');
  const welcomePage = document.getElementById('welcome-page');
  const replayBtn = document.getElementById('replay-btn');
  const skipBtn = document.getElementById('unboxing-skip');

  let isAnimating = false;
  let timeouts = [];

  function clearAllTimeouts() {
    timeouts.forEach((t) => clearTimeout(t));
    timeouts = [];
  }

  function runUnboxingSequence() {
    if (isAnimating) return;
    isAnimating = true;
    clearAllTimeouts();

    overlay.classList.remove('hidden');
    welcomePage.classList.remove('visible');
    giftBox.classList.remove('entered', 'shaking', 'bursting');
    boxGlow.classList.remove('active', 'burst');
    boxShadow.classList.remove('shaking');
    
    if (statusTitle) statusTitle.textContent = "Unlocking your VIP reward...";
    if (statusSub) statusSub.textContent = "Thank you for completing our survey!";

    timeouts.push(
      setTimeout(() => {
        giftBox.classList.add('entered');
        boxGlow.classList.add('active');
      }, 150)
    );

    timeouts.push(
      setTimeout(() => {
        giftBox.classList.add('shaking');
        boxShadow.classList.add('shaking');
        if (statusTitle) statusTitle.textContent = "Preparing your 1-month free trial...";
        if (statusSub) statusSub.textContent = "Exclusive access generated for UK property portfolios";
      }, 950)
    );

    timeouts.push(
      setTimeout(() => {
        giftBox.classList.remove('shaking');
        giftBox.classList.add('bursting');
        boxGlow.classList.add('burst');
        if (statusTitle) statusTitle.textContent = "Reward Unlocked!";
        if (statusSub) statusSub.textContent = "Welcome to Proptii. Your free month is ready.";

        const rect = giftBox.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        launchConfetti(originX, originY, 260);
      }, 2450)
    );

    timeouts.push(
      setTimeout(() => {
        overlay.classList.add('hidden');
        welcomePage.classList.add('visible');
        isAnimating = false;
      }, 3350)
    );
  }

  function skipToPage() {
    clearAllTimeouts();
    if (giftBox) giftBox.classList.remove('shaking', 'bursting');
    if (overlay) overlay.classList.add('hidden');
    if (welcomePage) welcomePage.classList.add('visible');
    isAnimating = false;
  }

  // --- Real Estate Photo Slideshow Controller ---
  const slides = document.querySelectorAll('.slide-item');
  const dots = document.querySelectorAll('.indicator-dot');
  const prevBtn = document.getElementById('slide-prev');
  const nextBtn = document.getElementById('slide-next');
  const badgeTitle = document.getElementById('badge-title');
  const badgeDesc = document.getElementById('badge-desc');
  const categoryText = document.getElementById('slide-category-text');
  const slideshowContainer = document.getElementById('property-slideshow');

  let currentSlideIndex = 0;
  let slideshowTimer = null;
  const SLIDE_DURATION = 4200;

  function showSlide(index) {
    if (!slides.length) return;
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlideIndex = index;

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === currentSlideIndex);
    });

    dots.forEach((d, i) => {
      d.classList.toggle('active', i === currentSlideIndex);
    });

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      const title = activeSlide.getAttribute('data-title');
      const desc = activeSlide.getAttribute('data-desc');
      const category = activeSlide.getAttribute('data-category');

      if (badgeTitle && title) {
        const textSpan = badgeTitle.querySelector('span');
        if (textSpan) textSpan.textContent = title;
      }
      if (badgeDesc && desc) {
        badgeDesc.innerHTML = desc;
      }
      if (categoryText && category) {
        categoryText.textContent = category;
      }
    }
  }

  function nextSlide() {
    showSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    showSlide(currentSlideIndex - 1);
  }

  function startSlideshow() {
    stopSlideshow();
    slideshowTimer = setInterval(nextSlide, SLIDE_DURATION);
  }

  function stopSlideshow() {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
      slideshowTimer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startSlideshow();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startSlideshow();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-slide'), 10);
      if (!isNaN(idx)) {
        showSlide(idx);
        startSlideshow();
      }
    });
  });

  if (slideshowContainer) {
    slideshowContainer.addEventListener('mouseenter', stopSlideshow);
    slideshowContainer.addEventListener('mouseleave', startSlideshow);

    // Mobile Swipe gesture
    let touchStartX = 0;
    slideshowContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slideshowContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextSlide();
        else prevSlide();
        startSlideshow();
      }
    }, { passive: true });
  }

  // --- Dynamic Lead Personalisation & Query Params Parser ---
  async function processTypeformParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || sessionStorage.getItem('proptii_lead_token');

      const apiBase = ''; // same-origin Worker API (D1)

      if (token) {
        try {
          const res = await fetch(`${apiBase}/api/leads/session?token=` + encodeURIComponent(token));
          if (res.ok) {
            const data = await res.json();
            if (data && data.leadId) {
              window.__proptii_lead_id = data.leadId;
              window.__proptii_lead_role = data.role;
              window.__proptii_lead_data = data;
              if (data.email) {
                window.__proptii_lead_email = data.email;
                try {
                  sessionStorage.setItem('pending_registration_email', data.email);
                } catch {}
                const emailInput = document.getElementById('modal-email-input');
                if (emailInput) {
                  emailInput.value = data.email;
                }
              }
              try {
                sessionStorage.setItem('proptii_lead_id', data.leadId);
                sessionStorage.setItem('proptii_campaign_lead', JSON.stringify(data));
              } catch {}

              const roleMap = {
                'Estate agent / letting agent': 'Estate Agent',
                'Independent landlord': 'Landlord',
                'Property manager': 'Property Manager',
                'Property investor': 'Property Investor',
                'Other': 'Property Professional',
              };
              const roleTitle = roleMap[data.role] || data.role || 'Property Professional';

              const headlineEl = document.getElementById('headline-text');
              if (headlineEl) {
                headlineEl.innerHTML = `Welcome, <span style="color: var(--primary-orange);">${escapeHtml(roleTitle)}</span> — your 1-month free trial is ready.`;
              }

              const subtitleEl = document.getElementById('unboxing-subtitle');
              if (subtitleEl) {
                subtitleEl.textContent = `Great insights on your ${data.propertyCount || 'property'} workflow. We've tailored your trial.`;
              }
              return;
            }
          }
        } catch (err) {
          console.warn('Lead session fetch notice:', err);
        }
      }

      // Check fallback cached survey in sessionStorage
      try {
        const cachedRaw = sessionStorage.getItem('proptii_campaign_lead');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          window.__proptii_lead_role = cached.role;
          window.__proptii_lead_data = cached;
          if (cached.email) {
            window.__proptii_lead_email = cached.email;
            try {
              sessionStorage.setItem('pending_registration_email', cached.email);
            } catch {}
            const emailInput = document.getElementById('modal-email-input');
            if (emailInput) {
              emailInput.value = cached.email;
            }
          }
          const roleMap = {
            'Estate agent / letting agent': 'Estate Agent',
            'Independent landlord': 'Landlord',
            'Property manager': 'Property Manager',
            'Property investor': 'Property Investor',
            'Other': 'Property Professional',
          };
          const roleTitle = roleMap[cached.role] || cached.role || 'Property Professional';
          const headlineEl = document.getElementById('headline-text');
          if (headlineEl) {
            headlineEl.innerHTML = `Welcome, <span style="color: var(--primary-orange);">${escapeHtml(roleTitle)}</span> — your 1-month free trial is ready.`;
          }
        }
      } catch {}

      const name = urlParams.get('name') || urlParams.get('firstname') || urlParams.get('first_name');
      const email = urlParams.get('email');

      if (name) {
        const headlineEl = document.getElementById('headline-text');
        if (headlineEl) {
          headlineEl.innerHTML = `Welcome, <span style="color: var(--primary-orange);">${escapeHtml(name)}</span>! Your 1-month free trial is ready.`;
        }
      }

      if (email) {
        const emailInput = document.getElementById('modal-email-input');
        if (emailInput) {
          emailInput.value = email;
        }
      }
    } catch (e) {
      console.warn('URL params parsing notice:', e);
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- Modal & CTA Interactions ---
  const modalBackdrop = document.getElementById('activation-modal');
  const openModalBtn = document.getElementById('open-activation-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalForm = document.getElementById('quick-auth-form');

  function openModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.add('open');
      const emailInput = document.getElementById('modal-email-input');
      if (emailInput && !emailInput.value) {
        setTimeout(() => emailInput.focus(), 150);
      }
    }
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
    }
  }

  if (openModalBtn) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('modal-email-input');
      if (emailInput && !emailInput.value && window.__proptii_lead_email) {
        emailInput.value = window.__proptii_lead_email;
      }
      openModal();
    });
  }

  const googleBtn = document.getElementById('social-google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      googleBtn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Connecting to Google...</span>
      `;
      googleBtn.style.pointerEvents = 'none';

      const role = window.__proptii_lead_role || '';
      const isAgent = role.toLowerCase().includes('agent');
      const roleIntent = isAgent ? 'agent' : 'landlord';
      try {
        sessionStorage.setItem('proptii_signup_role_intent', roleIntent);
        if (window.__proptii_lead_data) {
          sessionStorage.setItem('proptii_campaign_lead', JSON.stringify(window.__proptii_lead_data));
        }
      } catch {}

      const plan = isAgent ? 'independent' : 'starter';
      const email = window.__proptii_lead_email || '';
      if (email) {
        try {
          sessionStorage.setItem('pending_registration_email', email);
        } catch {}
      }
      const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
      setTimeout(() => {
        window.location.href = `/signup?plan=${plan}&cycle=monthly&role=${roleIntent}${emailParam}&from=campaign&provider=google`;
      }, 350);
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = modalForm.querySelector('button[type="submit"]');
      const emailInput = document.getElementById('modal-email-input');
      const email = emailInput ? emailInput.value.trim() : '';
      const leadId = window.__proptii_lead_id || sessionStorage.getItem('proptii_lead_id');

      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Activating 1-Month Trial...
        `;
        submitBtn.style.pointerEvents = 'none';
      }

      const apiBase = ''; // same-origin Worker API (D1)

      if (leadId && email) {
        try {
          await fetch(`${apiBase}/api/leads/${encodeURIComponent(leadId)}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
        } catch (err) {
          console.error('Lead activation error:', err);
        }
      }

      // Store in sessionStorage for Proptii signup
      const role = window.__proptii_lead_role || '';
      const isAgent = role.toLowerCase().includes('agent');
      const roleIntent = isAgent ? 'agent' : 'landlord';
      try {
        sessionStorage.setItem('proptii_signup_role_intent', roleIntent);
        if (email) sessionStorage.setItem('pending_registration_email', email);
      } catch {}

      setTimeout(() => {
        const modalHeader = document.querySelector('.modal-header');
        if (modalHeader) {
          modalHeader.innerHTML = `
            <div class="modal-reward-badge" style="background:#22c55e;color:#fff;">✓ Trial Activated</div>
            <h3 class="modal-title" style="margin-top:8px;">Welcome to Proptii!</h3>
            <p class="modal-subtitle">Your VIP 1-month free access has been activated for <strong>${escapeHtml(email || 'your account')}</strong>. Redirecting to setup your account...</p>
          `;
        }
        if (modalForm) {
          modalForm.innerHTML = `
            <div style="text-align:center; padding: 16px 0;">
              <p style="font-size:14px; color: var(--text-dark); margin-bottom: 16px;">Taking you to Proptii sign up...</p>
            </div>
          `;
        }
        document.querySelectorAll('.social-btn, .social-auth-divider').forEach(el => el.remove());

        // Redirect directly to Proptii Sign Up with plan and prefilled details
        setTimeout(() => {
          const plan = isAgent ? 'independent' : 'starter';
          const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
          window.location.href = `/signup?plan=${plan}&cycle=monthly&role=${roleIntent}${emailParam}&from=campaign`;
        }, 1200);
      }, 800);
    });
  }


  const secondaryLink = document.getElementById('secondary-explore-link');
  if (secondaryLink) {
    secondaryLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', runUnboxingSequence);
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', skipToPage);
  }

  // --- Initialize on load ---
  window.addEventListener('DOMContentLoaded', () => {
    processTypeformParams();
    startSlideshow();

    if (giftBox) {
      giftBox.addEventListener('click', () => {
        if (!giftBox.classList.contains('bursting')) {
          const rect = giftBox.getBoundingClientRect();
          launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 280);
          giftBox.classList.remove('shaking');
          giftBox.classList.add('bursting');
          boxGlow.classList.add('burst');
          setTimeout(() => {
            overlay.classList.add('hidden');
            welcomePage.classList.add('visible');
          }, 900);
        }
      });
    }

    runUnboxingSequence();
  });
})();
