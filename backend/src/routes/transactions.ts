// backend/src/routes/transactions.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../database';

const router = Router();

// Get all transactions for user
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0, type, asset, exchange } = req.query;
    
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 1;
    
    // Add filters
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    if (asset) {
      paramCount++;
      query += ` AND asset = $${paramCount}`;
      params.push(asset);
    }
    
    if (exchange) {
      paramCount++;
      query += ` AND exchange = $${paramCount}`;
      params.push(exchange);
    }
    
    query += ` ORDER BY date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      transactions: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction
router.post('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      date, type, asset, amount, price, value,
      fee, fee_asset, exchange, notes
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO transactions (
        user_id, date, type, asset, amount, price, value,
        fee, fee_asset, exchange, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [userId, date, type, asset, amount, price, value, fee, fee_asset, exchange, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      date, type, asset, amount, price, value,
      fee, fee_asset, exchange, notes
    } = req.body;
    
    const result = await db.query(
      `UPDATE transactions 
       SET date = $1, type = $2, asset = $3, amount = $4, 
           price = $5, value = $6, fee = $7, fee_asset = $8, 
           exchange = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [date, type, asset, amount, price, value, fee, fee_asset, exchange, notes, id, userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;