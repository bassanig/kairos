'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Pendulum } from '../room-gate';

export default function OwnerLogin() {
  const [key, setKey] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <div className="room-entry"><div className="entry-brand"><Pendulum />kairos</div>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try {
        const response = await fetch('/api/owner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw Error(result.error || 'Não foi possível entrar.');
        window.location.replace('/');
      } catch (failure) { setError((failure as Error).message); setBusy(false); }
    }}>
      <div className="eyebrow">SEU ESPAÇO, SUA CHAVE</div><h1>Acesso do proprietário.</h1>
      <p>Entre com a chave que você configurou para administrar sua sala.</p>
      <label>Chave do proprietário<input autoFocus type="password" autoComplete="current-password" minLength={16} maxLength={256} required value={key} onChange={event => setKey(event.target.value)} /></label>
      {error && <p className="room-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      <small>O acesso fica salvo neste dispositivo por 30 dias.</small>
      <button type="button" disabled={busy} className="leave-room" onClick={async () => {
        setBusy(true); setError('');
        try {
          const response = await fetch('/api/owner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
          if (!response.ok) throw Error('Não foi possível sair.');
          window.location.replace('/');
        } catch (failure) { setError((failure as Error).message); setBusy(false); }
      }}>Sair do acesso de proprietário</button>
      <div className="entry-divider" /><Link href="/">Entrar com a senha de uma sala →</Link>
    </form><span className="entry-foot">Tempo para o que importa.</span>
  </div>;
}
