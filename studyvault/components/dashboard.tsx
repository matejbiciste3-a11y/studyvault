"use client";

import { useMemo, useRef, useState } from "react";
import type { StudyDocument } from "@/lib/documents";

type Props = { role: "reader" | "admin"; documents: StudyDocument[] };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function Dashboard({ role, documents: initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Vše");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Informatika");
  const fileRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === "admin";

  const categories = useMemo(() => ["Vše", ...Array.from(new Set(documents.map((doc) => doc.category))).sort()], [documents]);
  const filtered = documents.filter((doc) => {
    const matchesQuery = `${doc.title} ${doc.category}`.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs"));
    return matchesQuery && (category === "Vše" || doc.category === category);
  });

  async function refresh() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setDocuments(data.documents);
    }
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("title", title || file.name.replace(/\.[^.]+$/, ""));
    form.append("category", newCategory);
    const response = await fetch("/api/documents", { method: "POST", body: form });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error || "Nahrávání se nezdařilo.");
      return;
    }
    setMessage("Dokument byl bezpečně nahrán.");
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
    await refresh();
    setUploadOpen(false);
  }

  async function removeDocument(pathname: string) {
    if (!window.confirm("Opravdu chceš tento dokument odstranit?")) return;
    const response = await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname })
    });
    if (response.ok) await refresh();
    else setMessage("Dokument se nepodařilo odstranit.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark small">S</span><span>StudyVault<span className="brand-dot">.</span></span></a>
        <div className="side-label">KNIHOVNA</div>
        <button className={`side-link ${category === "Vše" ? "active" : ""}`} onClick={() => setCategory("Vše")}><span>▦</span> Všechny dokumenty <b>{documents.length}</b></button>
        <div className="side-label category-label">KATEGORIE</div>
        {categories.filter((item) => item !== "Vše").map((item) => (
          <button key={item} className={`side-link ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}><span>▱</span> {item}</button>
        ))}
        <div className="sidebar-bottom">
          <div className="storage-card"><div className="storage-icon">✦</div><strong>Tvoje znalosti. Vždy po ruce.</strong><p>Soukromé místo pro studijní materiály.</p></div>
          <div className="user-row"><div className="avatar">{isAdmin ? "A" : "U"}</div><div><strong>{isAdmin ? "Správce" : "Čtenář"}</strong><span>{isAdmin ? "Plný přístup" : "Režim pro čtení"}</span></div><form action="/api/auth/logout" method="post"><button className="logout" title="Odhlásit se">↗</button></form></div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar"><div className="breadcrumb">Moje knihovna <span>/</span> <strong>{category === "Vše" ? "Všechny dokumenty" : category}</strong></div><div className="top-actions"><span className="secure-pill"><i /> Soukromá knihovna</span>{isAdmin && <button className="primary-button top-upload" onClick={() => setUploadOpen(true)}>＋ Nahrát dokument</button>}</div></header>
        <div className="content-wrap">
          <div className="welcome-row"><div><div className="eyebrow">TVŮJ PROSTOR PRO UČENÍ</div><h1>Všechno důležité.<br/><span>Na jednom místě.</span></h1><p className="muted">Učebnice, skripta a poznámky dostupné kdykoliv a odkudkoliv.</p></div><div className="hero-art"><div className="art-card art-back">✧</div><div className="art-card art-front"><span>SV</span><small>STUDYVAULT</small></div><div className="art-spark">✳</div></div></div>

          <div className="stats-row"><div className="stat-card"><span>CELKEM DOKUMENTŮ</span><strong>{documents.length.toString().padStart(2, "0")}</strong><small>Ve tvé knihovně</small></div><div className="stat-card"><span>KATEGORIE</span><strong>{Math.max(0, categories.length - 1).toString().padStart(2, "0")}</strong><small>Studijní oblasti</small></div><div className="stat-card"><span>TVŮJ PŘÍSTUP</span><strong className="access-stat">{isAdmin ? "Admin" : "Čtenář"}</strong><small>{isAdmin ? "Nahrávání povoleno" : "Pouze prohlížení"}</small></div></div>

          <div className="library-heading"><div><div className="eyebrow">ARCHIV MATERIÁLŮ</div><h2>{category === "Vše" ? "Tvoje dokumenty" : category}</h2></div><div className="search-wrap"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat v knihovně..." /></div></div>
          {message && <div className="notice">{message}<button onClick={() => setMessage("")}>×</button></div>}
          {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><h3>{documents.length === 0 ? "Knihovna zatím čeká na první dokument" : "Nic jsme nenašli"}</h3><p>{documents.length === 0 ? "Až nahraješ první učebnici nebo poznámky, objeví se tady." : "Zkus změnit hledaný výraz nebo kategorii."}</p>{isAdmin && documents.length === 0 && <button className="primary-button" onClick={() => setUploadOpen(true)}>＋ Nahrát první dokument</button>}</div> : <div className="document-grid">{filtered.map((doc) => {
            const isPdf = doc.contentType === "application/pdf" || doc.pathname.toLowerCase().endsWith(".pdf");
            return <article className="document-card" key={doc.pathname}><div className={`file-icon ${isPdf ? "pdf" : "image"}`}>{isPdf ? "PDF" : "IMG"}</div><div className="doc-category">{doc.category}</div><h3>{doc.title}</h3><div className="doc-meta"><span>{formatSize(doc.size)}</span><span>·</span><span>{formatDate(doc.uploadedAt)}</span></div><div className="doc-actions"><a href={`/api/documents/file?pathname=${encodeURIComponent(doc.pathname)}`} target="_blank" rel="noreferrer">Otevřít dokument <span>↗</span></a>{isAdmin && <button onClick={() => removeDocument(doc.pathname)} title="Odstranit dokument">⌫</button>}</div></article>;
          })}</div>}
          <footer className="footer-note">STUDYVAULT <span>·</span> TVOJE ZNALOSTI, TVŮJ PROSTOR</footer>
        </div>
      </section>

      {uploadOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false); }}><div className="upload-modal"><div className="modal-head"><div><div className="eyebrow">ROZŠIŘ KNIHOVNU</div><h2>Nahrát dokument</h2></div><button className="modal-close" onClick={() => setUploadOpen(false)}>×</button></div><form onSubmit={upload}><label>Název dokumentu</label><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Např. Základy elektrotechniky" maxLength={100}/><label>Kategorie</label><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Např. Elektrotechnika" maxLength={50} required/><label>Soubor</label><input ref={fileRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" required/><p className="upload-hint">PDF nebo fotografie (JPG, PNG, WebP). Maximálně 25 MB.</p>{message && <div className="notice">{message}</div>}<button className="primary-button modal-submit" disabled={busy}>{busy ? "Nahrávám..." : "Nahrát do knihovny ↗"}</button></form></div></div>}
    </main>
  );
}
