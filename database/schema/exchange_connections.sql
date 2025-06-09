-- Exchange Connections Schema
-- Stores exchange API connections and configurations

CREATE TABLE IF NOT EXISTS exchange_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection Details
    exchange_name VARCHAR(50) NOT NULL, -- 'coinbase', 'binance', 'kraken', etc.
    connection_name VARCHAR(100), -- User-defined name for the connection
    connection_type VARCHAR(20) NOT NULL DEFAULT 'exchange', -- 'exchange', 'defi', 'cefi'
    
    -- API Credentials (encrypted)
    api_key_encrypted TEXT, -- Encrypted API key
    api_secret_encrypted TEXT, -- Encrypted API secret
    api_passphrase_encrypted TEXT, -- For exchanges that require passphrase (e.g., Coinbase Pro)
    
    -- Connection Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error', 'syncing'
    is_read_only BOOLEAN DEFAULT true, -- Whether this connection has read-only permissions
    
    -- Sync Configuration
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_hours INTEGER DEFAULT 24, -- How often to auto-sync
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_successful_sync_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync Statistics
    total_transactions_synced INTEGER DEFAULT 0,
    last_sync_duration_ms INTEGER,
    last_sync_error TEXT,
    consecutive_sync_failures INTEGER DEFAULT 0,
    
    -- Rate Limiting
    rate_limit_requests_per_minute INTEGER DEFAULT 10,
    last_api_call_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Additional Configuration
    settings JSONB DEFAULT '{}', -- Exchange-specific settings
    supported_features TEXT[] DEFAULT '{}', -- ['spot', 'futures', 'staking', 'lending']
    
    -- Constraints
    CONSTRAINT unique_user_exchange_connection UNIQUE(user_id, exchange_name, connection_name),
    CONSTRAINT valid_exchange_name CHECK (exchange_name IN (
        'coinbase', 'coinbase_pro', 'binance', 'binance_us', 
        'kraken', 'gemini', 'ftx', 'ftx_us', 'kucoin', 
        'bitfinex', 'bitstamp', 'okx', 'gate_io', 'crypto_com',
        'huobi', 'bybit', 'mexc', 'bitget', 'phemex'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'syncing'))
);

-- Indexes for performance
CREATE INDEX idx_exchange_connections_user_id ON exchange_connections(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exchange_connections_status ON exchange_connections(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_exchange_connections_next_sync ON exchange_connections(next_scheduled_sync_at) 
    WHERE deleted_at IS NULL AND auto_sync_enabled = true AND status = 'active';
CREATE INDEX idx_exchange_connections_last_sync ON exchange_connections(last_sync_at) WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exchange_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exchange_connections_updated_at_trigger
    BEFORE UPDATE ON exchange_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_exchange_connections_updated_at();

-- Comments for documentation
COMMENT ON TABLE exchange_connections IS 'Stores cryptocurrency exchange API connections for users';
COMMENT ON COLUMN exchange_connections.api_key_encrypted IS 'API key encrypted using application-level encryption';
COMMENT ON COLUMN exchange_connections.api_secret_encrypted IS 'API secret encrypted using application-level encryption';
COMMENT ON COLUMN exchange_connections.is_read_only IS 'Whether the API credentials have read-only permissions (recommended)';
COMMENT ON COLUMN exchange_connections.settings IS 'Exchange-specific configuration in JSON format';
COMMENT ON COLUMN exchange_connections.supported_features IS 'Array of features supported by this exchange connection';