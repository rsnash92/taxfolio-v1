-- Wallet Connections Schema
-- Stores blockchain wallet addresses and Web3 wallet connections

CREATE TABLE IF NOT EXISTS wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection Details
    wallet_name VARCHAR(100), -- User-defined name for the wallet
    connection_type VARCHAR(30) NOT NULL, -- 'address', 'metamask', 'walletconnect', 'ledger', 'trezor'
    
    -- Blockchain Details
    blockchain VARCHAR(50) NOT NULL, -- 'ethereum', 'bitcoin', 'base', 'arbitrum', 'polygon', etc.
    network VARCHAR(50) DEFAULT 'mainnet', -- 'mainnet', 'testnet', 'goerli', etc.
    chain_id INTEGER, -- EVM chain ID (1 for Ethereum mainnet, 8453 for Base, etc.)
    
    -- Address Information
    address VARCHAR(100) NOT NULL, -- The wallet address
    address_type VARCHAR(20), -- 'eoa', 'contract', 'multisig'
    ens_name VARCHAR(100), -- ENS or other name service
    
    -- Connection Method Details
    connection_method VARCHAR(50), -- 'manual', 'walletconnect', 'metamask', 'hardware'
    connection_metadata JSONB DEFAULT '{}', -- Store WalletConnect session, etc.
    
    -- Verification
    is_verified BOOLEAN DEFAULT false, -- Whether ownership has been verified
    verification_method VARCHAR(50), -- 'signature', 'transaction', 'manual'
    verification_signature TEXT, -- Stored signature for verification
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Connection Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error', 'syncing'
    
    -- Sync Configuration
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_hours INTEGER DEFAULT 6, -- More frequent than exchanges due to on-chain activity
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_successful_sync_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync Statistics
    total_transactions_synced INTEGER DEFAULT 0,
    last_sync_block_number BIGINT, -- Last block number synced
    last_sync_duration_ms INTEGER,
    last_sync_error TEXT,
    consecutive_sync_failures INTEGER DEFAULT 0,
    
    -- Balance Tracking
    native_balance DECIMAL(36, 18), -- Native token balance (ETH, BTC, etc.)
    native_balance_usd DECIMAL(20, 2), -- USD value of native balance
    token_count INTEGER DEFAULT 0, -- Number of different tokens held
    nft_count INTEGER DEFAULT 0, -- Number of NFTs held
    last_balance_update_at TIMESTAMP WITH TIME ZONE,
    
    -- Rate Limiting for RPC calls
    rate_limit_requests_per_minute INTEGER DEFAULT 30,
    last_rpc_call_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy Settings
    privacy_mode BOOLEAN DEFAULT false, -- Hide balance details in UI
    show_nfts BOOLEAN DEFAULT true,
    show_tokens BOOLEAN DEFAULT true,
    show_defi_positions BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Additional Configuration
    settings JSONB DEFAULT '{}', -- Wallet-specific settings
    tags TEXT[] DEFAULT '{}', -- User-defined tags ['cold-storage', 'defi', 'trading']
    notes TEXT, -- User notes about this wallet
    
    -- Risk Assessment
    risk_score INTEGER DEFAULT 0, -- 0-100 based on wallet activity
    is_contract_wallet BOOLEAN DEFAULT false,
    has_suspicious_activity BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT unique_user_wallet_address UNIQUE(user_id, blockchain, address),
    CONSTRAINT valid_blockchain CHECK (blockchain IN (
        'ethereum', 'bitcoin', 'base', 'arbitrum', 'optimism', 
        'polygon', 'avalanche', 'bsc', 'fantom', 'gnosis',
        'celo', 'harmony', 'moonbeam', 'cronos', 'aurora',
        'near', 'solana', 'cardano', 'polkadot', 'cosmos',
        'algorand', 'tezos', 'flow', 'hedera', 'aptos', 'sui'
    )),
    CONSTRAINT valid_connection_type CHECK (connection_type IN (
        'address', 'metamask', 'walletconnect', 'coinbase_wallet',
        'ledger', 'trezor', 'trust_wallet', 'phantom', 'keplr'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'syncing')),
    CONSTRAINT valid_address_format CHECK (
        (blockchain = 'ethereum' AND address ~ '^0x[a-fA-F0-9]{40}$') OR
        (blockchain = 'bitcoin' AND (
            address ~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$' OR -- Legacy
            address ~ '^bc1[a-z0-9]{39,59}$' -- Bech32
        )) OR
        (blockchain NOT IN ('ethereum', 'bitcoin')) -- Allow other formats
    )
);

-- Indexes for performance
CREATE INDEX idx_wallet_connections_user_id ON wallet_connections(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wallet_connections_address ON wallet_connections(blockchain, address) WHERE deleted_at IS NULL;
CREATE INDEX idx_wallet_connections_status ON wallet_connections(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_wallet_connections_next_sync ON wallet_connections(next_scheduled_sync_at) 
    WHERE deleted_at IS NULL AND auto_sync_enabled = true AND status = 'active';
CREATE INDEX idx_wallet_connections_blockchain ON wallet_connections(blockchain) WHERE deleted_at IS NULL;
CREATE INDEX idx_wallet_connections_verified ON wallet_connections(is_verified) WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_connections_updated_at_trigger
    BEFORE UPDATE ON wallet_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_connections_updated_at();

-- Comments for documentation
COMMENT ON TABLE wallet_connections IS 'Stores blockchain wallet addresses and Web3 wallet connections';
COMMENT ON COLUMN wallet_connections.address IS 'The blockchain address (must be properly formatted for the blockchain type)';
COMMENT ON COLUMN wallet_connections.is_verified IS 'Whether the user has proven ownership of this wallet';
COMMENT ON COLUMN wallet_connections.chain_id IS 'EVM chain ID for Ethereum-compatible blockchains';
COMMENT ON COLUMN wallet_connections.connection_metadata IS 'Stores connection-specific data like WalletConnect sessions';
COMMENT ON COLUMN wallet_connections.privacy_mode IS 'When enabled, hides sensitive balance information in the UI';
COMMENT ON COLUMN wallet_connections.risk_score IS 'Calculated based on wallet activity patterns (0-100)';