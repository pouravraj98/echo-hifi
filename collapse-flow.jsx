// Echo Hi-Fi — "Collapse flow" diagram (Variation 2)
// 5 tiles cascade in, dotted lines descend, label fades, Echo bar settles.
// Icons via Iconify <iconify-icon> web component (auto-hydrates).
// Uses Lucide icons for generic surfaces and Simple Icons for the WhatsApp brand mark.

function CollapseFlow() {
  const ref = React.useRef(null);
  const [active, setActive] = React.useState(false);
  const [hot, setHot] = React.useState(0);

  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setActive(true); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Cycle action highlight after the bar appears
  React.useEffect(() => {
    if (!active) return;
    const start = setTimeout(() => {
      const id = setInterval(() => setHot(h => (h + 1) % 5), 1300);
      return () => clearInterval(id);
    }, 2400);
    return () => clearTimeout(start);
  }, [active]);

  const tiles = [
    { num: '01', name: 'Search bar',   meta: "doesn't know what chat said", icon: 'lucide:search' },
    { num: '02', name: 'Chat widget',  meta: "doesn't know browsing",       icon: 'lucide:message-square' },
    { num: '03', name: 'Social DMs',   meta: 'scattered across apps',
      iconStack: ['tabler:brand-whatsapp', 'tabler:brand-instagram', 'tabler:brand-messenger'] },
    { num: '04', name: 'Email form',   meta: 'asks for known info',         icon: 'lucide:mail' },
    { num: '05', name: 'Returns page', meta: 'buried in footer',            icon: 'lucide:corner-up-left' },
  ];

  const actions = [
    { label: 'SEARCH', icon: 'lucide:search' },
    { label: 'CHAT',   icon: 'lucide:message-square' },
    { label: 'VOICE',  icon: 'lucide:mic' },
    { label: 'BUY',    icon: 'lucide:shopping-bag' },
    { label: 'RETURN', icon: 'lucide:corner-up-left' },
  ];

  return (
    <div ref={ref} className={`cf ${active ? 'is-active' : ''}`}>
      <div className="cf-eyebrow">
        <span className="slash">//</span>
        <strong>Today</strong>
        <span style={{ color: 'var(--ink-4)' }}>·</span>
        <span>five disconnected customer surfaces</span>
      </div>

      <div className="cf-tiles">
        {tiles.map(t => (
          <div key={t.num} className="cf-tile">
            <div className="cf-tile-head">
              {t.iconStack ? (
                <span className="cf-tile-stack">
                  {t.iconStack.map(name => (
                    <span key={name} className="cf-stack-bubble">
                      <iconify-icon icon={name}/>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="cf-tile-icon"><iconify-icon icon={t.icon}/></span>
              )}
              <span className="cf-tile-num">{t.num}</span>
            </div>
            <div className="cf-tile-name">{t.name}</div>
            <div className="cf-tile-meta">{t.meta}</div>
          </div>
        ))}
      </div>

      <div className="cf-connector">
        {tiles.map((_, i) => <div key={i} className="cf-line"/>)}
        <div className="cf-collapse-label">
          <span className="arrow">↓</span>collapse into one orchestrated layer
        </div>
      </div>

      <div className="cf-echo">
        <div className="cf-orb"/>
        <div className="cf-echo-text">
          <div className="cf-echo-name">Crossword</div>
          <div className="cf-echo-meta">One conversation <em>· context carries · web · app · whatsapp</em></div>
        </div>
        <div className="cf-actions">
          {actions.map((a, i) => (
            <span key={a.label} className={i === hot ? 'is-hot' : ''}>
              <span className="cf-action-ic"><iconify-icon icon={a.icon}/></span>
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

window.CollapseFlow = CollapseFlow;
