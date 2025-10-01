import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, RefreshCw } from 'lucide-react';
import { useStorageUsage } from '../../hooks/use-storage-usage';
import { StorageUsageCard } from './StorageUsageCard';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

export const StorageManagement: React.FC = () => {
  const { usage, loading, error, refetch } = useStorageUsage();
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get old evidence items (older than 30 days) for cleanup
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: oldEvidence, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('id, file_path, created_at')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(10); // Clean up 10 oldest files at a time

      if (evidenceError) throw evidenceError;

      if (!oldEvidence || oldEvidence.length === 0) {
        toast({
          title: 'No cleanup needed',
          description: 'No old files found for cleanup.',
        });
        return;
      }

      const filePaths = oldEvidence.map(item => item.file_path).filter(Boolean);
      const evidenceIds = oldEvidence.map(item => item.id);

      if (filePaths.length === 0) {
        toast({
          title: 'No cleanup needed',
          description: 'No files found for cleanup.',
        });
        return;
      }

      // Call cleanup function
      const { data, error } = await supabase.functions.invoke('cleanup-storage', {
        body: { filePaths, evidenceIds },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Cleanup completed',
        description: `Successfully cleaned up ${filePaths.length} old files.`,
      });

      // Refresh storage usage
      await refetch();
    } catch (err) {
      console.error('Cleanup failed:', err);
      toast({
        title: 'Cleanup failed',
        description: err instanceof Error ? err.message : 'Failed to cleanup storage',
        variant: 'destructive',
      });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading storage usage...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load storage usage: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!usage) return null;

  return (
    <div className="space-y-6">
      <StorageUsageCard usage={usage} />
      
      {usage.is_over_limit && (
        <Alert variant="destructive">
          <AlertDescription>
            You have exceeded your storage limit. Please delete some files to continue uploading.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Storage Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={refetch} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Usage
            </Button>
            <Button 
              onClick={handleCleanup} 
              variant="outline" 
              size="sm"
              disabled={cleaning}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleaning ? 'Cleaning...' : 'Clean Up Storage'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
