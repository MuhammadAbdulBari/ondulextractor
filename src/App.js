@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */

:root {
  --ink: #0f1b28;
  --ink-2: #14233570;
  --panel: #17263a;
  --panel-border: #2a3d54;
  --parchment: #ede3c8;
  --parchment-2: #e3d7b3;
  --parchment-ink: #22293163;
  --brass: #c8992f;
  --brass-light: #e3b94f;
  --rust: #b8503f;
  --mist: #91a6b9;
  --ink-text: #1c2733;

  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --radius: 3px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--ink);
  color: var(--parchment);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: inherit;
}

button {
  font-family: var(--font-body);
  cursor: pointer;
}

button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid var(--brass-light);
  outline-offset: 3px;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass);
  margin: 0 0 0.6rem;
}

.field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mist);
  margin-bottom: 0.5rem;
}

.muted {
  color: var(--mist);
}

/* ------------------------------------------------------------------ */
/*  Tick rule — decorative chart-edge scale, reused across screens     */
/* ------------------------------------------------------------------ */

.tick-rule {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 clamp(1.5rem, 6vw, 5rem);
  height: 16px;
  opacity: 0.5;
}

.tick {
  width: 1px;
  height: 5px;
  background: var(--brass);
  opacity: 0.55;
}

.tick--major {
  height: 10px;
  opacity: 0.85;
}

@media (max-width: 640px) {
  .tick-rule {
    display: none;
  }
}

/* ------------------------------------------------------------------ */
/*  Compass rose — the signature mark                                 */
/* ------------------------------------------------------------------ */

.compass-rose {
  color: var(--brass);
  display: block;
}

.compass-needle-brass {
  fill: var(--brass-light);
}

.compass-needle-dark {
  fill: var(--mist);
  opacity: 0.55;
}

.compass-label {
  font-family: var(--font-mono);
  font-size: 7px;
  fill: var(--brass);
  letter-spacing: 0.05em;
}

@media (prefers-reduced-motion: no-preference) {
  .compass-rose--spinning {
    animation: compass-spin 2.4s linear infinite;
  }
}

@keyframes compass-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ------------------------------------------------------------------ */
/*  Search hero — the chart room                                      */
/* ------------------------------------------------------------------ */

.chart-hero {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  overflow: hidden;
  padding: 1.75rem 0;
}

.chart-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--panel-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--panel-border) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.22;
  mask-image: radial-gradient(ellipse at center, black 5%, transparent 78%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: auto;
  padding: 3rem 1.75rem;
  text-align: center;
}

.compass-wrap {
  display: inline-flex;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.4rem, 6vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--parchment);
  margin: 0 0 1.1rem;
}

.hero-title em {
  font-style: italic;
  font-weight: 500;
  color: var(--brass-light);
}

.hero-sub {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--mist);
  max-width: 460px;
  margin: 0 auto 2.4rem;
}

.log-entry-form {
  text-align: left;
  max-width: 480px;
  margin: 0 auto;
}

.log-entry-row {
  display: flex;
  border-bottom: 1.5px solid var(--brass);
  padding-bottom: 0.6rem;
  gap: 0.75rem;
  align-items: center;
}

.log-entry-row input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--parchment);
  font-family: var(--font-mono);
  font-size: 1.05rem;
  padding: 0.35rem 0.1rem;
}

.log-entry-row input::placeholder {
  color: #5c7085;
}

.log-entry-row input:focus {
  outline: none;
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

.btn-stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--brass);
  color: #1a1204;
  border: none;
  border-radius: var(--radius);
  padding: 0.7rem 1.3rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: transform 0.15s ease, background 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: var(--brass-light);
  transform: translateY(-1px);
}

.btn-stamp:disabled {
  opacity: 0.55;
  cursor: default;
}

.btn-stamp--full {
  width: 100%;
  justify-content: center;
  margin-top: 1.4rem;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: var(--brass-light);
  border: 1px solid var(--brass);
  border-radius: var(--radius);
  padding: 0.65rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: background 0.15s ease;
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(200, 153, 47, 0.12);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: default;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: var(--mist);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0;
  margin-bottom: 1.4rem;
}

.back-link:hover {
  color: var(--brass-light);
}

/* ------------------------------------------------------------------ */
/*  Manifest (results) screen                                          */
/* ------------------------------------------------------------------ */

.manifest {
  flex: 1;
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: clamp(1.75rem, 4vw, 3.25rem) clamp(1.25rem, 4vw, 2.5rem) 3rem;
}

.manifest-header {
  border-bottom: 1px dashed var(--panel-border);
  padding-bottom: 1.4rem;
  margin-bottom: 2rem;
}

.manifest-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-style: italic;
  font-size: clamp(1.7rem, 3.5vw, 2.3rem);
  color: var(--parchment);
  margin: 0 0 0.5rem;
}

.manifest-count {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--mist);
  margin: 0;
}

.alert-rust {
  background: rgba(184, 80, 63, 0.12);
  border-left: 3px solid var(--rust);
  color: #e8a99c;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 0.9rem 1.1rem;
  border-radius: 0 var(--radius) var(--radius) 0;
  margin-bottom: 1.75rem;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  text-align: center;
  color: var(--mist);
  padding: 4.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.state-block p {
  margin: 0;
}

/* ------------------------------------------------------------------ */
/*  Card grid                                                          */
/* ------------------------------------------------------------------ */

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  gap: 1.1rem;
}

.chart-card {
  background: var(--parchment);
  color: var(--ink-text);
  border-radius: var(--radius);
  padding: 1.1rem 1.15rem 1.3rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}

.entry-no {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--parchment-ink);
  opacity: 0.55;
}

.rating-seal {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--brass);
  color: #7a5a12;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.rating-seal svg {
  color: var(--brass);
}

.card-media {
  border-radius: var(--radius);
  overflow: hidden;
  aspect-ratio: 16 / 10;
  margin-bottom: 0.9rem;
  background: var(--parchment-2);
}

.card-media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-media-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a2946a;
  border: 1px dashed #c9b98a;
}

.card-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
  line-height: 1.25;
  margin: 0 0 0.7rem;
}

.card-detail-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.79rem;
  line-height: 1.4;
  color: #3d4753;
}

.detail-row svg {
  flex-shrink: 0;
  margin-top: 0.15rem;
  color: #8a7a45;
}

.detail-row dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.detail-row a {
  text-decoration: underline;
  text-decoration-color: rgba(122, 90, 18, 0.4);
}

.review-count {
  margin: 0.85rem 0 0;
  padding-top: 0.7rem;
  border-top: 1px dashed #cabb92;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: #6b5e3a;
}

/* ------------------------------------------------------------------ */
/*  Manifest actions                                                   */
/* ------------------------------------------------------------------ */

.manifest-actions {
  display: flex;
  gap: 0.9rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2.5rem;
}

/* ------------------------------------------------------------------ */
/*  Login screen                                                       */
/* ------------------------------------------------------------------ */

.login-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.login-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--panel-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--panel-border) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.2;
  mask-image: radial-gradient(ellipse at center, black 5%, transparent 75%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 380px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  padding: 2.4rem 2.1rem;
  text-align: center;
}

.login-icon {
  color: var(--brass);
  display: inline-flex;
  margin-bottom: 1rem;
}

.login-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.55rem;
  color: var(--parchment);
  margin: 0 0 0.6rem;
}

.login-sub {
  color: var(--mist);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1.6rem;
}

.login-form {
  text-align: left;
}

.login-form input {
  width: 100%;
  background: var(--ink);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  color: var(--parchment);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  padding: 0.75rem 0.9rem;
}

.login-form input:focus {
  outline: none;
  border-color: var(--brass);
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

.footer {
  border-top: 1px dashed var(--panel-border);
  padding: 1.1rem 1.5rem;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--mist);
}

.footer-dot {
  margin: 0 0.5rem;
  color: var(--brass);
}

/* ------------------------------------------------------------------ */
/*  Small screens                                                      */
/* ------------------------------------------------------------------ */

@media (max-width: 480px) {
  .hero-content {
    padding: 2.2rem 1.25rem;
  }

  .log-entry-row {
    flex-wrap: wrap;
  }

  .btn-stamp {
    width: 100%;
    justify-content: center;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }
}
