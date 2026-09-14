'use client';

import type { FormEvent } from 'react';
import { handleNameInput, handleEmailInput } from '@/lib/field-validation';
import { useState } from 'react';
import { ArrowRight, UserRound } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
export default function AuthForm() {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('/api/auth/' + mode, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      const current = new URL(location.href);
      const target = current.searchParams.get('return_to');
      let next = '/account' + current.search;
      if (mode === 'login' && target) {
        const url = new URL(target, location.origin);
        if (
          url.origin === location.origin &&
          url.pathname.startsWith('/') &&
          !url.pathname.startsWith('/api/')
        )
          next = url.pathname + url.search;
      }
      location.assign(next);
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="content-page">
      <div className="panel auth-panel">
        <UserRound size={36} strokeWidth={1.2} />
        <span className="eyebrow">SANA AİT BİR VELORA DENEYİMİ</span>
        <h1 className="page-title">İyi ki geldin.</h1>
        <p className="muted">Sepetin, siparişlerin ve topluluğun burada.</p>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            setError('');
          }}
        >
          <TabsList className="auth-tabs">
            <TabsTrigger value="login">Giriş yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt ol</TabsTrigger>
          </TabsList>
        </Tabs>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <form className="form" onSubmit={submit} key={mode}>
          {mode === 'register' && (
            <label>
              Ad soyad
              <input
                className="field"
                name="name"
                autoComplete="name"
                minLength={3}
                maxLength={100}
                onInput={handleNameInput}
                required
              />
            </label>
          )}
          <label>
            E-posta
            <input
              className="field"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              onInput={handleEmailInput}
              required
            />
          </label>
          <label>
            Şifre
            <input
              className="field"
              name="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={mode === 'register' ? 12 : 1}
              maxLength={128}
              required
            />
            {mode === 'register' && <span className="muted">En az 12 karakter kullan.</span>}
          </label>
          {mode === 'register' && (
            <label className="auth-consent">
              <input type="checkbox" required />
              <span>
                <a href="/info" target="_blank" rel="noreferrer">
                  Hesap ve alışveriş açıklamasını
                </a>{' '}
                okudum.
              </span>
            </label>
          )}
          <button className="button" disabled={busy}>
            {busy ? 'İşlem yapılıyor…' : mode === 'register' ? 'Hesabımı oluştur' : 'Giriş yap'}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
