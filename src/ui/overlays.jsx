// ─── OVERLAYS ────────────────────────────────────────
// Full-screen modals layered above the app: the easter-egg
// "GONE TOO FAR" splash and the About / contact dialog.
window.ZT = window.ZT || {};

ZT.Overlays = function ({ showEasterEgg, eggResetTimer, showAbout, setShowAbout }) {
  return (
    <>
      {/* EASTER EGG OVERLAY */}
      {showEasterEgg && (
        <div className="zt-egg-overlay"
          onClick={() => { if (eggResetTimer.current) { eggResetTimer.current(); eggResetTimer.current = null; } }}
          style={{
          position:'fixed', inset:0, zIndex:999998,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          pointerEvents:'all', cursor:'pointer',
          background:'radial-gradient(ellipse at center, rgba(150,0,0,0.50) 0%, rgba(0,0,0,0.82) 100%)',
          animation:'egg-fade 0.5s ease-out',
        }}>
          <div style={{ width:'75%', height:5, background:'linear-gradient(to right,transparent,#cc0000,#cc0000,transparent)', borderRadius:3, marginBottom:28 }} />
          <div className="zt-egg-title" style={{
            fontFamily:"'Impact','Arial Black',sans-serif",
            fontSize:'clamp(28px, 7vw, 72px)',
            fontWeight:900,
            color:'#ffdd00',
            textShadow:'0 0 30px #ff0000, 0 0 60px #990000, 3px 3px 0 #000',
            letterSpacing:4, textTransform:'uppercase', textAlign:'center',
            lineHeight:1.15, padding:'0 20px',
            animation:'egg-slam 0.65s cubic-bezier(0.17,0.89,0.32,1.28) forwards, egg-shake 0.5s 0.7s ease-in-out',
          }}>YOU HAVE<br/>GONE TOO FAR!!!</div>
          <div className="zt-egg-sub" style={{
            marginTop:22,
            fontFamily:"'Impact','Arial Black',sans-serif",
            fontSize:'clamp(12px, 2.5vw, 20px)',
            color:'#ff4444', letterSpacing:6,
            textShadow:'0 0 10px #ff0000',
            textTransform:'uppercase',
            animation:'egg-sub 1.3s ease-out forwards, egg-flicker 0.35s 1.7s infinite',
          }}>the head has left the building</div>
          <div style={{ width:'75%', height:5, background:'linear-gradient(to right,transparent,#cc0000,#cc0000,transparent)', borderRadius:3, marginTop:28 }} />
          <div style={{ marginTop:18, color:'#ff444488', fontSize:'clamp(10px,1.5vw,13px)', letterSpacing:3, fontFamily:"'Impact','Arial Black',sans-serif", textTransform:'uppercase', animation:'egg-flicker 1s 2s infinite' }}>tap anywhere to continue</div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAbout && (
        <div onClick={() => setShowAbout(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'all', isolation: 'isolate'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#2a2018', border: '1px solid #6a5438',
            borderRadius: 12, padding: '28px 32px', minWidth: 260, maxWidth: '90vw',
            boxShadow: '0 8px 40px rgba(0,0,0,0.8)', textAlign: 'center', touchAction: 'none'
          }}>
            <div style={{ color: '#ffcc77', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Avi Moraly</div>
            <div style={{ color: '#8a7a66', fontSize: 10, marginBottom: 20, letterSpacing: 1 }}>ZOUK 3D TRAINER</div>
            <a href="mailto:avimoraly@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
              avimoraly@gmail.com
            </a>
            <a href="https://www.instagram.com/avimoraly/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="25%" stopColor="#e6683c"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)"/>
                <circle cx="12" cy="12" r="4" stroke="url(#igGrad)"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#dc2743" stroke="none"/>
              </svg>
              instagram.com/avimoraly
            </a>
            <a href="https://www.facebook.com/avimoraly" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              facebook.com/avimoraly
            </a>
            <button onClick={() => setShowAbout(false)} style={{ padding: '6px 20px', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};
