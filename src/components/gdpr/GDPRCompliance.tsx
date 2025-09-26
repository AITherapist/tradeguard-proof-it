import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Download, 
  Eye, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Database,
  Trash2
} from 'lucide-react';

interface GDPRComplianceProps {
  userId?: string;
}

interface DataCategory {
  name: string;
  description: string;
  dataTypes: string[];
  retention: string;
  lawfulBasis: string;
}

interface DataRequest {
  id: string;
  type: 'access' | 'portability' | 'deletion' | 'rectification';
  status: 'pending' | 'processing' | 'completed';
  requestDate: string;
  completionDate?: string;
  description: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    name: 'Account Information',
    description: 'Basic user account data and authentication information',
    dataTypes: ['Email address', 'Name', 'Phone number', 'Company details', 'Authentication tokens'],
    retention: '3 years after account closure',
    lawfulBasis: 'Contract performance and legitimate interest'
  },
  {
    name: 'Job Data',
    description: 'Information about construction jobs and client details',
    dataTypes: ['Client names and contacts', 'Job locations', 'Contract values', 'Job descriptions'],
    retention: '7 years for legal compliance',
    lawfulBasis: 'Contract performance and legal obligation'
  },
  {
    name: 'Evidence Files',
    description: 'Photos, videos, and documentation captured for jobs',
    dataTypes: ['Images and videos', 'GPS coordinates', 'Timestamps', 'File metadata'],
    retention: '7 years for legal compliance',
    lawfulBasis: 'Contract performance and legitimate interest'
  },
  {
    name: 'Audit Logs',
    description: 'System access and activity logging for security',
    dataTypes: ['Login times', 'IP addresses', 'User actions', 'System events'],
    retention: '2 years for security purposes',
    lawfulBasis: 'Legitimate interest (security and fraud prevention)'
  },
  {
    name: 'Payment Information',
    description: 'Subscription and payment processing data',
    dataTypes: ['Stripe customer ID', 'Subscription status', 'Payment history'],
    retention: '7 years for tax compliance',
    lawfulBasis: 'Contract performance and legal obligation'
  }
];

export function GDPRCompliance({ userId }: GDPRComplianceProps) {
  const [activeRequests, setActiveRequests] = useState<DataRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<'access' | 'portability' | 'deletion' | 'rectification' | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load any existing data requests
    loadDataRequests();
  }, []);

  const loadDataRequests = () => {
    // In a real implementation, this would fetch from your backend
    const mockRequests: DataRequest[] = [
      {
        id: '1',
        type: 'access',
        status: 'completed',
        requestDate: '2024-01-15',
        completionDate: '2024-01-20',
        description: 'Request for personal data export'
      }
    ];
    setActiveRequests(mockRequests);
  };

  const submitDataRequest = async (type: 'access' | 'portability' | 'deletion' | 'rectification') => {
    setIsSubmitting(true);

    try {
      // In a real implementation, this would submit to your backend
      const newRequest: DataRequest = {
        id: Date.now().toString(),
        type,
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0],
        description: requestReason || getDefaultDescription(type)
      };

      setActiveRequests(prev => [...prev, newRequest]);
      setSelectedRequest(null);
      setRequestReason('');

      toast({
        title: 'Request Submitted',
        description: `Your ${getRequestTypeName(type)} request has been submitted and will be processed within 30 days.`,
      });

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit data request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'access': return 'data access';
      case 'portability': return 'data portability';
      case 'deletion': return 'data deletion';
      case 'rectification': return 'data rectification';
      default: return 'data';
    }
  };

  const getDefaultDescription = (type: string) => {
    switch (type) {
      case 'access': return 'Request to access all personal data held by the system';
      case 'portability': return 'Request to export personal data in a portable format';
      case 'deletion': return 'Request to delete all personal data (right to be forgotten)';
      case 'rectification': return 'Request to correct or update personal data';
      default: return '';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="h-4 w-4" />;
      case 'portability': return <Download className="h-4 w-4" />;
      case 'deletion': return <Trash2 className="h-4 w-4" />;
      case 'rectification': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GDPR Data Protection</h2>
          <p className="text-muted-foreground">
            Manage your personal data and privacy rights
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          GDPR Compliant
        </Badge>
      </div>

      {/* Your Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Data Protection Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setSelectedRequest('access')}>
                  <Eye className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Right of Access</div>
                    <div className="text-xs text-muted-foreground">View your data</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Data Access</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have the right to obtain confirmation that your personal data is being processed and access to that data.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for request (optional)</Label>
                    <Textarea
                      id="reason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please specify why you need access to your data..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => submitDataRequest('access')} disabled={isSubmitting}>
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setSelectedRequest('portability')}>
                  <Download className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Data Portability</div>
                    <div className="text-xs text-muted-foreground">Export your data</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Data Export</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have the right to receive your personal data in a structured, commonly used format.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="portability-reason">Reason for request (optional)</Label>
                    <Textarea
                      id="portability-reason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please specify why you need to export your data..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => submitDataRequest('portability')} disabled={isSubmitting}>
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setSelectedRequest('rectification')}>
                  <FileText className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Right to Rectification</div>
                    <div className="text-xs text-muted-foreground">Correct your data</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Data Correction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have the right to have inaccurate personal data corrected or completed.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="rectification-reason">What needs to be corrected?</Label>
                    <Textarea
                      id="rectification-reason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please describe what data needs to be corrected and provide the correct information..."
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => submitDataRequest('rectification')} 
                      disabled={isSubmitting || !requestReason.trim()}
                    >
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setSelectedRequest('deletion')}>
                  <Trash2 className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Right to Erasure</div>
                    <div className="text-xs text-muted-foreground">Delete your data</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Data Deletion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Warning</span>
                    </div>
                    <p className="text-sm text-red-700">
                      This will permanently delete all your data including jobs, evidence, and account information. This action cannot be undone.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have the right to have your personal data erased in certain circumstances.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="deletion-reason">Reason for deletion request</Label>
                    <Textarea
                      id="deletion-reason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please explain why you want your data deleted..."
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={() => submitDataRequest('deletion')} 
                      disabled={isSubmitting || !requestReason.trim()}
                    >
                      Submit Deletion Request
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Data We Collect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data We Collect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DATA_CATEGORIES.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{category.name}</h4>
                  <Badge variant="outline">{category.retention}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Data Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {category.dataTypes.map((type, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Lawful Basis:</span> {category.lawfulBasis}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Data Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRequestIcon(request.type)}
                    <div>
                      <div className="font-medium">{getRequestTypeName(request.type).charAt(0).toUpperCase() + getRequestTypeName(request.type).slice(1)} Request</div>
                      <div className="text-sm text-muted-foreground">
                        Submitted: {request.requestDate}
                        {request.completionDate && ` • Completed: ${request.completionDate}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <Badge variant={request.status === 'completed' ? 'default' : 'outline'}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Data Protection Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you have any questions about your data protection rights or how we process your personal data, please contact our Data Protection Officer:
          </p>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1 text-sm">
              <div><strong>Email:</strong> dpo@tradeguard.com</div>
              <div><strong>Address:</strong> TradeGuard Ltd, Data Protection Office, [Your Address]</div>
              <div><strong>Response Time:</strong> We will respond to your request within 30 days</div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been breached.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}