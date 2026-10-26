import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, LoaderCircle, ShieldCheck, Sprout } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';

export const AccountPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [registerMode, setRegisterMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (registerMode) {
        await api.register({ name, email, password });
      } else {
        await api.login({ email, password });
      }
      await refresh();
      navigate('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="mx-auto max-w-md py-16 text-center text-sm text-gray-500">{t.common.loading}</div>;
  }

  if (user) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-cream-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-forest-900 p-3 text-leaf-300"><LockKeyhole size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-forest-950">{t.ui.account}</h1>
            <p className="text-sm text-gray-500">{t.ui.privateDataDescription}</p>
          </div>
        </div>
        <p className="font-semibold text-gray-900">{user.name}</p>
        <p className="text-sm text-gray-600">{user.email}</p>
        <button
          onClick={() => void logout().then(() => navigate('/')).catch((cause) => setError(cause instanceof Error ? cause.message : t.common.error))}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-5 text-sm font-bold text-forest-900 shadow-sm transition hover:border-forest-300 hover:bg-forest-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
        >
          {t.ui.signOut}
        </button>
        {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section className="account-signin-card mx-auto max-w-xl rounded-3xl border border-cream-200 bg-white p-6 shadow-lg shadow-forest-950/5 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-forest-900 p-3 text-leaf-300"><Sprout size={22} /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t.ui.demoReadOnly}</p>
          <h1 className="text-xl font-bold text-forest-950">{t.ui.demoWelcomeTitle}</h1>
        </div>
      </div>

      <p className="mb-6 rounded-xl bg-cream-50 p-3 text-sm leading-relaxed text-gray-600">
        {t.ui.demoWelcomeDescription}
      </p>

      <h2 className="mb-3 text-sm font-bold text-gray-800">{registerMode ? t.ui.signUp : t.ui.signIn}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {registerMode && (
          <label className="block text-sm font-semibold text-gray-700">
            {t.ui.fullName}
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-300 px-3 py-2.5 font-normal"
            />
          </label>
        )}
        <label className="block text-sm font-semibold text-gray-700">
          {t.ui.emailAddress}
          <input
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-300 px-3 py-2.5 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          {t.ui.password}
          <input
            required
            type="password"
            minLength={registerMode ? 12 : 1}
            maxLength={128}
            autoComplete={registerMode ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-300 px-3 py-2.5 font-normal"
          />
          {registerMode && <span className="mt-1 block text-xs font-normal text-gray-500">{t.ui.passwordMinLength}</span>}
        </label>

        {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-gradient-to-r from-forest-800 via-forest-900 to-forest-950 px-4 py-3 text-sm font-bold text-white shadow-md shadow-forest-950/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        >
          {loading ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
          <span>{loading ? t.ui.saving : registerMode ? t.ui.signUp : t.ui.signIn}</span>
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        {registerMode ? t.ui.alreadyHaveAccount : t.ui.needAccount}{' '}
        <button
          type="button"
          onClick={() => {
            setRegisterMode(!registerMode);
            setError(null);
          }}
          className="rounded-lg px-2 py-1 font-bold text-forest-800 underline decoration-forest-300 underline-offset-4 transition hover:bg-forest-50 hover:text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
        >
          {registerMode ? t.ui.signIn : t.ui.signUp}
        </button>
      </p>
      <Link to="/" className="mt-4 block text-center text-xs font-semibold text-gray-500 hover:text-forest-900">
        {t.ui.demoReadOnly}
      </Link>
    </section>
  );
};
