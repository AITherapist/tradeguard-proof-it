import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, MapPin, Calendar, Shield, Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

interface EvidenceItem {
  id: string;
  evidence_type: 'before' | 'progress' | 'after' | 'approval' | 'defect' | 'contract' | 'receipt';
  description: string;
  file_path: string | null;
  file_hash: string | null;
  blockchain_timestamp: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  client_approval: boolean | null;
  client_signature: string | null;
  device_timestamp: string | null;
  server_timestamp: string;
  created_at: string;
}

interface EvidenceGalleryProps {
  jobId: string;
}

export function EvidenceGallery({ jobId }: EvidenceGalleryProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvidence();
  }, [jobId]);

  useEffect(() => {
    filterEvidence();
  }, [evidence, searchTerm, typeFilter]);

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch evidence items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvidence = () => {
    let filtered = evidence;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.evidence_type === typeFilter);
    }

    setFilteredEvidence(filtered);
  };

  const getEvidenceTypeColor = (type: string) => {
    switch (type) {
      case 'before': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'progress': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'after': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'approval': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getImageUrl = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('evidence')
        .createSignedUrl(filePath, 3600);
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  };

  const downloadEvidence = async (item: EvidenceItem) => {
    if (!item.file_path) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .download(item.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${item.evidence_type}-${format(new Date(item.created_at), 'yyyy-MM-dd-HHmm')}.${item.file_path.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Evidence downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading evidence:', error);
      toast({
        title: 'Error',
        description: 'Failed to download evidence',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading evidence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search evidence descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="before">Before</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="after">After</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="defect">Defect</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>
      </div>

      {/* Evidence Grid */}
      {filteredEvidence.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evidence Found</h3>
            <p className="text-muted-foreground text-center">
              {evidence.length === 0 
                ? "No evidence has been captured for this job yet."
                : "No evidence matches your current search criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Evidence Type Badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={getEvidenceTypeColor(item.evidence_type)}>
                      {item.evidence_type.charAt(0).toUpperCase() + item.evidence_type.slice(1)}
                    </Badge>
                    {item.blockchain_timestamp && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* File Preview */}
                  {item.file_path && (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <EvidencePreview filePath={item.file_path} />
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm line-clamp-2">{item.description}</p>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                    {item.gps_latitude && item.gps_longitude && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS Recorded (±{item.gps_accuracy?.toFixed(0)}m)
                      </div>
                    )}
                    {item.client_approval && (
                      <div className="flex items-center text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Client Approved
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Evidence Details</DialogTitle>
                        </DialogHeader>
                        <EvidenceDetailView evidence={item} />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadEvidence(item)}
                      disabled={!item.file_path}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Evidence Preview Component
function EvidencePreview({ filePath }: { filePath: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { data } = await supabase.storage
          .from('evidence')
          .createSignedUrl(filePath, 3600);
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [filePath]);

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  if (!imageUrl) {
    return <div className="text-muted-foreground">No preview available</div>;
  }

  return (
    <img 
      src={imageUrl} 
      alt="Evidence preview"
      className="w-full h-full object-cover rounded-lg"
    />
  );
}

// Evidence Detail View Component
function EvidenceDetailView({ evidence }: { evidence: EvidenceItem }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!evidence.file_path) return;
      
      try {
        const { data } = await supabase.storage
          .from('evidence')
          .createSignedUrl(evidence.file_path, 3600);
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };

    loadImage();
  }, [evidence.file_path]);

  return (
    <div className="space-y-6">
      {/* Image */}
      {imageUrl && (
        <div className="w-full">
          <img 
            src={imageUrl} 
            alt="Evidence"
            className="w-full rounded-lg border"
          />
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Badge className={`ml-2 ${getEvidenceTypeColor(evidence.evidence_type)}`}>
              {evidence.evidence_type.charAt(0).toUpperCase() + evidence.evidence_type.slice(1)}
            </Badge>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <p className="text-sm">{evidence.description}</p>
          </div>

          {evidence.client_signature && (
            <div>
              <label className="text-sm font-medium block mb-1">Client Signature</label>
              <p className="text-sm">{evidence.client_signature}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Captured</label>
            <p className="text-sm">{format(new Date(evidence.created_at), 'PPpp')}</p>
          </div>

          {evidence.gps_latitude && evidence.gps_longitude && (
            <div>
              <label className="text-sm font-medium block mb-1">GPS Location</label>
              <p className="text-sm">
                {evidence.gps_latitude.toFixed(6)}, {evidence.gps_longitude.toFixed(6)}
                <br />
                <span className="text-muted-foreground">
                  Accuracy: ±{evidence.gps_accuracy?.toFixed(0)}m
                </span>
              </p>
            </div>
          )}

          {evidence.blockchain_timestamp && (
            <div>
              <label className="text-sm font-medium block mb-1">Blockchain Verified</label>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                Timestamp: {evidence.blockchain_timestamp.substring(0, 16)}...
              </Badge>
            </div>
          )}

          {evidence.file_hash && (
            <div>
              <label className="text-sm font-medium block mb-1">File Hash</label>
              <p className="text-xs font-mono break-all">{evidence.file_hash}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEvidenceTypeColor(type: string) {
  switch (type) {
    case 'before': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'progress': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'after': return 'bg-green-500/10 text-green-700 border-green-200';
    case 'approval': return 'bg-purple-500/10 text-purple-700 border-purple-200';
    case 'client_approval': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
}