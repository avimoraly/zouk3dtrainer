export default function AboutModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'all', isolation: 'isolate'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
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
        <button onClick={onClose} style={{ padding: '6px 20px', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Close</button>
      </div>
    </div>
  );
}
