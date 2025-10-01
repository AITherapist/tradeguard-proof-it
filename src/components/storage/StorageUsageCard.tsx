import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { AlertTriangle, HardDrive, FileText, BarChart3 } from 'lucide-react';

interface StorageUsageCardProps {
  usage: {
    total_size_bytes: number;
    evidence_size_bytes: number;
    reports_size_bytes: number;
    file_count: number;
    limit_bytes: number;
    usage_percentage: number;
    remaining_bytes: number;
    is_over_limit: boolean;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StorageUsageCard: React.FC<StorageUsageCardProps> = ({ usage }) => {
  const getProgressColor = () => {
    if (usage.is_over_limit) return 'bg-red-500';
    if (usage.usage_percentage > 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Usage
          {usage.is_over_limit && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Over Limit
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {formatBytes(usage.total_size_bytes)}</span>
            <span>Limit: {formatBytes(usage.limit_bytes)}</span>
          </div>
          <Progress 
            value={Math.min(usage.usage_percentage, 100)} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {usage.usage_percentage.toFixed(1)}% used
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">Evidence</div>
              <div className="text-muted-foreground">
                {formatBytes(usage.evidence_size_bytes)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">Reports</div>
              <div className="text-muted-foreground">
                {formatBytes(usage.reports_size_bytes)}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {usage.file_count} files total
        </div>
      </CardContent>
    </Card>
  );
};
