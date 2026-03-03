import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to admin login after a delay
    const timer = setTimeout(() => {
      navigate('/admin/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <div className="relative text-center space-y-8 px-4 animate-slide-up">
        <div className="mx-auto flex h-24 w-full max-w-md items-center justify-center rounded-xl border border-border bg-card px-4 shadow-glow">
          <img src="/PSS.png" alt="PSS" className="h-full w-full object-contain" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Perfect Security Solution</h1>
          <p className="text-xl text-muted-foreground">Admin Panel</p>
        </div>

        <p className="text-muted-foreground">
          Redirecting to admin login...
        </p>

        <Button 
          onClick={() => navigate('/admin/login')} 
          size="lg" 
          className="gap-2"
        >
          Go to Login
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
