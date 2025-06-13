"use client";
import { useState } from "react";

export default function AdaTesting() {
  const [docId, setDocId] = useState("");
  const [docText, setDocText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  // add a document
  async function handleAdd() {
    if (!docId || !docText) return;
    setBusy(true);
    try {
      await fetch("/api/vectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, text: docText }),
      });
      setDocId("");
      setDocText("");
      alert("Document added!");
    } catch (err) {
      console.error(err);
      alert("Add failed");
    } finally {
      setBusy(false);
    }
  }

  // run a search
  async function handleSearch() {
    if (!query) return;
    setBusy(true);
    try {
      const resp = await fetch(
        `/api/vectors?q=${encodeURIComponent(query)}&k=5`
      );
      const json = await resp.json();
      setResults(json.results || []);
    } catch (err) {
      console.error(err);
      alert("Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>🔍 ADA Embed + In-Memory Search</h1>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Add a Document</h2>
        <input
          style={inputStyle}
          placeholder="Document ID"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
        />
        <textarea
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder="Document text…"
          value={docText}
          onChange={(e) => setDocText(e.target.value)}
        />
        <button style={buttonStyle} onClick={handleAdd} disabled={busy}>
          {busy ? "Adding…" : "➕ Add Document"}
        </button>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Search</h2>
        <input
          style={inputStyle}
          placeholder="Your query…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button style={buttonStyle} onClick={handleSearch} disabled={busy}>
          {busy ? "Searching…" : "🔍 Search"}
        </button>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {results.map((r, i) => (
            <li key={i} style={resultItemStyle}>
              <strong>{r.text}</strong>
              <br />
              <small style={{ color: "#adb5bd" }}>score: {r.score.toFixed(4)}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Dark mode styles
const pageStyle = {
  padding: "2rem",
  fontFamily: "Segoe UI, sans-serif",
  backgroundColor: "#121212",
  minHeight: "100vh",
  color: "#f8f9fa",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "2rem",
  color: "#ffffff",
};

const sectionStyle = {
  backgroundColor: "#1e1e1e",
  padding: "1.5rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  marginBottom: "2rem",
};

const sectionTitleStyle = {
  marginBottom: "1rem",
  color: "#e9ecef",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  fontSize: "1rem",
};

const buttonStyle = {
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  backgroundColor: "#0d6efd",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const resultItemStyle = {
  background: "#2c2f33",
  padding: "1rem",
  borderRadius: "8px",
  marginBottom: "0.75rem",
  color: "#ffffff",
};
