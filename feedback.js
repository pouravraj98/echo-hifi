// Echo Hi-Fi feedback overlay — drop pins on the page, copy as Markdown.
(function () {
  if (window.__echoFeedbackMounted) return;
  window.__echoFeedbackMounted = true;

  const STORAGE_KEY = 'echo-hifi-feedback-v1';

  const state = {
    pins: load(),
    placing: false,
    panelOpen: false,
    activePopover: null,
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pins)); }

  function describeTarget(el) {
    if (!el || el === document.body) return 'page';
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || el.textContent || '').trim().split('\n')[0].slice(0, 60);
    if (text) return `${tag.toUpperCase()} "${text}${text.length === 60 ? '…' : ''}"`;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      return `${tag}.${cls}`;
    }
    return tag;
  }

  function isOurOwnUI(el) {
    return !!(el.closest && el.closest('.fb-toolbar, .fb-panel, .fb-popover, .fb-pin, .fb-toast'));
  }

  /* ----------------- DOM ----------------- */

  const toolbar = document.createElement('div');
  toolbar.className = 'fb-toolbar';
  toolbar.innerHTML = `
    <span class="fb-grip" title="Drag to move"><span></span><span></span><span></span><span></span><span></span><span></span></span>
    <button class="fb-btn fb-toggle" type="button">
      <span class="fb-dot"></span>
      <span class="fb-toggle-label">Add feedback</span>
    </button>
    <span class="fb-count">0</span>
    <button class="fb-btn fb-panel-toggle" type="button">List</button>
  `;

  const pinLayer = document.createElement('div');
  pinLayer.className = 'fb-pin-layer';

  const panel = document.createElement('aside');
  panel.className = 'fb-panel';
  panel.innerHTML = `
    <div class="fb-panel-head">
      <strong>Feedback</strong>
      <button class="fb-btn fb-panel-close" type="button" style="padding:4px 8px;">✕</button>
    </div>
    <div class="fb-panel-list"></div>
    <div class="fb-panel-foot">
      <button class="fb-btn fb-copy primary" type="button">Copy as Markdown</button>
      <button class="fb-btn fb-clear" type="button">Clear all</button>
    </div>
  `;

  document.body.appendChild(toolbar);
  document.body.appendChild(pinLayer);
  document.body.appendChild(panel);

  /* ----------------- Draggable toolbar ----------------- */
  const POS_KEY = 'echo-hifi-feedback-pos-v1';
  function loadPos() {
    try { return JSON.parse(localStorage.getItem(POS_KEY)); } catch { return null; }
  }
  function savePos(p) { localStorage.setItem(POS_KEY, JSON.stringify(p)); }
  function applyPos(p) {
    if (!p) return;
    toolbar.style.top = p.top + 'px';
    toolbar.style.left = p.left + 'px';
    toolbar.style.right = 'auto';
  }
  applyPos(loadPos());

  const grip = toolbar.querySelector('.fb-grip');
  let dragOffset = null;

  function clampPos(top, left) {
    const rect = toolbar.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 8;
    const maxTop = window.innerHeight - rect.height - 8;
    return {
      top: Math.max(8, Math.min(maxTop, top)),
      left: Math.max(8, Math.min(maxLeft, left)),
    };
  }

  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = toolbar.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    toolbar.classList.add('is-dragging');
    grip.setPointerCapture(e.pointerId);
  });

  grip.addEventListener('pointermove', (e) => {
    if (!dragOffset) return;
    const next = clampPos(e.clientY - dragOffset.y, e.clientX - dragOffset.x);
    applyPos(next);
  });

  grip.addEventListener('pointerup', (e) => {
    if (!dragOffset) return;
    dragOffset = null;
    toolbar.classList.remove('is-dragging');
    grip.releasePointerCapture(e.pointerId);
    const rect = toolbar.getBoundingClientRect();
    savePos({ top: rect.top, left: rect.left });
  });

  // Re-clamp on resize so the toolbar never escapes the viewport
  window.addEventListener('resize', () => {
    const cur = loadPos();
    if (cur) applyPos(clampPos(cur.top, cur.left));
  });

  const $toggle = toolbar.querySelector('.fb-toggle');
  const $toggleLabel = toolbar.querySelector('.fb-toggle-label');
  const $count = toolbar.querySelector('.fb-count');
  const $panelToggle = toolbar.querySelector('.fb-panel-toggle');
  const $list = panel.querySelector('.fb-panel-list');
  const $copy = panel.querySelector('.fb-copy');
  const $clear = panel.querySelector('.fb-clear');
  const $panelClose = panel.querySelector('.fb-panel-close');

  /* ----------------- Render ----------------- */

  function render() {
    // Pins on the page
    pinLayer.innerHTML = '';
    state.pins.forEach((p, i) => {
      const pin = document.createElement('button');
      pin.className = 'fb-pin';
      pin.style.left = p.pageX + 'px';
      pin.style.top = p.pageY + 'px';
      pin.textContent = String(i + 1);
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopover(i, p.pageX, p.pageY);
      });
      pinLayer.appendChild(pin);
    });

    // Side panel list
    $list.innerHTML = '';
    state.pins.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'fb-row';
      row.innerHTML = `
        <div class="fb-row-num">${i + 1}</div>
        <div class="fb-row-body">
          <div class="fb-row-target"></div>
          <div class="fb-row-text"></div>
        </div>
        <button class="fb-row-x" title="Delete">✕</button>
      `;
      row.querySelector('.fb-row-target').textContent = p.target;
      row.querySelector('.fb-row-text').textContent = p.text || '(no comment)';
      row.addEventListener('click', () => {
        scrollToPin(p);
      });
      row.querySelector('.fb-row-x').addEventListener('click', (e) => {
        e.stopPropagation();
        state.pins.splice(i, 1);
        persist();
        render();
      });
      $list.appendChild(row);
    });

    $count.textContent = String(state.pins.length).padStart(2, '0');
  }

  function scrollToPin(p) {
    closePopover();
    const targetY = p.pageY - window.innerHeight / 2;
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(targetY);
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    setTimeout(() => {
      const i = state.pins.indexOf(p);
      if (i >= 0) openPopover(i, p.pageX, p.pageY);
    }, 600);
  }

  /* ----------------- Placing mode ----------------- */

  function setPlacing(on) {
    state.placing = on;
    document.body.classList.toggle('fb-placing', on);
    $toggle.classList.toggle('is-active', on);
    $toggleLabel.textContent = on ? 'Cancel' : 'Add feedback';
  }

  function onHover(e) {
    if (!state.placing) return;
    document.querySelectorAll('.fb-hover-target').forEach(el => el.classList.remove('fb-hover-target'));
    if (e.target && !isOurOwnUI(e.target)) {
      e.target.classList.add('fb-hover-target');
    }
  }
  function onHoverOut() {
    document.querySelectorAll('.fb-hover-target').forEach(el => el.classList.remove('fb-hover-target'));
  }

  function onClick(e) {
    if (!state.placing) return;
    if (isOurOwnUI(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    const pageX = e.clientX + window.scrollX;
    const pageY = e.clientY + window.scrollY;
    const pin = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      pageX, pageY,
      target: describeTarget(e.target),
      text: '',
      ts: new Date().toISOString(),
    };
    state.pins.push(pin);
    persist();
    render();
    setPlacing(false);
    onHoverOut();
    openPopover(state.pins.length - 1, pageX, pageY, true);
  }

  /* ----------------- Popover ----------------- */

  function closePopover() {
    if (state.activePopover) {
      state.activePopover.remove();
      state.activePopover = null;
    }
  }

  function openPopover(index, pageX, pageY, autofocus) {
    closePopover();
    const pin = state.pins[index];
    if (!pin) return;

    const pop = document.createElement('div');
    pop.className = 'fb-popover';

    const popLeft = Math.max(12, Math.min(pageX + 18, window.scrollX + window.innerWidth - 300));
    const popTop = Math.max(window.scrollY + 12, pageY - 20);
    pop.style.left = popLeft + 'px';
    pop.style.top = popTop + 'px';

    pop.innerHTML = `
      <div class="fb-pop-label">#${index + 1} · </div>
      <textarea placeholder="What would you change?"></textarea>
      <div class="fb-pop-actions">
        <button class="fb-btn-sm danger" data-act="del">Delete</button>
        <button class="fb-btn-sm" data-act="cancel">Close</button>
        <button class="fb-btn-sm primary" data-act="save">Save</button>
      </div>
    `;
    pop.querySelector('.fb-pop-label').append(pin.target);
    const ta = pop.querySelector('textarea');
    ta.value = pin.text || '';

    pop.querySelector('[data-act="save"]').addEventListener('click', () => {
      pin.text = ta.value.trim();
      persist();
      render();
      closePopover();
    });
    pop.querySelector('[data-act="del"]').addEventListener('click', () => {
      state.pins.splice(index, 1);
      persist();
      render();
      closePopover();
    });
    pop.querySelector('[data-act="cancel"]').addEventListener('click', closePopover);

    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        pin.text = ta.value.trim();
        persist();
        render();
        closePopover();
      } else if (e.key === 'Escape') {
        closePopover();
      }
    });

    document.body.appendChild(pop);
    state.activePopover = pop;
    if (autofocus) ta.focus();
  }

  /* ----------------- Toolbar wiring ----------------- */

  $toggle.addEventListener('click', () => setPlacing(!state.placing));
  $panelToggle.addEventListener('click', () => {
    state.panelOpen = !state.panelOpen;
    panel.classList.toggle('is-open', state.panelOpen);
  });
  $panelClose.addEventListener('click', () => {
    state.panelOpen = false;
    panel.classList.remove('is-open');
  });

  $copy.addEventListener('click', async () => {
    const md = toMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      toast('Copied — paste back into chat');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Copied — paste back into chat');
    }
  });

  $clear.addEventListener('click', () => {
    if (!state.pins.length) return;
    if (confirm('Delete all feedback pins?')) {
      state.pins = [];
      persist();
      render();
      closePopover();
    }
  });

  function toMarkdown() {
    if (!state.pins.length) return '_(no feedback yet)_';
    const url = window.location.href;
    const lines = [`## Echo Hi-Fi feedback`, `_${state.pins.length} pin(s) · ${url}_`, ``];
    state.pins.forEach((p, i) => {
      lines.push(`### ${i + 1}. ${p.target}`);
      lines.push(`- Position: \`x:${Math.round(p.pageX)} y:${Math.round(p.pageY)}\``);
      lines.push(`- ${p.text ? p.text : '_(no comment)_'}`);
      lines.push('');
    });
    return lines.join('\n');
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'fb-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ----------------- Global listeners ----------------- */

  document.addEventListener('mouseover', onHover);
  document.addEventListener('mouseout', onHoverOut);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.placing) setPlacing(false);
      else closePopover();
    }
  });

  render();
})();
