import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(hsl(210 85% 80% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(210 85% 80% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 space-y-5 max-w-md">
        <p
          className="text-8xl font-black"
          style={{ color: 'hsl(210 85% 62%)', textShadow: '0 0 60px hsl(210 85% 62% / 0.4)' }}
        >
          404
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 100%)' }}>
          This page doesn't exist
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(210 60% 75%)' }}>
          The page you're looking for may have been moved, deleted, or never existed.
          Let's get you back on track.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-gradient inline-flex items-center rounded-xl px-8 py-3 text-sm font-semibold mt-2"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}