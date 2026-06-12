// Echo Hi-Fi — "Today vs Echo" comparison cards (Variation 1)
// Two side-by-side cards with staged reveal animations.
// Icons via Lucide UMD; <i data-lucide="..."> placeholders inflated by
// window.lucide.createIcons() in a post-render effect.

function CompareCards() {
  const ref = React.useRef(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setActive(true); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const todayRows = [
    { tile: 'Search bar',  text: "doesn't know what the chat said",   icon: 'lucide:search' },
    { tile: 'Chat widget', text: "doesn't know what they browsed",    icon: 'lucide:message-square' },
    { tile: 'WhatsApp',    text: 'separate inbox, separate context',  icon: 'simple-icons:whatsapp' },
    { tile: 'Email form',  text: 'asks for info already given',       icon: 'lucide:mail' },
    { tile: 'Returns',     text: 'buried, painful, manual',           icon: 'lucide:corner-up-left' },
  ];

  const echoChecks = [
    'ask a question',
    'get a recommendation',
    'complete a purchase',
    'raise a return',
  ];

  return (
    <div ref={ref} className={`cmp-grid ${active ? 'is-active' : ''}`}>
      {/* TODAY */}
      <div className="cmp-card cmp-today">
        <div className="cmp-eyebrow"><span className="slash">//</span>the way it works today</div>
        <ul className="cmp-rows">
          {todayRows.map((r, i) => (
            <li key={i} style={{ '--i': i }}>
              <span className="cmp-tile">
                <span className="cmp-tile-ic"><iconify-icon icon={r.icon}/></span>
                {r.tile}
              </span>
              <span className="cmp-text">{r.text}</span>
            </li>
          ))}
        </ul>
        <p className="cmp-foot">
          This isn't anyone's fault. These tools were <em>built separately</em>, deployed separately, and they behave separately. Your customer experiences it as one thing — and right now, that one thing is friction.
        </p>
      </div>

      {/* ECHO */}
      <div className="cmp-card cmp-echo">
        <div className="cmp-eyebrow"><span className="slash">//</span>the way Crossword works</div>
        <div className="cmp-hero-tile">
          <div className="cmp-orb"/>
          <div className="cmp-hero-text">
            <div className="cmp-hero-title">One conversation</div>
            <div className="cmp-hero-meta">WEB · APP · WHATSAPP <em>— context carries</em></div>
          </div>
        </div>
        <ul className="cmp-check">
          {echoChecks.map((c, i) => (
            <li key={i} style={{ '--i': i }}>
              <span className="cmp-tick">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {c}
            </li>
          ))}
        </ul>
        <p className="cmp-foot">
          All inside one conversation, on your website, your app, or WhatsApp. <em>The context carries. The experience doesn't reset.</em>
        </p>
      </div>
    </div>
  );
}

window.CompareCards = CompareCards;
