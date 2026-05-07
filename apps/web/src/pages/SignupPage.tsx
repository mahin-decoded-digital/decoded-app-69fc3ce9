import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import type { User } from '@/types';

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
    <div className="flex h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between overflow-hidden">
        <img
          src="https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Premium Auckland residential property at dusk"
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ink-deep)]/80 to-primary/50" />
        <div className="relative z-10 p-10">
          <img
            src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
            alt="Martelli Buyers"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="relative z-10 p-10">
          <blockquote className="text-primary-foreground">
            <p className="text-2xl font-semibold leading-snug mb-4">
              "Centralised, connected, and always ahead of the market."
            </p>
            <footer className="text-sm text-primary-foreground/70">
              Martelli Connect — Private Client Platform
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-card overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo (mobile only) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
              alt="Martelli Buyers"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Join Martelli Connect to manage your engagements.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
