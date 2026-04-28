// Echo Hi-Fi — Capability hero card
// Full-bleed atmospheric photo background, headline top-left, glassmorphic Echo
// chat widget bottom-right. The widget is the standalone EchoChatWidget
// from chat-widget.jsx, scripted to loop a per-mode demo.

function CapCard({ num, label, headline, sub, quoteStrong, quoteBody, bg, mode, voiceVariant }) {
  const Widget = window.EchoChatWidget;
  return (
    <div className="cap-card" data-mode={mode}>
      <div className="cap-bg" style={{ backgroundImage: `url("${bg}")` }}/>
      <div className="cap-overlay"/>
      <div className="cap-card-inner">
        <div className="cap-num-2">{num} — {label}</div>
        <h2 className="cap-headline" dangerouslySetInnerHTML={{ __html: headline }}/>
        <p className="cap-sub">{sub}</p>
        <div className="cap-quote-2">
          <strong>"{quoteStrong}"</strong> {quoteBody}
        </div>
      </div>
      {Widget && (
        <div className="cap-widget">
          <Widget mode={mode} voiceVariant={voiceVariant || 'bars'}/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CapCard });
