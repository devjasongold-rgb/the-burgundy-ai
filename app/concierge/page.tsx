"use client";
import { useState } from "react";

export default function Concierge() {
  const [messages, setMessages] = useState<{role:"user"|"assistant";content:string}[]>([
    {role:"assistant", content:"Welcome to The Burgundy. How may I assist you this evening?"}
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages(m => [...m, {role:"user", content:text}]);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:text})});
      const data = await r.json();
      setMessages(m => [...m, {role:"assistant", content:data.reply || data.error || "Something went wrong."}]);
    } finally { setBusy(false); }
  }

  return <main className="container">
    <div className="badge">Live agent interface</div>
    <h1 style={{fontFamily:"Georgia,serif"}}>The Burgundy Concierge</h1>
    <p style={{color:"var(--muted)"}}>This interface uses the same agent/tool layer that will receive WhatsApp messages.</p>
    <div className="chat">
      {messages.map((m,i)=><div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
      {busy && <div className="msg assistant">Thinking…</div>}
    </div>
    <div className="form">
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about dinner, reservations or private events…" />
      <button className="btn" onClick={send}>Send</button>
    </div>
  </main>;
}
