// Echo Hi-Fi — atomic UI primitives

const Logo = () => (
  <a href="#" className="logo">
    echo<em>.</em>
  </a>
);

const Nav = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);
  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Hide when scrolling down past 80px, show when scrolling up
      if (y > 80 && y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Logo/>
        <span className="logo-sub">a CometChat product</span>
      </div>
      <a href="https://www.cometchat.com/contact-sales"><button className={scrolled ? 'btn primary' : 'btn glass'}>
        Apply for early access
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button></a>
    </nav>
  );
};

const Eyebrow = ({ children, center }) => (
  <div className={`eyebrow ${center ? 'center' : ''}`}>{children}</div>
);

const Btn = ({ children, variant = 'primary', size = '', onClick }) => (
  <button className={`btn ${variant} ${size}`} onClick={onClick}>
    {children}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
  </button>
);

// Hero photo banner — parallax ready
const MountainScene = () => {
  const [y, setY] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="scene atmospheric">
      <div className="scene-photo-bg" style={{ transform: `translateY(${y * 0.18}px)` }}/>
      <div className="scene-haze"/>
    </div>
  );
};

// Hero ask bar with cycling text → voice → image
const HeroAskBar = () => {
  const modes = [
    { kind: 'text', label: 'Ask Echo anything…', typed: 'I need running shoes for trails' },
    { kind: 'voice', label: 'Tap to speak', typed: 'Show me cotton bedsheets under $40' },
    { kind: 'image', label: 'Drop an image', typed: 'I like this but in blue' },
  ];
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('typing'); // typing → hold → out
  const [chars, setChars] = React.useState(0);

  React.useEffect(() => {
    const target = modes[idx].typed;
    if (phase === 'typing') {
      if (chars < target.length) {
        const t = setTimeout(() => setChars(c => c + 1), 40 + Math.random() * 30);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('hold'), 1400);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('out'), 800);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => {
        setIdx((idx + 1) % modes.length);
        setChars(0);
        setPhase('typing');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [phase, chars, idx]);

  const m = modes[idx];
  const typed = m.typed.slice(0, chars);

  const icon = m.kind === 'text' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ) : m.kind === 'voice' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  );

  return (
    <div className="ask-shell">
      <div className="ask-bar">
        <div className="ask-mode">
          <div className="ask-cycle" style={{
            opacity: phase === 'out' ? 0 : 1,
            transform: phase === 'out' ? 'translateY(-6px)' : 'translateY(0)',
          }}>
            <span className="icon">{icon}</span>
            {chars === 0 ? (
              <span className="text">{m.label}</span>
            ) : (
              <span className="typed">{typed}</span>
            )}
          </div>
        </div>
        <button className="icon-btn" title="image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </button>
        <button className="icon-btn" title="voice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
        </button>
        <button className="send" title="send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div className="ask-suggestions">
        {['I need running shoes', 'Where is my order?', 'Show me blue variants'].map(s => (
          <button key={s} className="ask-chip">{s}</button>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { Logo, Nav, Eyebrow, Btn, MountainScene, HeroAskBar });
