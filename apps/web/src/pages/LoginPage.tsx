import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, Zap, Building2 } from 'lucide-react';

const FEATURES = [
  { icon: Building2, label: '900+ off-market properties' },
  { icon: Zap, label: 'Geo-targeted agent blasts' },
  { icon: Shield, label: 'Audit-ready compliance tools' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'This field is required.';
    if (!password) errs.password = 'This field is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setErrors({ password: 'Invalid email or password.' });
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden"
        style={{ background: 'var(--gradient-hero)' }}
      >
        {/* Background photo */}
        <img
          src="https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Premium Auckland residential property at dusk"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          crossOrigin="anonymous"
        />

        {/* Overlay grid lines for depth */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(hsl(210 85% 80% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(210 85% 80% / 0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-10">
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Buyers"
            className="h-12 w-auto object-contain brightness-0 invert"
          />
        </div>

        <div className="relative z-10 p-10 space-y-8">
          <div>
            <blockquote>
              <p className="text-2xl font-bold leading-snug mb-3" style={{ color: 'hsl(0 0% 100%)' }}>
                "The most trusted buyer's agency in Auckland — now fully connected."
              </p>
              <footer className="text-sm" style={{ color: 'hsl(210 60% 75%)' }}>
                Martelli Connect · Private Client Platform
              </footer>
            </blockquote>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(0 0% 100% / 0.15)' }}
                >
                  <Icon size={16} style={{ color: 'hsl(205 90% 80%)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'hsl(210 60% 85%)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent strip */}
        <div className="relative z-10 h-1 accent-strip" />
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: 'var(--surface-subtle)' }}
      >
        <div className="w-full max-w-sm">
          {/* Logo (mobile) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
              alt="Martelli Buyers"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl border p-8 shadow-[var(--shadow-elevated)]"
            style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(214 60% 88%)' }}
          >
            {/* Top blue bar */}
            <div className="accent-strip -mx-8 -mt-8 mb-7 rounded-t-2xl" style={{ height: '4px' }} />

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your Martelli Connect workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@martellibuyers.com"
                  className={errors.email ? 'border-destructive focus:ring-destructive' : ''}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in to Martelli Connect'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:text-[var(--blue-deep)] transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}