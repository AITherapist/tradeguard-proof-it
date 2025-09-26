import { Button } from '@/components/ui/button';
import { Shield, FileCheck, Lock, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Shield className="h-12 w-12 text-primary" />
            <span className="text-4xl font-bold text-primary">BLUHATCH</span>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Professional Trade Dispute Protection
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Capture legally admissible evidence, generate court-ready reports, and protect yourself from payment disputes. 
            Built exclusively for tradespeople who value professional documentation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6">
              <Link to="/auth">Start 7-Day Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mobile Evidence Capture</h3>
              <p className="text-muted-foreground">High-resolution photos with GPS coordinates and timestamps</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-accent/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Lock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Blockchain Security</h3>
              <p className="text-muted-foreground">Cryptographically secured with Bitcoin blockchain timestamps</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-warning/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileCheck className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Legal Reports</h3>
              <p className="text-muted-foreground">Court-admissible reports for insurance claims and disputes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
