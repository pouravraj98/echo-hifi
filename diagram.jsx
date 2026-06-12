// Echo Hi-Fi — animated 5→1 consolidation diagram

function ConsolidationDiagram() {
  const [merged, setMerged] = React.useState(false);
  const tiles = [
    { id: 'search',  label: 'Search bar',   pos: { left: '8%',  top: '15%' } },
    { id: 'chat',    label: 'Chat widget',  pos: { right: '10%', top: '12%' } },
    { id: 'whats',   label: 'WhatsApp',     pos: { left: '4%',  bottom: '20%' } },
    { id: 'email',   label: 'Email form',   pos: { right: '6%', bottom: '15%' } },
    { id: 'returns', label: 'Returns page', pos: { left: '50%', top: '8%', transform: 'translateX(-50%)' } },
  ];

  // Trigger animation on viewport intersection
  const ref = React.useRef(null);
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => setMerged(true), 800);
        }
      });
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`consolidate-stage ${merged ? 'merged' : ''}`}>
      {tiles.map(t => (
        <div key={t.id} className="legacy-tile" style={t.pos}>
          <span className="tile-dot"/>
          {t.label}
        </div>
      ))}
      <div className="echo-orb">Crossword<em style={{ color: 'white', fontStyle: 'normal' }}>.</em></div>
      <button
        className="consolidate-replay"
        onClick={() => { setMerged(false); setTimeout(() => setMerged(true), 700); }}
      >
        ↻ Replay
      </button>
    </div>
  );
}

window.ConsolidationDiagram = ConsolidationDiagram;
