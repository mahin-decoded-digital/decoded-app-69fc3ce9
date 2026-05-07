import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-subtle)] px-6 text-center">
      <div className="mb-6">
        <img
          src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/martelli-buyers-pngtransparent-db7c1049.png"
          alt="Martelli Buyers"
          className="h-12 w-auto object-contain mx-auto mb-8 opacity-60"
        />
        <p className="text-7xl font-bold text-primary/20 mb-4 font-[var(--font-display)]">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-3">This page has left the building</h1>
        <p className="text-muted-foreground max-w-sm">
          The page you're looking for doesn't exist or has moved. Let's get you back to familiar territory.
        </p>
      </div>
      <Button onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </div>
  );
}
