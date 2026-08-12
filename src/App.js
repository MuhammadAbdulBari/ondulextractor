import React, { useState, useRef, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import "./App.css";

// 🔑 Set your secret key here
const SECRET_KEY = "ondulex&098";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

// 🗺️ Paste the SAME Google Maps API key you already have in index.html's
// script tag (the one after "key="). This app now talks to the Places API
// (New) directly over HTTPS instead of the deprecated PlacesService, so it
// no longer needs the Maps JavaScript SDK loaded at all — you can remove
// the <script src="https://maps.googleapis.com/maps/api/js?key=...">
// line from index.html once this is working, if nothing else on the page
// needs it.
const GOOGLE_PLACES_API_KEY = "AIzaSyBS1UFMCHiubIkXhWXV8DAgluIYDIeZlb8";

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "nextPageToken",
].join(",");

// Text Search (New): https://places.googleapis.com/v1/places:searchText
// Returns places + phone/website/rating in ONE request (no separate
// getDetails() call needed), and paginates with a real nextPageToken
// instead of the legacy client-side pagination object.
async function fetchPlacesPage(query, pageToken) {
  const body = { textQuery: query, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error?.message || `Places API error (HTTP ${response.status})`;
    throw new Error(message);
  }

  return response.json(); // { places: [...], nextPageToken? }
}

// Builds an <img> src for a Places (New) photo resource.
function photoUrl(photo, maxWidthPx = 400) {
  if (!photo?.name) return null;
  return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${maxWidthPx}&key=${GOOGLE_PLACES_API_KEY}`;
}

/* ------------------------------------------------------------------ */
/*  Icon set — small line marks, drawn once, reused everywhere.        */
/*  No icon font dependency: every mark below is inline SVG.           */
/* ------------------------------------------------------------------ */

const CompassRose = ({ spinning = false, size = 56 }) => (
  <svg
    className={`compass-rose${spinning ? " compass-rose--spinning" : ""}`}
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    <circle cx="32" cy="32" r="21" stroke="currentColor" strokeWidth="1" opacity="0.25" />
    {[0, 90, 180, 270].map((deg) => (
      <line key={deg} x1="32" y1="3" x2="32" y2="9" stroke="currentColor" strokeWidth="1.5" transform={`rotate(${deg} 32 32)`} />
    ))}
    {[45, 135, 225, 315].map((deg) => (
      <line key={deg} x1="32" y1="6" x2="32" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" transform={`rotate(${deg} 32 32)`} />
    ))}
    <polygon points="32,10 37,32 32,29.5 27,32" className="compass-needle-brass" />
    <polygon points="32,54 37,32 32,34.5 27,32" className="compass-needle-dark" />
    <circle cx="32" cy="32" r="2.4" fill="currentColor" />
    <text x="32" y="15.5" textAnchor="middle" className="compass-label">N</text>
  </svg>
);

const PinIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);

const PhoneIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C10.6 21.1 2.9 13.4 2.9 4.1 2.9 3.5 3.4 3 4 3h3.6c.6 0 1.1.5 1.1 1.1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
  </svg>
);

const GlobeIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

const StarIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.9 6.3 6.7.7-5 4.7 1.4 6.8L12 17.6l-6 3.4 1.4-6.8-5-4.7 6.7-.7L12 2.5z" />
  </svg>
);

const ArrowLeftIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

const DownloadIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16" />
  </svg>
);

const KeyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l7-7m0 0h4m-4 0v4m-2-2l2 2" />
  </svg>
);

/* Purely decorative ruler of tick marks — echoes a chart's edge scale. */
const TickRule = ({ count = 48 }) => (
  <div className="tick-rule" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className={i % 6 === 0 ? "tick tick--major" : "tick"} />
    ))}
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredKey, setEnteredKey] = useState("");

  // NEW: when true, only entries with no websiteUri are shown/exported
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);

  // kept in refs so they're stable across renders and never captured in a
  // stale closure
  const nextPageTokenRef = useRef(null);
  const isFetchingRef = useRef(false); // hard guard against double-calls

  // ✅ Check session on app load
  useEffect(() => {
    const savedSession = localStorage.getItem("onduleSession");
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      if (Date.now() < sessionData.expiry) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("onduleSession"); // expired
      }
    }
  }, []);

  // ✅ Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (enteredKey === SECRET_KEY) {
      const expiry = Date.now() + SESSION_DURATION;
      localStorage.setItem(
        "onduleSession",
        JSON.stringify({ key: SECRET_KEY, expiry })
      );
      setIsAuthenticated(true);
    } else {
      alert("❌ Invalid key. Please try again.");
    }
  };

  // Runs a Text Search (New) page and appends results to state.
  // Shared by both the initial search and "Load More".
  const runSearch = async (pageToken) => {
    setLoading(true);
    setError("");
    isFetchingRef.current = true;

    try {
      const data = await fetchPlacesPage(query, pageToken);
      const places = data.places || [];

      setResults((prev) => (pageToken ? [...prev, ...places] : places));
      setActiveTab("results");

      nextPageTokenRef.current = data.nextPageToken || null;
      setHasMore(!!data.nextPageToken);
    } catch (err) {
      console.error("Places API request failed:", err);
      setError(err.message || "Google Places request failed.");
      nextPageTokenRef.current = null;
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (isFetchingRef.current) return;

    setResults([]);
    nextPageTokenRef.current = null;
    setHasMore(false);
    setNoWebsiteOnly(false); // reset filter on a fresh search

    runSearch(null);
  };

  const loadMore = () => {
    if (!nextPageTokenRef.current) return;
    if (isFetchingRef.current) return;

    // A freshly issued nextPageToken needs a short moment before Google
    // will accept it — matches Google's own guidance for Text Search
    // pagination.
    setLoading(true);
    isFetchingRef.current = true;
    setTimeout(() => {
      runSearch(nextPageTokenRef.current);
    }, 2000);
  };

  // NEW: toggles the "no website only" filter
  const toggleNoWebsiteOnly = () => {
    setNoWebsiteOnly((prev) => !prev);
  };

  // NEW: the list actually rendered/exported, respecting the filter
  const visibleResults = noWebsiteOnly
    ? results.filter((item) => !item.websiteUri)
    : results;

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      visibleResults.map((item) => ({
        Name: item.displayName?.text || "N/A",
        Address: item.formattedAddress || "N/A",
        Phone: item.nationalPhoneNumber || "N/A",
        Website: item.websiteUri || "N/A",
        Rating: item.rating ?? "N/A",
        "Total Reviews": item.userRatingCount ?? "0",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Google Leads");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const sanitizedQuery = query.replace(/[^a-zA-Z0-9_-]/g, "_");
    saveAs(
      data,
      `leads_${sanitizedQuery}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // 🔐 Login gate
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-grid" aria-hidden="true" />
        <div className="login-card">
          <div className="login-icon"><KeyIcon /></div>
          <p className="eyebrow">Restricted log</p>
          <h1 className="login-title">Access key required</h1>
          <p className="login-sub">This manifest is private. Enter your key to open it.</p>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="access-key" className="field-label">Key</label>
            <input
              id="access-key"
              type="password"
              value={enteredKey}
              onChange={(e) => setEnteredKey(e.target.value)}
              placeholder="••••••••••"
              required
              autoFocus
            />
            <button type="submit" className="btn-stamp btn-stamp--full">
              Unlock log <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {activeTab === "search" && (
        <SearchSection
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          loading={loading}
        />
      )}

      {activeTab === "results" && (
        <ResultsSection
          query={query}
          results={visibleResults}
          loading={loading}
          error={error}
          onBack={() => setActiveTab("search")}
          onDownload={downloadExcel}
          onLoadMore={loadMore}
          hasMore={hasMore}
          noWebsiteOnly={noWebsiteOnly}
          onToggleNoWebsiteOnly={toggleNoWebsiteOnly}
        />
      )}

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search — the chart room                                           */
/* ------------------------------------------------------------------ */

const SearchSection = ({ query, setQuery, handleSearch, loading }) => (
  <section className="chart-hero">
    <div className="chart-grid" aria-hidden="true" />
    <TickRule count={40} />

    <div className="hero-content">
      <div className="compass-wrap">
        <CompassRose spinning={loading} size={64} />
      </div>

      <p className="eyebrow">Prospect Log · sourced from Google Maps</p>
      <h1 className="hero-title">
        Plot your next
        <br />
        <em>leads.</em>
      </h1>
      <p className="hero-sub">
        Enter a place or a trade below. Every business we find gets logged
        with its name, number, address and rating — ready to export.
      </p>

      <form className="log-entry-form" onSubmit={handleSearch}>
        <label htmlFor="query" className="field-label">Entry</label>
        <div className="log-entry-row">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Restaurants in Karachi"
            required
            disabled={loading}
          />
          <button type="submit" className="btn-stamp" disabled={loading}>
            {loading ? "Charting…" : "Chart it"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </div>

    <TickRule count={40} />
  </section>
);

/* ------------------------------------------------------------------ */
/*  Results — the manifest                                            */
/* ------------------------------------------------------------------ */

const ResultsSection = ({
  query,
  results,
  loading,
  error,
  onBack,
  onDownload,
  onLoadMore,
  hasMore,
  noWebsiteOnly,
  onToggleNoWebsiteOnly,
}) => (
  <div className="manifest">
    <header className="manifest-header">
      <button onClick={onBack} className="back-link">
        <ArrowLeftIcon /> Back to search
      </button>
      <p className="eyebrow">Manifest for</p>
      <h2 className="manifest-title">{query}</h2>
      <p className="manifest-count">
        {results.length} {results.length === 1 ? "entry" : "entries"} charted
        {hasMore ? " · more available" : ""}
      </p>
    </header>

    {error && (
      <div className="alert-rust" role="alert">
        {error}
      </div>
    )}

    {loading && results.length === 0 && (
      <div className="state-block">
        <CompassRose spinning size={48} />
        <p>Charting the area…</p>
      </div>
    )}

    {results.length > 0 && (
      <>
        <div className="card-grid">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} index={index} />
          ))}
        </div>

        <div className="manifest-actions">
          <button onClick={onDownload} className="btn-stamp">
            <DownloadIcon /> Export manifest
          </button>
          {/* NEW: functional toggle button, no other UI/behavior changed */}
          <button
            type="button"
            onClick={onToggleNoWebsiteOnly}
            className="btn-ghost"
            aria-pressed={noWebsiteOnly}
          >
            <GlobeIcon /> {noWebsiteOnly ? "Show all" : "No website only"}
          </button>
          {hasMore && (
            <button onClick={onLoadMore} className="btn-ghost" disabled={loading}>
              {loading ? "Charting…" : "Chart more"}
            </button>
          )}
        </div>
      </>
    )}

    {!loading && results.length === 0 && !error && (
      <div className="state-block">
        <PinIcon size={26} />
        <p>Nothing charted yet.</p>
        <p className="muted">Try a different place or trade.</p>
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Result card — one logged entry                                    */
/* ------------------------------------------------------------------ */

const ResultCard = ({ result, index }) => {
  const entryNo = String(index + 1).padStart(2, "0");
  const name = result.displayName?.text;
  const photoSrc = result.photos?.[0] ? photoUrl(result.photos[0]) : null;
  let hostname = null;
  if (result.websiteUri) {
    try {
      hostname = new URL(result.websiteUri).hostname.replace(/^www\./, "");
    } catch (e) {
      hostname = result.websiteUri;
    }
  }

  return (
    <article className="chart-card">
      <div className="card-top-row">
        <span className="entry-no">Entry № {entryNo}</span>
        {result.rating && (
          <span className="rating-seal">
            <StarIcon /> {result.rating}
          </span>
        )}
      </div>

      <div className="card-media">
        {photoSrc ? (
          <img
            className="card-media-img"
            src={photoSrc}
            alt={name || "Business photo"}
          />
        ) : (
          <div className="card-media-empty">
            <PinIcon size={20} />
          </div>
        )}
      </div>

      <h3 className="card-name">{name || "Unnamed entry"}</h3>

      <dl className="card-detail-list">
        <div className="detail-row">
          <PinIcon />
          <dd>{result.formattedAddress || "No address on file"}</dd>
        </div>
        <div className="detail-row">
          <PhoneIcon />
          <dd>{result.nationalPhoneNumber || "No number on file"}</dd>
        </div>
        <div className="detail-row">
          <GlobeIcon />
          <dd>
            {result.websiteUri ? (
              <a href={result.websiteUri} target="_blank" rel="noopener noreferrer">
                {hostname}
              </a>
            ) : (
              "No website on file"
            )}
          </dd>
        </div>
      </dl>

      {result.rating && (
        <p className="review-count">
          {result.userRatingCount || 0} reviews logged
        </p>
      )}
    </article>
  );
};

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

const Footer = () => (
  <footer className="footer">
    <span>Prospect Log</span>
    <span className="footer-dot">·</span>
    <span>Built by Abdul Bari, {new Date().getFullYear()}</span>
  </footer>
);

export default App;
