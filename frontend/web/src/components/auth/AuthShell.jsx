import { Shield } from 'lucide-react'

function AuthShell({ eyebrow = 'A little more peace of mind', children }) {
  return <div className="auth-shell">
    <aside className="auth-visual">
      <div className="brand"><span className="brand-mark"><Shield size={20} /></span><span><span className="brand-name">RakshaPath</span><span className="brand-sub">TRAVEL WITH CLARITY</span></span></div>
      <div className="auth-copy"><span className="pill pill-lime">{eyebrow}</span><h1>Know the road.<br />Keep your people close.</h1><p>Thoughtful tools for a more confident journey, wherever today takes you.</p></div>
      <span className="muted" style={{ fontSize: 10 }}>An independent demo workspace · Not an emergency service</span>
    </aside>
    <main className="auth-content"><div className="auth-card">{children}<p className="demo-note">Demo authentication only. Accounts stay in this browser. Avoid real passwords or sensitive personal information.</p><p className="demo-note" style={{ marginTop: 11 }}>© RakshaPath · Safety begins with awareness.</p></div></main>
  </div>
}

export default AuthShell
