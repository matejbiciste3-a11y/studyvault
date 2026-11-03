import { getSession } from "@/lib/auth";
import { getDocuments } from "@/lib/documents";
import Dashboard from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <div className="brand-mark">S</div>
          <div className="eyebrow">SOUKROMÁ STUDIJNÍ KNIHOVNA</div>
          <h1>StudyVault<span>.</span></h1>
          <p className="muted login-copy">Všechny tvoje učebnice a poznámky na jednom místě.</p>
          <form action="/api/auth/login" method="post" className="login-form">
            <label htmlFor="password">Přístupové heslo</label>
            <input id="password" name="password" type="password" placeholder="Zadej heslo" autoComplete="current-password" required />
            <button className="primary-button" type="submit">Vstoupit do knihovny <span>↗</span></button>
          </form>
          <p className="login-foot">Přístup je určen pouze pozvaným uživatelům.</p>
        </div>
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
      </main>
    );
  }

  const documents = await getDocuments().catch(() => []);
  return <Dashboard role={session.role} documents={documents} />;
}
