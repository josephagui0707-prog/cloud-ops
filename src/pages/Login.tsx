import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ArrowLeft, Pencil, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkEmailExists, getLockoutState, isValidEmailFormat, verifyPassword } from '../lib/authService';
import { LoginStep } from '../types/auth';

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 text-white">
      {/* Malla de nodos de infraestructura — el motivo visual del panel */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
        viewBox="0 0 560 800"
        fill="none"
      >
        <g stroke="#2563EB" strokeWidth="1">
          <line x1="60" y1="120" x2="220" y2="220" />
          <line x1="220" y1="220" x2="420" y2="160" />
          <line x1="220" y1="220" x2="180" y2="400" />
          <line x1="180" y1="400" x2="380" y2="460" />
          <line x1="380" y1="460" x2="420" y2="160" />
          <line x1="180" y1="400" x2="90" y2="600" />
          <line x1="380" y1="460" x2="460" y2="640" />
          <line x1="90" y1="600" x2="300" y2="720" />
          <line x1="460" y1="640" x2="300" y2="720" />
        </g>
        <g fill="#2563EB">
          <circle cx="60" cy="120" r="4" />
          <circle cx="420" cy="160" r="5" />
          <circle cx="220" cy="220" r="6" className="animate-drift" style={{ transformOrigin: '220px 220px' }} />
          <circle cx="180" cy="400" r="5" />
          <circle cx="380" cy="460" r="6" className="animate-drift" style={{ transformOrigin: '380px 460px', animationDelay: '2s' }} />
          <circle cx="90" cy="600" r="4" />
          <circle cx="460" cy="640" r="5" />
          <circle cx="300" cy="720" r="6" />
        </g>
      </svg>

      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Cloud className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">CloudOps Dashboard</span>
      </div>

      <div className="relative max-w-sm">
        <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight">
          Planifica y visualiza tu infraestructura en la nube.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
          Un panel para diseñar la solución, estimar costos y revisar seguridad antes de mover una sola carga
          de trabajo a producción.
        </p>
      </div>

      <div className="relative flex items-center gap-2 text-[13px] text-slate-400">
        <ShieldCheck className="h-4 w-4 text-security" strokeWidth={2} />
        <span>Acceso protegido con verificación en dos pasos</span>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: LoginStep }) {
  return (
    <div className="mb-8 flex items-center gap-2" aria-hidden="true">
      <span className={`h-1 w-8 rounded-full transition-colors ${step === 'email' ? 'bg-primary' : 'bg-primary/40'}`} />
      <span className={`h-1 w-8 rounded-full transition-colors ${step === 'password' ? 'bg-primary' : 'bg-line'}`} />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'email') emailInputRef.current?.focus();
    else passwordInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) setLockedUntil(null);
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    if (!isValidEmailFormat(email)) {
      setEmailError('Ingresa un correo con un formato válido.');
      return;
    }

    setIsSubmitting(true);
    const { exists } = await checkEmailExists(email);
    setIsSubmitting(false);

    if (!exists) {
      setEmailError('No encontramos una cuenta con este correo.');
      return;
    }

    const lockout = getLockoutState(email);
    setLockedUntil(lockout.lockedUntil);
    setStep('password');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (lockedUntil) return;

    if (password.length === 0) {
      setPasswordError('Ingresa tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyPassword(email, password);
    setIsSubmitting(false);

    if (!result.ok || !result.user) {
      const lockout = getLockoutState(email);
      if (lockout.lockedUntil) {
        setLockedUntil(lockout.lockedUntil);
      } else {
        setPasswordError('Contraseña incorrecta. Verifica e intenta de nuevo.');
      }
      setPassword('');
      return;
    }

    login(result.user);
    navigate('/dashboard', { replace: true });
  }

  function handleChangeEmail() {
    setStep('email');
    setPassword('');
    setPasswordError(null);
    setLockedUntil(null);
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <button
        onClick={toggleTheme}
        className="fixed right-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm transition-colors hover:border-primary/40 dark:bg-slate-900 dark:text-slate-200"
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] animate-fadeUp">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Cloud className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-ink">CloudOps Dashboard</span>
          </div>

          <StepIndicator step={step} />

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} noValidate>
              <h2 className="text-[22px] font-semibold tracking-tight text-ink">Inicia sesión</h2>
              <p className="mt-1.5 text-[14px] text-ink-soft">
                Ingresa tu correo corporativo para continuar.
              </p>

              <label htmlFor="email" className="mt-7 block text-[13px] font-medium text-ink">
                Correo electrónico
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft" />
                <input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[14px] text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-900 dark:placeholder:text-slate-500 ${
                    emailError ? 'border-alert' : 'border-line'
                  }`}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-2 text-[13px] text-alert">
                  {emailError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || email.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando correo…
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="mb-5 -ml-1 flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </button>

              <h2 className="text-[22px] font-semibold tracking-tight text-ink">Ingresa tu contraseña</h2>

              <button
                type="button"
                onClick={handleChangeEmail}
                className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] text-ink transition-colors hover:border-primary/40 dark:bg-slate-900"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                  {email.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-left">{email}</span>
                <Pencil className="h-3.5 w-3.5 text-ink-soft" />
              </button>

              <label htmlFor="password" className="mt-6 block text-[13px] font-medium text-ink">
                Contraseña
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft" />
                <input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={Boolean(lockedUntil)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-[14px] text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 ${
                    passwordError ? 'border-alert' : 'border-line'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>

              {passwordError && (
                <p id="password-error" className="mt-2 text-[13px] text-alert">
                  {passwordError}
                </p>
              )}

              {lockedUntil && (
                <p className="mt-2 rounded-lg bg-alert/5 px-3 py-2 text-[13px] text-alert">
                  Demasiados intentos fallidos. Vuelve a intentar en {secondsLeft}s.
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary/30"
                  />
                  Mantener sesión iniciada
                </label>
                <button type="button" className="text-[13px] font-medium text-primary hover:text-primary-dark">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || Boolean(lockedUntil) || password.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión…
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tus credenciales se validan de forma segura antes de acceder al panel.
          </div>
        </div>
      </div>
    </div>
  );
}
