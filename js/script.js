// Briven AI Studio — shared site behavior

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile nav ---- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && !reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // Arm elements just before observing — CSS default is fully visible,
    // so anyone whose JS fails to load or run still sees all content.
    revealEls.forEach(el => {
      el.classList.add('reveal-armed');
      io.observe(el);
    });
  }

  /* ---- Chat demo cycler (hero + services widget mockups) ---- */
  document.querySelectorAll('[data-chat-demo]').forEach(widget => {
    const body = widget.querySelector('.chat-widget-body');
    if (!body) return;

    let script;
    try {
      script = JSON.parse(widget.getAttribute('data-chat-demo'));
    } catch (e) { return; }

    if (reduceMotion) {
      // Render the full exchange once, statically, no looping.
      body.innerHTML = script.map(m =>
        `<div class="bubble ${m.role}">${m.text}</div>`
      ).join('');
      return;
    }

    // Clear the static (no-JS) fallback bubbles before animating.
    body.innerHTML = '';

    let i = 0;
    let cancelled = false;

    function typeDelay(text) {
      return Math.min(1400, 500 + text.length * 18);
    }

    function step() {
      if (cancelled) return;
      if (i >= script.length) {
        setTimeout(() => {
          if (cancelled) return;
          body.innerHTML = '';
          i = 0;
          step();
        }, 2600);
        return;
      }
      const msg = script[i];
      const typingEl = document.createElement('div');
      typingEl.className = 'typing';
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typingEl);
      body.scrollTop = body.scrollHeight;

      setTimeout(() => {
        if (cancelled) return;
        typingEl.remove();
        const bubble = document.createElement('div');
        bubble.className = `bubble ${msg.role}`;
        bubble.textContent = msg.text;
        body.appendChild(bubble);
        body.scrollTop = body.scrollHeight;
        i++;
        setTimeout(step, 500);
      }, typeDelay(msg.text));
    }

    // stop animating widgets once scrolled far off screen, restart when back
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            cancelled = false;
            if (i === 0 && body.children.length === 0) step();
          } else {
            cancelled = true;
          }
        });
      }, { threshold: 0.2 });
      obs.observe(widget);
    } else {
      step();
    }
  });

  /* ---- Contact form ---- */
  const form = document.getElementById('contact-form');
  if (form) {
    const status = document.getElementById('form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      status.className = 'form-status';
      status.textContent = '';

      try {
        const action = form.getAttribute('action');
        const isConfigured = action && !action.includes('YOUR_FORM_ID') && !action.includes('YOUR_EMAIL');

        if (!isConfigured) {
          // Form endpoint not wired up yet — see README for setup.
          throw new Error('not-configured');
        }

        // formsubmit.co needs its /ajax/ variant for a fetch-based submit
        // (the plain endpoint expects a full page navigation + redirect).
        let endpoint = action;
        if (endpoint.includes('formsubmit.co') && !endpoint.includes('/ajax/')) {
          endpoint = endpoint.replace('formsubmit.co/', 'formsubmit.co/ajax/');
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });

        let ok = res.ok;
        try {
          const data = await res.clone().json();
          if (data && typeof data.success !== 'undefined') {
            ok = ok && (data.success === true || data.success === 'true');
          }
        } catch (parseErr) {
          // Non-JSON response is fine as long as the request itself succeeded.
        }

        if (ok) {
          status.textContent = "Got it, thanks. We'll reply within one business day.";
          status.className = 'form-status ok';
          form.reset();
        } else {
          throw new Error('send-failed');
        }
      } catch (err) {
        status.textContent = "Something didn't send. Please email us directly at hello@brivenstudio.com and we'll get right back to you.";
        status.className = 'form-status err';
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }
});
