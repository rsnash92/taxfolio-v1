// backend/src/routes/connections.ts
import { Router } from 'express';
import { Pool } from 'pg';
import { ExchangeFactory } from '../services/exchanges/ExchangeFactory';
import { encrypt } from '../utils/encryption';

// You'll need to import these from wherever they're defined in your project
// Adjust these imports based on your actual file structure
import { authenticate } from '../middleware/auth'; // You'll need to create this
import { db } from '../database'; // You'll need to create this

const router = Router();

// GET all connections for a user
router.get('/connections', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get exchange connections
    const exchangeConnections = await db.query(
      `SELECT 
        id, exchange_name, connection_name, status, 
        auto_sync_enabled, sync_frequency_hours,
        last_sync_at, last_successful_sync_at,
        total_transactions_synced, created_at
       FROM exchange_connections 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Get wallet connections if you have them
    const walletConnections = await db.query(
      `SELECT 
        id, address, name, network, status, 
        last_sync_at, created_at
       FROM wallet_connections 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      exchanges: exchangeConnections.rows,
      wallets: walletConnections.rows,
      total: exchangeConnections.rows.length + walletConnections.rows.length
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch connections' 
    });
  }
});

// Create new exchange connection
router.post('/connections/exchanges', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { exchange, name, credentials, auto_sync, sync_frequency } = req.body;
    
    // Validate exchange
    const validExchanges = ['coinbase', 'coinbase_pro', 'binance', 'kraken', 'gemini'];
    if (!validExchanges.includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }
    
    // Encrypt individual credential fields
    const encryptedApiKey = encrypt(credentials.apiKey, process.env.ENCRYPTION_KEY!);
    const encryptedApiSecret = encrypt(credentials.apiSecret, process.env.ENCRYPTION_KEY!);
    const encryptedApiPassphrase = credentials.apiPassphrase 
      ? encrypt(credentials.apiPassphrase, process.env.ENCRYPTION_KEY!)
      : null;
    
    // Test connection
    try {
      const encryptedCreds = JSON.stringify({
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        ...(encryptedApiPassphrase && { apiPassphrase: encryptedApiPassphrase })
      });
      
      const client = ExchangeFactory.create(exchange, encryptedCreds, process.env.ENCRYPTION_KEY!);
      const isValid = await client.testConnection();
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid API credentials' });
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Failed to connect to exchange', 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      });
    }
    
    // Insert connection
    const result = await db.query(
      `INSERT INTO exchange_connections (
        user_id, exchange_name, connection_name, api_key_encrypted, 
        api_secret_encrypted, api_passphrase_encrypted, auto_sync_enabled, 
        sync_frequency_hours, next_scheduled_sync_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, exchange_name, connection_name, status, auto_sync_enabled, 
                sync_frequency_hours, created_at`,
      [
        userId,
        exchange,
        name || `${exchange} Account`,
        encryptedApiKey,
        encryptedApiSecret,
        encryptedApiPassphrase,
        auto_sync !== false,
        sync_frequency === 'hourly' ? 1 : sync_frequency === 'weekly' ? 168 : 24,
        new Date(Date.now() + (24 * 60 * 60 * 1000)) // Next sync in 24 hours
      ]
    );
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({ 
      error: 'Failed to create connection', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Sync exchange connection
router.post('/connections/:id/sync', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Get connection from database
    const connection = await db.query(
      'SELECT * FROM exchange_connections WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId]
    );
    
    if (!connection.rows[0]) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    const conn = connection.rows[0];
    
    // Check if connection is active
    if (conn.status !== 'active') {
      return res.status(400).json({ error: 'Connection is not active' });
    }
    
    // Update status to syncing
    await db.query(
      `UPDATE exchange_connections 
       SET status = $1, last_sync_at = $2 
       WHERE id = $3`,
      ['syncing', new Date(), id]
    );
    
    const syncStartTime = Date.now();
    
    try {
      // Reconstruct credentials object
      const credentials = {
        apiKey: conn.api_key_encrypted,
        apiSecret: conn.api_secret_encrypted,
        ...(conn.api_passphrase_encrypted && { apiPassphrase: conn.api_passphrase_encrypted })
      };
      
      // Create exchange client
      const client = ExchangeFactory.create(
        conn.exchange_name,
        JSON.stringify(credentials),
        process.env.ENCRYPTION_KEY!
      );
      
      // Get last successful sync date
      const since = conn.last_successful_sync_at || undefined;
      
      // Start sync
      const syncResult = await client.syncTransactions(since);
      
      if (syncResult.success) {
        // Insert transactions
        let insertedCount = 0;
        for (const tx of syncResult.transactions) {
          // Check if transaction already exists
          const existing = await db.query(
            'SELECT id FROM transactions WHERE external_id = $1 AND user_id = $2',
            [tx.external_id, userId]
          );
          
          if (!existing.rows[0]) {
            await db.query(
              `INSERT INTO transactions (
                user_id, date, type, asset, amount, price, value, 
                fee, fee_asset, from_asset, from_amount, to_asset, 
                to_amount, exchange, tx_hash, notes, external_id, 
                sync_source, sync_connection_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
              [
                userId, tx.date, tx.type, tx.asset, tx.amount, tx.price, tx.value,
                tx.fee, tx.fee_asset, tx.from_asset, tx.from_amount, tx.to_asset,
                tx.to_amount, tx.exchange, tx.tx_hash, tx.notes, tx.external_id,
                'exchange', id
              ]
            );
            insertedCount++;
          }
        }
        
        const syncDuration = Date.now() - syncStartTime;
        
        // Update connection with success
        await db.query(
          `UPDATE exchange_connections 
           SET status = $1, 
               last_successful_sync_at = $2, 
               last_sync_duration_ms = $3,
               total_transactions_synced = total_transactions_synced + $4,
               consecutive_sync_failures = 0,
               last_sync_error = NULL,
               next_scheduled_sync_at = $5
           WHERE id = $6`,
          [
            'active', 
            new Date(), 
            syncDuration, 
            insertedCount,
            new Date(Date.now() + (conn.sync_frequency_hours * 60 * 60 * 1000)),
            id
          ]
        );
        
        // Log sync history
        await db.query(
          `INSERT INTO sync_history (
            connection_id, connection_type, started_at, completed_at, 
            status, records_synced, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, 'exchange', new Date(syncStartTime), new Date(), 'completed', insertedCount, null]
        );
        
        res.json({
          success: true,
          message: `Successfully synced ${insertedCount} new transactions (${syncResult.totalSynced} total processed)`,
          newTransactions: insertedCount,
          totalProcessed: syncResult.totalSynced,
          duration: syncDuration
        });
        
      } else {
        throw new Error(syncResult.error || 'Sync failed');
      }
      
    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      
      // Update connection with error
      await db.query(
        `UPDATE exchange_connections 
         SET status = $1, 
             last_sync_error = $2,
             last_sync_duration_ms = $3,
             consecutive_sync_failures = consecutive_sync_failures + 1
         WHERE id = $4`,
        ['error', error instanceof Error ? error.message : 'Unknown error', syncDuration, id]
      );
      
      // Log failed sync
      await db.query(
        `INSERT INTO sync_history (
          connection_id, connection_type, started_at, completed_at, 
          status, records_synced, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, 'exchange', new Date(syncStartTime), new Date(), 'failed', 0, error instanceof Error ? error.message : 'Unknown error']
      );
      
      throw error;
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      error: 'Sync failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete connection
router.delete('/connections/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Soft delete the connection
    const result = await db.query(
      `UPDATE exchange_connections 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json({ success: true, message: 'Connection deleted' });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

export default router;