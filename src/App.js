import React, { useState, useRef, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import "./App.css";

// 🔑 Set your secret key here
const SECRET_KEY = "ondulex&098";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

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

  // keep service + map + pagination in refs so they're stable across renders
  // and never captured in a stale closure
  const serviceRef = useRef(null);
  const mapRef = useRef(null);
  const paginationRef = useRef(null);
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

  // Get (or lazily create) a single stable, DOM-attached, properly
  // initialized map + PlacesService. Reusing the SAME service instance
  // across the whole session (search + all "load more" pages) instead of
  // recreating it every search is important for pagination reliability.
  const getService = () => {
    if (!window.google) {
      throw new Error("Google Maps SDK not loaded. Check index.html script.");
    }

    if (!mapRef.current) {
      // A real, DOM-attached div with center/zoom set — some Places
      // Service behavior (including pagination) has been reported as
      // flakier on fully detached / unconfigured map instances.
      const container = document.createElement("div");
      container.style.display = "none";
      document.body.appendChild(container);

      mapRef.current = new window.google.maps.Map(container, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
    }

    if (!serviceRef.current) {
      serviceRef.current = new window.google.maps.places.PlacesService(
        mapRef.current
      );
    }

    return serviceRef.current;
  };

  // Fetch details for a batch of place results, waiting for ALL of them
  // to resolve before we touch loading/pagination state again. This
  // prevents "Load More" from becoming clickable (and firing nextPage())
  // while getDetails() calls from the previous page are still in flight
  // on the same PlacesService instance.
  const fetchDetailsForResults = (service, placesResults) => {
    const detailPromises = placesResults.map(
      (place) =>
        new Promise((resolve) => {
          service.getDetails(
            {
              placeId: place.place_id,
              fields: [
                "name",
                "formatted_address",
                "formatted_phone_number",
                "website",
                "rating",
                "user_ratings_total",
                "photos",
              ],
            },
            (details, detailsStatus) => {
              if (
                detailsStatus ===
                window.google.maps.places.PlacesServiceStatus.OK
              ) {
                resolve(details);
              } else {
                // fallback if details fails — keep the basic result
                resolve(place);
              }
            }
          );
        })
    );

    return Promise.all(detailPromises);
  };

  // Shared handler for both the initial textSearch AND every nextPage()
  // call (Google reuses the same callback for pagination pages).
  const placesCallback = (res, status, pagination) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK && res) {
      const service = serviceRef.current;

      fetchDetailsForResults(service, res)
        .then((allDetails) => {
          setResults((prev) => [...prev, ...allDetails]);
          setActiveTab("results");

          paginationRef.current = pagination || null;
          setHasMore(!!(pagination && pagination.hasNextPage));
        })
        .catch((err) => {
          console.error("Error fetching place details:", err);
          setError("Something went wrong while fetching place details.");
        })
        .finally(() => {
          setLoading(false);
          isFetchingRef.current = false;
        });
    } else {
      console.error("Places request failed. Status:", status, "Result:", res);
      setError("Google Places request failed: " + status);
      setLoading(false);
      isFetchingRef.current = false;
      paginationRef.current = null;
      setHasMore(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (isFetchingRef.current) return; // guard against double submit

    setLoading(true);
    setError("");
    setResults([]);
    paginationRef.current = null;
    setHasMore(false);
    isFetchingRef.current = true;

    try {
      const service = getService();
      const request = { query };
      service.textSearch(request, placesCallback);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred");
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const loadMore = () => {
    // Hard guards: must have a valid pagination object, it must still
    // report hasNextPage, and we must not already be mid-fetch.
    if (!paginationRef.current) return;
    if (!paginationRef.current.hasNextPage) {
      setHasMore(false);
      return;
    }
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    // Google requires a short delay before calling nextPage() after the
    // previous page finished rendering.
    setTimeout(() => {
      // Re-check right before firing, in case state changed during the delay
      if (paginationRef.current && paginationRef.current.hasNextPage) {
        try {
          paginationRef.current.nextPage();
        } catch (err) {
          console.error("nextPage() threw:", err);
          setError("Could not load more results. Please try searching again.");
          setLoading(false);
          isFetchingRef.current = false;
        }
      } else {
        setLoading(false);
        isFetchingRef.current = false;
        setHasMore(false);
      }
    }, 2000);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      results.map((item) => ({
        Name: item.name || "N/A",
        Address: item.formatted_address || "N/A",
        Phone: item.formatted_phone_number || "N/A",
        Website: item.website || "N/A",
        Rating: item.rating || "N/A",
        "Total Reviews": item.user_ratings_total || "0",
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

  // 🔐 Show login screen first if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-screen" style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>🔑 Enter Access Key</h1>
        <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
          <input
            type="password"
            value={enteredKey}
            onChange={(e) => setEnteredKey(e.target.value)}
            placeholder="Enter your key..."
            required
            style={{ padding: "10px", width: "250px" }}
          />
          <br />
          <button type="submit" style={{ marginTop: "15px", padding: "10px 20px" }}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  // ✅ Main app after login
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
          results={results}
          loading={loading}
          error={error}
          onBack={() => setActiveTab("search")}
          onDownload={downloadExcel}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      )}

      <Footer />
    </div>
  );
}

// Search Section Component
const SearchSection = ({ query, setQuery, handleSearch, loading }) => (
  <section className="search-section">
    <div className="search-box">
      <h1>🔍 Extract Google Maps Leads</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Restaurant in Karachi"
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin me-2"></i>
              Searching...
            </>
          ) : (
            <>
              <i className="fas fa-search me-2"></i>
              Search Now
            </>
          )}
        </button>
      </form>
    </div>
  </section>
);

// Results Section Component
const ResultsSection = ({
  query,
  results,
  loading,
  error,
  onBack,
  onDownload,
  onLoadMore,
  hasMore,
}) => (
  <div className="container py-5">
    <div className="header-text">
      <button onClick={onBack} className="btn btn-outline-primary btn-sm btn-back">
        <i className="fas fa-arrow-left me-1"></i>Back to Search
      </button>
      <h2>
        🔍 Results for: <em>{query}</em>
      </h2>
      <p className="text-muted">Showing extracted business contact details</p>
    </div>

    {error && <div className="alert alert-danger text-center">{error}</div>}

    {loading && (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Fetching results from Google Maps...</p>
      </div>
    )}

    {results.length > 0 && (
      <>
        <div className="row g-4">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>

        <div className="mt-4 d-flex gap-2 justify-content-center">
          <button onClick={onDownload} className="btn btn-success">
            <i className="fas fa-file-excel me-2"></i>Download Excel
          </button>
          {hasMore && (
            <button onClick={onLoadMore} className="btn btn-primary" disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </>
    )}

    {!loading && results.length === 0 && !error && (
      <div className="text-center text-muted">
        <i className="fas fa-map-marked-alt fa-2x mb-3"></i>
        <p>No results found. Please try a different search.</p>
      </div>
    )}
  </div>
);

// Result Card Component
const ResultCard = ({ result }) => (
  <div className="col-md-4">
    <div className="lead-card">
      {result.photos && result.photos[0] ? (
        <img
          className="lead-img"
          src={result.photos[0].getUrl({ maxWidth: 400 })}
          alt={result.name}
        />
      ) : (
       <img
  className="lead-img"
  src="https://via.placeholder.com/400x200?text=No+Image"
  alt="No preview available"
/>
      )}

      <div className="lead-name">{result.name || "N/A"}</div>
      <div className="lead-detail">
        <i className="fas fa-map-marker-alt me-2"></i>
        {result.formatted_address || "N/A"}
      </div>
      <div className="lead-detail">
        <i className="fas fa-phone-alt me-2"></i>
        {result.formatted_phone_number || "N/A"}
      </div>
      <div className="lead-detail">
        <i className="fas fa-globe me-2"></i>
        {result.website ? (
          <a href={result.website} target="_blank" rel="noopener noreferrer">
            {new URL(result.website).hostname}
          </a>
        ) : (
          "N/A"
        )}
      </div>

      {result.rating && (
        <div className="lead-detail mt-2">
          ⭐ {result.rating} ({result.user_ratings_total || 0} reviews)
        </div>
      )}
    </div>
  </div>
);

// Footer Component
const Footer = () => (
  <footer className="footer">
    &copy; {new Date().getFullYear()} | Built by Abdul Bari | All rights reserved.
  </footer>
);

export default App;
