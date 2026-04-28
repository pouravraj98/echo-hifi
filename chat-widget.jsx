// Echo Chat Widget — three scripted, looping demos (text, voice, image)
// Glassmorphic; sits on top of a photographic backdrop. Read-only.

const { useState, useEffect, useRef } = React;

/* ============== ICONS ============== */
const IconMic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const IconCam = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
);

/* ============== SCRIPTS ============== */

// Product photos — local files in assets/products/.
// Each one curated by hand to match the product description.
// Falls back to swatch gradient if a file is ever missing.
const IMG = {
  // Patagonia rain hardshells (TEXT mode)
  hardshellForest: 'assets/products/hardshell-forest.webp',
  hardshellCobalt: 'assets/products/hardshell-cobalt.webp',
  hardshellDusk:   'assets/products/hardshell-dusk.webp',
  // Voice-mode accessories
  knitCream:       'assets/products/knit-cream.webp',
  beltRust:        'assets/products/belt-rust.jpg',
  teeWhite:        'assets/products/tee-white.webp',
  // Image-mode suede jacket matches
  suedeRust:       'assets/products/suede-rust.webp',
  jacketSand:      'assets/products/jacket-sand.webp',
  // The user's "uploaded" reference photo (IMG_2841.jpg)
  vintageRustHero: 'assets/products/vintage-rust.webp',
};

// Text mode: typed user → typing dots → bot reply with product cards
const TEXT_SCRIPT = [
  { type: 'typeUser', text: "I need a jacket for a wet hike in Patagonia next month", speed: 28 },
  { type: 'send', delay: 300 },
  { type: 'typing', delay: 700 },
  { type: 'bot', delay: 1400, text: "Patagonia in May means cold rain, mid-30s°F. You'll want a 3-layer hardshell — fully seam-taped, hood that fits over a beanie." },
  { type: 'bot', delay: 700, text: "Three that fit:", products: [
    { name: 'Storm Hardshell — Forest', meta: '3L · 12oz · pit zips',    price: '$320', swatch: 'forest', img: IMG.hardshellForest },
    { name: 'Rainline Pro — Cobalt',    meta: '2.5L · 9.4oz · packable', price: '$245', swatch: 'cobalt', img: IMG.hardshellCobalt },
    { name: 'Ridgeline GTX — Dusk',     meta: 'Gore-Tex · 14oz',         price: '$410', swatch: 'dusk',   img: IMG.hardshellDusk },
  ]},
  { type: 'pause', delay: 3500 },
  { type: 'reset' },
];

// Voice mode: orb pulses, transcribes user speech, then bot speaks back
const VOICE_SCRIPT = [
  { type: 'listening' },
  { type: 'transcribe', delay: 600, text: "" },
  { type: 'transcribe', delay: 400, text: "What pairs with" },
  { type: 'transcribe', delay: 350, text: "What pairs with the olive linen" },
  { type: 'transcribe', delay: 350, text: "What pairs with the olive linen pants" },
  { type: 'transcribe', delay: 350, text: "What pairs with the olive linen pants I bought last week?" },
  { type: 'thinking', delay: 600 },
  { type: 'speaking', delay: 1100, text: "Three things from your last order would extend it — a cream knit, a rust suede belt, and the white tee in size medium." },
  { type: 'voiceProducts', delay: 1800, products: [
    { name: 'Cream Cable Knit',      meta: 'Merino · relaxed fit',       price: '$185', swatch: 'oat',  img: IMG.knitCream },
    { name: 'Suede Belt — Rust',     meta: 'Italian pig suede · 1.25"',  price: '$95',  swatch: 'rust', img: IMG.beltRust },
    { name: 'Essential Tee — White', meta: 'Pima cotton · M',            price: '$48',  swatch: 'sand', img: IMG.teeWhite },
  ]},
  { type: 'pause', delay: 4500 },
  { type: 'reset' },
];

// Image mode: user uploads photo → bot identifies & finds matches
const IMAGE_SCRIPT = [
  { type: 'userImg', delay: 600, label: 'IMG_2841.jpg', swatch: 'rust', img: IMG.vintageRustHero },
  { type: 'userText', delay: 250, text: "Where can I find this?" },
  { type: 'typing', delay: 800 },
  { type: 'bot', delay: 1500, text: "That's a vintage rust suede jacket — 70s western cut, point yoke, pearl snaps. We carry two close matches in suede, plus a leather alt." },
  { type: 'bot', delay: 700, text: "", products: [
    { name: 'Western Snap Suede — Rust', meta: 'Pig suede · pearl snaps', price: '$390', swatch: 'rust', img: IMG.suedeRust },
    { name: 'Drifter Jacket — Sand',     meta: 'Cowhide · slim cut',      price: '$520', swatch: 'sand', img: IMG.jacketSand },
  ]},
  { type: 'pause', delay: 3500 },
  { type: 'reset' },
];

const SCRIPTS = { text: TEXT_SCRIPT, voice: VOICE_SCRIPT, image: IMAGE_SCRIPT };

/* ============== WIDGET ============== */
function EchoChatWidget({ mode = 'text', voiceVariant = 'bars' }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  // Voice state
  const [voiceState, setVoiceState] = useState('listening'); // listening | thinking | speaking | idle
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSpoken, setVoiceSpoken] = useState('');
  const [voiceProducts, setVoiceProducts] = useState(null);
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const stopRef = useRef(false);
  const draftRef = useRef('');

  // Start playing once the widget scrolls into view; keep looping after.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setHasStarted(true);
          io.disconnect();
          break;
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    stopRef.current = false;
    runScript();
    return () => { stopRef.current = true; };
  }, [mode, hasStarted]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, showTyping, draft]);

  async function runScript() {
    while (!stopRef.current) {
      const script = SCRIPTS[mode];
      // reset
      setMessages([]); setDraft(''); draftRef.current = ''; setShowTyping(false);
      setVoiceTranscript(''); setVoiceSpoken(''); setVoiceProducts(null); setVoiceState('listening');

      for (const step of script) {
        if (stopRef.current) return;
        await sleep(step.delay || 0);
        if (stopRef.current) return;

        if (step.type === 'typeUser') {
          for (let i = 1; i <= step.text.length; i++) {
            if (stopRef.current) return;
            const slice = step.text.slice(0, i);
            draftRef.current = slice;
            setDraft(slice);
            await sleep(step.speed || 30);
          }
        } else if (step.type === 'send') {
          const sent = draftRef.current || step.text || '';
          setMessages(m => [...m, { who: 'user', text: sent }]);
          draftRef.current = '';
          setDraft('');
        } else if (step.type === 'typing') {
          setShowTyping(true);
        } else if (step.type === 'bot') {
          setShowTyping(false);
          setMessages(m => [...m, { who: 'bot', text: step.text, products: step.products }]);
        } else if (step.type === 'userImg') {
          setMessages(m => [...m, { who: 'user', img: step.label, swatch: step.swatch, src: step.img }]);
        } else if (step.type === 'userText') {
          setMessages(m => [...m, { who: 'user', text: step.text }]);
        } else if (step.type === 'listening') {
          setVoiceState('listening'); setVoiceTranscript(''); setVoiceSpoken('');
        } else if (step.type === 'transcribe') {
          setVoiceTranscript(step.text);
        } else if (step.type === 'thinking') {
          setVoiceState('thinking');
        } else if (step.type === 'speaking') {
          setVoiceState('speaking'); setVoiceSpoken(step.text);
        } else if (step.type === 'voiceProducts') {
          setVoiceProducts(step.products);
        } else if (step.type === 'pause') {
          // just delay
        } else if (step.type === 'reset') {
          // loop
        }
      }
    }
  }

  return (
    <div className="ecw" data-mode={mode} ref={rootRef}>
      {mode === 'voice' ? (
        <VoiceBody state={voiceState} transcript={voiceTranscript} spoken={voiceSpoken} products={voiceProducts} variant={voiceVariant}/>
      ) : (
        <div className="ecw-body" ref={bodyRef}>
          {messages.map((m, i) => <Message key={i} msg={m}/>)}
          {showTyping && (
            <div className="ecw-msg bot" style={{ padding: '8px 14px' }}>
              <div className="ecw-typing"><span/><span/><span/></div>
            </div>
          )}
        </div>
      )}

      <Composer mode={mode} draft={draft} voiceState={voiceState}/>
    </div>
  );
}

/* ============== SUB-VIEWS ============== */

function Message({ msg }) {
  if (msg.who === 'user') {
    if (msg.img) {
      return (
        <div className="ecw-msg-img-only">
          <div
            className={`ecw-img swatch-${msg.swatch}`}
            style={msg.src ? { backgroundImage: `url("${msg.src}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : null}
          />
        </div>
      );
    }
    return <div className="ecw-msg user">{msg.text}</div>;
  }
  return (
    <div className="ecw-msg bot">
      {msg.text && <div>{msg.text}</div>}
      {msg.products && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: msg.text ? 8 : 0 }}>
          {msg.products.map((p, i) => (
            <div key={i} className="ecw-prod">
              <div
                className={`ecw-prod-thumb swatch-${p.swatch}`}
                style={p.img ? { backgroundImage: `url("${p.img}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : null}
              />
              <div className="ecw-prod-info">
                <div className="ecw-prod-name">{p.name}</div>
                <div className="ecw-prod-meta">{p.meta}</div>
                <div className="ecw-prod-price">{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceBody({ state, transcript, spoken, products, variant = 'bars' }) {
  const compact = state === 'speaking' && products && products.length;
  const Orb = window.EchoOrb;
  const orbW = compact ? 200 : 260;
  const orbH = compact ? 90 : 130;
  return (
    <div className="ecw-body" style={{ alignItems: 'center', justifyContent: compact ? 'flex-start' : 'center', paddingTop: compact ? 16 : 12 }}>
      <div className="ecw-voice-stage" style={compact ? { paddingTop: 0, paddingBottom: 4 } : null}>
        {state === 'listening' && (
          <>
            {Orb ? <Orb width={orbW} height={orbH} state="listening" variant={variant}/> : <div className="ecw-orb"><IconMic/></div>}
            <div className="ecw-mono">LISTENING<span className="ecw-cursor">&nbsp;</span></div>
            {transcript && (
              <div className="ecw-said">"{transcript}<span className="ecw-cursor">|</span>"</div>
            )}
          </>
        )}
        {state === 'thinking' && (
          <>
            {Orb ? <Orb width={orbW} height={orbH} state="thinking" variant={variant}/> : <div className="ecw-orb" style={{ background: 'linear-gradient(135deg, #8a8a9a, #4a4a5a)' }}/>}
            <div className="ecw-mono">THINKING</div>
            <div className="ecw-typing"><span/><span/><span/></div>
          </>
        )}
        {state === 'speaking' && (
          <>
            {Orb
              ? <Orb width={orbW} height={orbH} state="speaking" variant={variant}/>
              : <div className="ecw-orb" style={{ background: 'linear-gradient(135deg, #C9A77A, #8C6E45)', width: compact ? 40 : 56, height: compact ? 40 : 56 }}/>}
            <div className="ecw-mono">SPEAKING</div>
            <div className="ecw-said" style={compact ? { fontSize: 13.5, maxWidth: 300 } : null}>{spoken}</div>
          </>
        )}
      </div>
      {compact && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, padding: '0 4px' }}>
          {products.map((p, i) => (
            <div key={i} className="ecw-prod" style={{ animation: 'ecw-in 320ms ease-out both', animationDelay: `${i * 90}ms` }}>
              <div
                className={`ecw-prod-thumb swatch-${p.swatch}`}
                style={p.img ? { backgroundImage: `url("${p.img}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : null}
              />
              <div className="ecw-prod-info">
                <div className="ecw-prod-name">{p.name}</div>
                <div className="ecw-prod-meta">{p.meta}</div>
                <div className="ecw-prod-price">{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Composer({ mode, draft, voiceState }) {
  if (mode === 'voice') {
    return null;
  }
  const isTyping = (draft && draft.length > 0);
  return (
    <div className={`ecw-composer ${isTyping ? 'is-typing' : ''}`}>
      <button className={`ecw-icon ecw-icon-collapse ${isTyping ? 'is-hidden' : ''}`} title="Image" tabIndex={-1}><IconCam/></button>
      <input
        className="ecw-input"
        value={draft}
        readOnly
        placeholder={mode === 'image' ? 'Add a note about this photo…' : 'Ask anything…'}
      />
      <button className="ecw-send" tabIndex={-1}><IconArrow/></button>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

window.EchoChatWidget = EchoChatWidget;
