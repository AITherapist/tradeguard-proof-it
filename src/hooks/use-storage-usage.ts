import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

interface StorageUsage {
  total_size_bytes: number;
  evidence_size_bytes: number;
  reports_size_bytes: number;
  file_count: number;
  limit_bytes: number;
  usage_percentage: number;
  remaining_bytes: number;
  is_over_limit: boolean;
}

export const useStorageUsage = () => {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('calculate-storage-usage', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return { usage, loading, error, refetch: fetchUsage };
};
