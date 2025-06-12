"use client";
import { useState } from "react";

export default function Page() {
  const [docs, setDocs] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);

  async function add() {
    const arr = docs
      .split("\n\n")
      .filter((t) => t.trim())
      .map((t, i) => ({ id: `d-${Date.now()}-${i}`, text: t }));
    const res = await fetch("/api/add-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docs: arr }),
    });
    console.log(await res.json());
  }

  async function search() {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, k: 5 }),
    });
    const { hits } = await res.json();
    setHits(hits);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Next.js → Python FAISS Demo</h1>
      <textarea
        rows={4}
        placeholder="Paste docs, blank-line separated"
        value={docs}
        onChange={(e) => setDocs(e.target.value)}
      />
      <button onClick={add}>Add Docs</button>
      <hr />
      <input
        type="text"
        placeholder="Your semantic query…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button onClick={search}>Search</button>
      <ul>
        {hits.map((h) => (
          <li key={h.id}>{h.text}</li>
        ))}
      </ul>
    </div>
  );
}