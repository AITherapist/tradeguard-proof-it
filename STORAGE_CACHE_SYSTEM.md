# Storage Usage Cache System

## Overview

The storage usage cache system has been implemented to optimize performance by avoiding expensive storage calculations on every request. The system automatically caches storage usage data and only recalculates when storage changes occur.

## Architecture

### Database Components

1. **`storage_usage` Table**: Caches calculated storage usage for each user (already exists in your app)
2. **Triggers**: Automatically invalidate cache when storage objects change
3. **Functions**: Handle cache management and retrieval

### Cache Functions

- `get_user_storage_usage(user_id)`: Returns cached data or calculates fresh data
- `refresh_storage_usage_cache(user_id)`: Forces cache refresh
- `invalidate_storage_usage_cache(user_id)`: Clears cache for a user

### Edge Functions

- `calculate-storage-usage`: Main function (now uses cache)
- `refresh-storage-cache`: Manually refresh cache
- `clear-storage-cache`: Clear cache for a user
- `cache-stats`: Get cache statistics

## How It Works

### 1. Cache-First Approach

When `calculate-storage-usage` is called:
1. Checks for cached data in `storage_usage` table
2. If cached data exists and is recent (< 5 minutes), returns cached data
3. If no cache or stale data, calculates fresh data and updates cache

### 2. Automatic Cache Invalidation

Database triggers automatically invalidate cache when:
- Files are uploaded to storage
- Files are deleted from storage
- Files are updated in storage

### 3. Cache Management

- **Cache Duration**: 5 minutes (configurable)
- **Automatic Refresh**: When storage changes occur
- **Manual Refresh**: Via `refresh-storage-cache` function
- **Manual Clear**: Via `clear-storage-cache` function

## API Endpoints

### Calculate Storage Usage (Enhanced)
```
POST /functions/v1/calculate-storage-usage
```
**Response includes:**
- `is_cached`: Boolean indicating if data was from cache
- `last_calculated_at`: Timestamp of last calculation

### Refresh Cache
```
POST /functions/v1/refresh-storage-cache
```
Forces immediate cache refresh for the authenticated user.

### Clear Cache
```
POST /functions/v1/clear-storage-cache
```
Clears cache for the authenticated user (forces fresh calculation on next request).

### Cache Statistics
```
POST /functions/v1/cache-stats
```
Returns cache statistics including:
- Cache status
- Last calculated timestamp
- Cache age in minutes
- Storage usage data

## Performance Benefits

1. **Reduced Database Load**: Expensive storage calculations only run when needed
2. **Faster Response Times**: Cached data returns instantly
3. **Automatic Invalidation**: Cache stays fresh without manual intervention
4. **Smart Refresh**: Only recalculates when storage actually changes

## Cache Lifecycle

```
User Request → Check Cache → Return Cached Data (if fresh)
                ↓
            If Stale/Missing → Calculate Fresh Data → Update Cache → Return Data
```

## Monitoring

Use the `cache-stats` endpoint to monitor:
- Cache hit rates
- Cache age
- Storage usage patterns
- Performance metrics

## Configuration

### Cache Duration
Modify the cache duration in the `get_user_storage_usage` function:
```sql
-- Change from 5 minutes to desired duration
cached_data.last_calculated_at > (now() - interval '5 minutes')
```

### Cache Size Limits
The system automatically manages cache size by:
- One record per user (unique constraint)
- Automatic cleanup on user deletion
- Efficient indexing for fast lookups

## Troubleshooting

### Cache Not Updating
1. Check if triggers are active on `storage.objects`
2. Verify `handle_storage_change()` function is working
3. Use `refresh-storage-cache` to force update

### Performance Issues
1. Check cache hit rates via `cache-stats`
2. Monitor database query performance
3. Consider adjusting cache duration

### Data Inconsistency
1. Clear cache using `clear-storage-cache`
2. Verify storage triggers are working
3. Check for manual storage changes outside the app

## Migration

The cache system is set up via the migration file:
`supabase/migrations/20250103000001_add_storage_usage_cache.sql`

This migration:
1. Ensures the existing `storage_usage` table has required columns
2. Sets up RLS policies
3. Creates cache management functions
4. Installs storage change triggers
5. Creates the main cache retrieval function

**Note**: Your app already has the `storage_usage` table, so the migration will only add the missing cache functionality without affecting existing data.

## Best Practices

1. **Monitor Cache Performance**: Use `cache-stats` regularly
2. **Handle Cache Misses**: App should gracefully handle fresh calculations
3. **Cache Invalidation**: Trust the automatic system, use manual refresh sparingly
4. **Error Handling**: Cache failures should fall back to direct calculation
5. **Testing**: Test both cached and non-cached scenarios

## Future Enhancements

1. **Distributed Caching**: Redis integration for multi-instance deployments
2. **Cache Warming**: Pre-calculate cache for active users
3. **Analytics**: Detailed cache performance metrics
4. **Compression**: Compress cached data for storage efficiency
5. **TTL Management**: More sophisticated cache expiration strategies
