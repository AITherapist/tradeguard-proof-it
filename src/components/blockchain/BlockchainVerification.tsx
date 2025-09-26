import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Clock as Timestamp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Hash,
  Loader2
} from 'lucide-react';
import React from 'react';
import { useToast as useToastHook } from '@/hooks/use-toast';

interface BlockchainVerificationProps {
  evidenceId: string;
  fileHash?: string;
  currentTimestamp?: string;
  onVerificationComplete?: (timestamp: string) => void;
}

export function BlockchainVerification({ 
  evidenceId, 
  fileHash, 
  currentTimestamp,
  onVerificationComplete 
}: BlockchainVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'processing' | 'verified' | 'error'>('pending');
  const [timestampHash, setTimestampHash] = useState(currentTimestamp || '');
  const { toast } = useToast();

  const createTimestamp = async () => {
    if (!fileHash) {
      toast({
        title: 'Error',
        description: 'File hash is required for blockchain verification',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setVerificationStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('create-timestamp', {
        body: { 
          evidence_id: evidenceId,
          file_hash: fileHash
        }
      });

      if (error) throw error;

      const { timestamp } = data;
      setTimestampHash(timestamp);
      setVerificationStatus('verified');
      
      toast({
        title: 'Blockchain Verification Complete',
        description: 'Evidence has been timestamped on the Bitcoin blockchain',
      });

      onVerificationComplete?.(timestamp);

    } catch (error) {
      console.error('Error creating timestamp:', error);
      setVerificationStatus('error');
      toast({
        title: 'Verification Failed',
        description: 'Failed to create blockchain timestamp',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyTimestamp = async () => {
    if (!timestampHash) return;

    try {
      // Open OpenTimestamps verification in new tab
      const verifyUrl = `https://opentimestamps.org/verify?hash=${fileHash}&timestamp=${timestampHash}`;
      window.open(verifyUrl, '_blank');
      
      toast({
        title: 'Verification Link Opened',
        description: 'You can verify the timestamp on the OpenTimestamps website',
      });
    } catch (error) {
      console.error('Error opening verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to open verification link',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Verified on Blockchain';
      case 'processing':
        return 'Creating Timestamp...';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Not Verified';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'processing':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'error':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-muted-foreground border-muted bg-muted/50';
    }
  };

  React.useEffect(() => {
    if (currentTimestamp) {
      setTimestampHash(currentTimestamp);
      setVerificationStatus('verified');
    }
  }, [currentTimestamp]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          
          {verificationStatus === 'verified' && timestampHash && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Timestamp Hash:</span>
                <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                  {timestampHash}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={verifyTimestamp}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify on OpenTimestamps
              </Button>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="space-y-3">
              <p className="text-sm">
                Blockchain verification provides immutable proof that this evidence existed at a specific time. 
                This creates a tamper-evident record that can be used in legal proceedings.
              </p>
              
              {fileHash && (
                <div className="text-sm">
                  <span className="font-medium">File Hash:</span>
                  <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                    {fileHash}
                  </div>
                </div>
              )}

              <Button 
                onClick={createTimestamp}
                disabled={isSubmitting || !fileHash}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Timestamp...
                  </>
                ) : (
                  <>
                    <Timestamp className="h-4 w-4 mr-2" />
                    Create Blockchain Timestamp
                  </>
                )}
              </Button>
            </div>
          )}

          {verificationStatus === 'processing' && (
            <div className="space-y-2">
              <p className="text-sm">
                Submitting evidence hash to the Bitcoin blockchain via OpenTimestamps. 
                This process may take a few minutes.
              </p>
              <div className="text-xs text-muted-foreground">
                The timestamp will be committed to the next Bitcoin block.
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-3">
              <p className="text-sm">
                Failed to create blockchain timestamp. This may be due to network issues or service availability.
              </p>
              <Button 
                variant="outline" 
                onClick={createTimestamp}
                disabled={isSubmitting}
                className="w-full"
              >
                <Timestamp className="h-4 w-4 mr-2" />
                Retry Verification
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Information Section */}
        <div className="space-y-4">
          <h4 className="font-medium">About Blockchain Verification</h4>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Cryptographic Proof</p>
                <p>Uses SHA-256 hashing to create a unique fingerprint of your evidence file</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Immutable Record</p>
                <p>Timestamps are permanently recorded on the Bitcoin blockchain</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Legal Validity</p>
                <p>Provides court-admissible proof of evidence existence and timing</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Blockchain verification is free and uses the OpenTimestamps protocol. 
              The timestamp will be included in the next Bitcoin block, which may take 10-60 minutes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}