import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Eye, EyeOff, Users, Lock, Star } from 'lucide-react';
import type { User } from '@/types';

const PERKS = [
  { icon: Users, label: 'Manage all client engagements in one place' },
  { icon: Star, label: 'Access 900+ off-market property leads' },
  { icon: Lock, label: 'Secure, audit-ready compliance workflows' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('agent');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'This field is required.';
    if (!email.trim()) errs.email = 'This field is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'This field is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = register(email.trim(), password, name.trim(), role);
    setLoading(false);
    if (!result.ok) {
      setErrors({ email: result.error === 'Email already registered' ? 'An account with this email already exists.' : result.error });
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
        <img
          src="https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Premium Auckland residential property"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          crossOrigin="anonymous"
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(hsl(210 85% 80% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(210 85% 80% / 0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 p-10">
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Buyers"
            className="h-12 w-auto object-contain brightness-0 invert"
          />
        </div>

        <div className="relative z-10 p-10 space-y-8">
          <div>
            <p className="text-2xl font-bold leading-snug mb-3" style={{ color: 'hsl(0 0% 100%)' }}>
              "Centralised, connected, and always ahead of the market."
            </p>
            <p className="text-sm" style={{ color: 'hsl(210 60% 75%)' }}>
              Martelli Connect · Private Client Platform
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, label }) => (
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

        <div className="relative z-10 h-1 accent-strip" />
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: 'var(--surface-subtle)' }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
              alt="Martelli Buyers"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div
            className="rounded-2xl border p-8 shadow-[var(--shadow-elevated)]"
            style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(214 60% 88%)' }}
          >
            <div className="accent-strip -mx-8 -mt-8 mb-7 rounded-t-2xl" style={{ height: '4px' }} />

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground">Join Martelli Connect to manage your engagements.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Martelli"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@martellibuyers.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
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

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as User['role'])}
                >
                  <option value="agent">Agent</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 mt-2"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-[var(--blue-deep)] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}