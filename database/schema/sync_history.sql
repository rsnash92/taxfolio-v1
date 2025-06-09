-- Sync History Schema
-- Tracks all synchronization attempts and results for exchanges and wallets

CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection Reference
    connection_id UUID NOT NULL, -- References either exchange_connections.id or wallet_connections.id
    connection_type VARCHAR(20) NOT NULL, -- 'exchange' or 'wallet'
    connection_name VARCHAR(100) NOT NULL, -- Name of the exchange/wallet for easy identification
    
    -- Sync Details
    sync_type VARCHAR(30) NOT NULL, -- 'scheduled', 'manual', 'retry', 'initial', 'partial'
    sync_trigger VARCHAR(50), -- 'user_request', 'cron_job', 'webhook', 'error_retry', 'new_connection'
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER, -- Calculated field: completed_at - started_at in milliseconds
    
    -- Status and Results
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled', 'timeout'
    
    -- Transaction Processing
    transactions_found INTEGER DEFAULT 0, -- Total transactions discovered during sync
    transactions_new INTEGER DEFAULT 0, -- New transactions added to database
    transactions_updated INTEGER DEFAULT 0, -- Existing transactions that were updated
    transactions_skipped INTEGER DEFAULT 0, -- Transactions that were skipped (duplicates, etc.)
    
    -- Data Range
    sync_from_date TIMESTAMP WITH TIME ZONE, -- Start date for this sync
    sync_to_date TIMESTAMP WITH TIME ZONE, -- End date for this sync
    last_block_number BIGINT, -- For blockchain syncs, the last block processed
    next_cursor TEXT, -- Pagination cursor for next sync (exchange-specific)
    
    -- Error Handling
    error_message TEXT, -- Human-readable error message
    error_code VARCHAR(50), -- Application-specific error code
    error_details JSONB, -- Detailed error information (stack trace, API response, etc.)
    retry_count INTEGER DEFAULT 0, -- Number of times this sync has been retried
    max_retries INTEGER DEFAULT 3, -- Maximum retries allowed for this sync
    
    -- Performance Metrics
    api_calls_made INTEGER DEFAULT 0, -- Number of API calls made during sync
    api_rate_limited_count INTEGER DEFAULT 0, -- Number of times we hit rate limits
    data_transferred_bytes BIGINT DEFAULT 0, -- Amount of data transferred
    
    -- Sync Strategy
    sync_strategy VARCHAR(30) DEFAULT 'incremental', -- 'full', 'incremental', 'backfill'
    batch_size INTEGER DEFAULT 100, -- Number of records processed per batch
    parallel_workers INTEGER DEFAULT 1, -- Number of parallel sync workers used
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit Information
    sync_version VARCHAR(20), -- Version of sync logic used
    user_agent VARCHAR(200), -- User agent or system that initiated sync
    ip_address INET, -- IP address where sync was initiated from
    
    -- Additional Data
    sync_metadata JSONB DEFAULT '{}', -- Additional sync-specific data
    warnings TEXT[], -- Non-fatal warnings during sync
    
    -- Constraints
    CONSTRAINT valid_connection_type CHECK (connection_type IN ('exchange', 'wallet')),
    CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'timeout')),
    CONSTRAINT valid_sync_type CHECK (sync_type IN ('scheduled', 'manual', 'retry', 'initial', 'partial', 'backfill')),
    CONSTRAINT valid_dates CHECK (
        (sync_from_date IS NULL AND sync_to_date IS NULL) OR 
        (sync_from_date IS NOT NULL AND sync_to_date IS NOT NULL AND sync_from_date <= sync_to_date)
    ),
    CONSTRAINT valid_duration CHECK (
        (completed_at IS NULL AND duration_ms IS NULL) OR
        (completed_at IS NOT NULL AND duration_ms >= 0)
    )
);

-- Indexes for performance
CREATE INDEX idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_history_connection ON sync_history(connection_id, connection_type);
CREATE INDEX idx_sync_history_status ON sync_history(status);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at DESC);
CREATE INDEX idx_sync_history_user_started ON sync_history(user_id, started_at DESC);
CREATE INDEX idx_sync_history_connection_started ON sync_history(connection_id, started_at DESC);
CREATE INDEX idx_sync_history_running ON sync_history(status) WHERE status = 'running';
CREATE INDEX idx_sync_history_failed ON sync_history(status, retry_count) WHERE status = 'failed';

-- Composite indexes for common queries
CREATE INDEX idx_sync_history_user_connection_date ON sync_history(user_id, connection_id, started_at DESC);
CREATE INDEX idx_sync_history_type_status_date ON sync_history(connection_type, status, started_at DESC);

-- Trigger to automatically calculate duration and update timestamps
CREATE OR REPLACE FUNCTION update_sync_history_calculated_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Calculate duration if completed_at is set
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_history_calculated_fields_trigger
    BEFORE UPDATE ON sync_history
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_history_calculated_fields();

-- Function to clean up old sync history (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_sync_history(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_history 
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for recent sync activity
CREATE OR REPLACE VIEW recent_sync_activity AS
SELECT 
    sh.id,
    sh.user_id,
    sh.connection_name,
    sh.connection_type,
    sh.sync_type,
    sh.status,
    sh.started_at,
    sh.completed_at,
    sh.duration_ms,
    sh.transactions_new,
    sh.transactions_updated,
    sh.error_message,
    CASE 
        WHEN sh.status = 'running' THEN 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sh.started_at)) * 1000
        ELSE sh.duration_ms 
    END as current_duration_ms
FROM sync_history sh
WHERE sh.started_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY sh.started_at DESC;

-- View for sync statistics by connection
CREATE OR REPLACE VIEW sync_stats_by_connection AS
SELECT 
    connection_id,
    connection_type,
    connection_name,
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
    COUNT(*) FILTER (WHERE status = 'running') as running_syncs,
    AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
    SUM(transactions_new) as total_new_transactions,
    SUM(transactions_updated) as total_updated_transactions,
    MAX(started_at) as last_sync_at,
    MAX(started_at) FILTER (WHERE status = 'completed') as last_successful_sync_at
FROM sync_history
GROUP BY connection_id, connection_type, connection_name;

-- Comments for documentation
COMMENT ON TABLE sync_history IS 'Comprehensive log of all synchronization attempts for exchanges and wallets';
COMMENT ON COLUMN sync_history.connection_id IS 'References exchange_connections.id or wallet_connections.id';
COMMENT ON COLUMN sync_history.sync_type IS 'Type of sync: scheduled, manual, retry, initial, partial, backfill';
COMMENT ON COLUMN sync_history.duration_ms IS 'Sync duration in milliseconds, calculated automatically';
COMMENT ON COLUMN sync_history.next_cursor IS 'Pagination cursor for continuing sync from where it left off';
COMMENT ON COLUMN sync_history.sync_metadata IS 'Additional sync-specific data in JSON format';
COMMENT ON VIEW recent_sync_activity IS 'Shows sync activity from the last 7 days with current duration for running syncs';
COMMENT ON VIEW sync_stats_by_connection IS 'Aggregated sync statistics grouped by connection';