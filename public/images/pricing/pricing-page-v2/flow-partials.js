// Shared nav, footer, blobs, state + flow controls
const FLOW_KEY = 'proptii.flow.state';
const FLOW_ORDER = [
  'Pricing.html',
  'screen-2-modal.html',
  'screen-3-account.html',
  'screen-4-arrival.html',
  'screen-5-paynow.html',
  'screen-6-email.html',
  'screen-7-billing.html',
  'screen-8-confirmed.html'
];

window.flowState = {
  get: () => { try { return JSON.parse(sessionStorage.getItem(FLOW_KEY)) || {}; } catch(e){ return {}; } },
  set: (patch) => {
    const cur = window.flowState.get();
    const next = { ...cur, ...patch, _ts: Date.now() };
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(next));
    return next;
  },
  clear: () => sessionStorage.removeItem(FLOW_KEY)
};

// Hydrate any [data-flow-bind="key"] inputs on load, and persist on change.
window.flowBind = () => {
  const s = window.flowState.get();
  document.querySelectorAll('[data-flow-bind]').forEach(el => {
    const k = el.getAttribute('data-flow-bind');
    if (s[k] != null && el.value !== undefined) el.value = s[k];
    el.addEventListener('input', () => window.flowState.set({ [k]: el.value }));
    el.addEventListener('change', () => window.flowState.set({ [k]: el.value }));
  });
};

// Back/Next strip — pass {back, next, nextLabel}
window.flowBar = ({back, next, nextLabel='Continue', nextId='flow-next'} = {}) => `
  <div class="flow-bar">
    ${back ? `<a href="${back}" class="flow-back">← Back</a>` : `<span></span>`}
    ${next ? `<a href="${next}" id="${nextId}" class="btn btn-primary flow-next">${nextLabel} →</a>` : ``}
  </div>`;

// 5-min inactivity warn, +1-min auto-revert to pricing
window.flowTimeout = (opts={}) => {
  const WARN_MS = (opts.warnMins||5)*60*1000;
  const REVERT_MS = (opts.revertMins||1)*60*1000;
  let wT, rT;
  const modal = document.createElement('div');
  modal.className = 'idle-modal'; modal.style.display='none';
  modal.innerHTML = `<div class="idle-card"><h3>Still there?</h3>
    <p>You've been inactive for a while. We'll head back to pricing in <strong id="idle-cd">60</strong>s.</p>
    <button class="btn btn-primary" id="idle-stay">I'm still here</button></div>`;
  document.body.appendChild(modal);
  let cd, secs;
  const showWarn = () => {
    modal.style.display='flex'; secs=Math.round(REVERT_MS/1000);
    document.getElementById('idle-cd').textContent=secs;
    cd = setInterval(()=>{ secs--; const e=document.getElementById('idle-cd'); if(e) e.textContent=secs; }, 1000);
    rT = setTimeout(()=>{ window.flowState.clear(); window.location.href='Pricing.html'; }, REVERT_MS);
  };
  const reset = () => {
    clearTimeout(wT); clearTimeout(rT); clearInterval(cd);
    modal.style.display='none';
    wT = setTimeout(showWarn, WARN_MS);
  };
  ['mousemove','keydown','click','scroll','touchstart'].forEach(ev=>document.addEventListener(ev, reset, {passive:true}));
  document.getElementById('idle-stay').onclick = reset;
  reset();
};

window.proptiiPartials = {
  nav: (active) => `
    <nav class="proptii">
      <a href="Pricing.html" class="logo">
        <div class="logo-mark"><svg viewBox="0 0 30 34" xmlns="http://www.w3.org/2000/svg" fill="none">
          <path d="M15 2 L4 11 L4 32 L26 32 L26 11 Z" stroke="#E8622A" stroke-width="3" stroke-linejoin="round"/>
          <path d="M11 32 L11 19 L19 19 L19 32" stroke="#14385C" stroke-width="3" stroke-linejoin="round"/>
        </svg></div>
        <span class="logo-text">proptii</span>
      </a>
      <div class="nav-links">
        <a href="#" class="${active==='how'?'active':''}">How it works</a>
        <a href="Pricing.html" class="${active==='pricing'?'active':''}">Pricing</a>
        <a href="#" class="${active==='faq'?'active':''}">FAQ</a>
        <a href="#" class="nav-cta">Sign in</a>
      </div>
    </nav>`,
  footer: () => `
    <footer class="proptii">
      <div class="inner">
        <div class="top">
          <div class="brand">
            <a href="#" class="logo">
              <div class="logo-mark"><svg viewBox="0 0 30 34" fill="none">
                <path d="M15 2 L4 11 L4 32 L26 32 L26 11 Z" stroke="#E8622A" stroke-width="3" stroke-linejoin="round"/>
                <path d="M11 32 L11 19 L19 19 L19 32" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
              </svg></div>
              <span class="logo-text">proptii</span>
            </a>
            <p>Revolutionizing real estate with AI to streamline the journey from discovery to completion.</p>
          </div>
          <div class="col"><h4>Home</h4><a href="#">Book Viewings</a><a href="#">Referencing</a><a href="#">Contracts</a><a href="Pricing.html">Pricing</a></div>
          <div class="col"><h4>Company</h4><a href="#">About Us</a><a href="#">FAQ</a><a href="#">Privacy</a></div>
          <div class="col"><h4>Contact</h4><a href="#">Contact Us</a><a href="#">Terms</a></div>
        </div>
        <div class="bottom"><div>© 2026 Proptii</div><div>All Rights Reserved</div></div>
      </div>
    </footer>`,
  blobs: () => `<div class="bg-blobs"><div class="blob blob-1"></div><div class="blob blob-2"></div></div>`
};
