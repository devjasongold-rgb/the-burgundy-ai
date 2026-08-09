import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <nav className="nav">
        <div className="brand">THE BURGUNDY</div>
        <div className="badge">AI Hospitality</div>
      </nav>
      <section className="hero">
        <div className="badge">The Burgundy by Chef Stone · Abuja</div>
        <h1>Luxury hospitality, handled through conversation.</h1>
        <p>
          A production foundation for WhatsApp reservations, guest concierge,
          tasting-menu intelligence, private-event enquiries and restaurant operations.
        </p>
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <Link className="btn" href="/dashboard">Open dashboard</Link>
          <Link className="btn secondary" href="/api/health">System health</Link>
        </div>
      </section>
      <section className="grid">
        <div className="card"><h3>WhatsApp Concierge</h3><p>Natural guest conversations backed by restaurant-specific knowledge.</p></div>
        <div className="card"><h3>Reservations</h3><p>Foundation for real availability, confirmation, modification and cancellation flows.</p></div>
        <div className="card"><h3>Private Events</h3><p>Capture and qualify birthday, anniversary and corporate event enquiries.</p></div>
      </section>
    </main>
  );
}
