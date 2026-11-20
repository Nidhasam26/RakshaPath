import AuthHeroVisual from './AuthHeroVisual'

function AuthShell({ eyebrow = 'A little more peace of mind', children }) {
  return (
    <div className="auth-shell">
      {/* Left Column: Hero Showcase */}
      <aside className="auth-visual">
        <div className="auth-visual-grid" aria-hidden="true" />
        <div className="auth-visual-glow" aria-hidden="true" />

        <div className="auth-visual-inner">
          <div className="auth-copy">
            <span className="pill auth-hero-pill">{eyebrow}</span>
            <h1 className="auth-hero-title">
              <span className="auth-hero-line1">Know the road.</span>
              <span className="auth-hero-line2">
                Keep your <span className="auth-hero-accent">people close.</span>
              </span>
            </h1>
            <p className="auth-hero-tagline">
              <span>PLAN</span>
              <span className="tagline-dot">•</span>
              <span>TRAVEL</span>
              <span className="tagline-dot">•</span>
              <span>STAY SAFE</span>
            </p>
            <p className="auth-hero-subtext">
              Thoughtful tools for a more confident journey, wherever today takes you.
            </p>
          </div>

          <AuthHeroVisual />
        </div>

        <div className="auth-visual-footer">
          <span className="auth-footer-notice">
            An independent demo workspace · Not an emergency service
          </span>
        </div>
      </aside>

      {/* Right Column: Form Viewport */}
      <main className="auth-content">
        <div className="auth-content-inner">
          <div className="auth-card">
            {children}
          </div>
          <div className="auth-bottom-notes">
            <p className="demo-note">
              Demo authentication only. Accounts stay in this browser. Avoid real passwords or sensitive personal information.
            </p>
            <p className="demo-note auth-copyright">
              © RakshaPath
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthShell
