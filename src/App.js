import React, { useState, useRef } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);

  // keep service instance in a ref so it's not recreated
  const serviceRef = useRef(null);

  // stable callback for Google Places
  const placesCallback = (res, status, pagination) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      // For each place, fetch details (phone, website, etc.)
      res.forEach((place) => {
        serviceRef.current.getDetails(
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
            if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK) {
              setResults((prev) => [...prev, details]);
            } else {
              // fallback if details fails
              setResults((prev) => [...prev, place]);
            }
          }
        );
      });

      setActiveTab("results");

      if (pagination && pagination.hasNextPage) {
        // ✅ store the callback correctly
        setNextPage(() => () => {
          // must wait at least 2s before calling nextPage()
          setTimeout(() => {
            pagination.nextPage();
          }, 2000);
        });
      } else {
        setNextPage(null);
      }
    } else {
      setError("Google Places request failed: " + status);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    setNextPage(null);

    try {
      if (!window.google) {
        throw new Error("Google Maps SDK not loaded. Check index.html script.");
      }

      const map = new window.google.maps.Map(document.createElement("div"));
      serviceRef.current = new window.google.maps.places.PlacesService(map);

      const request = { query };
      serviceRef.current.textSearch(request, placesCallback);
    } catch (err) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (nextPage) {
      setLoading(true);
      nextPage(); // ✅ safe call now
    }
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
          hasMore={!!nextPage}
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
          alt="No Image"
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
