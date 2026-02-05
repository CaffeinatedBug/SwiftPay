import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { YellowHub } from './yellow/YellowHub';
import { ethers } from 'ethers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Yellow Hub
const yellowHub = new YellowHub(
  process.env.YELLOW_WS_URL || 'wss://clearnet.yellow.com/ws',
  process.env.HUB_PRIVATE_KEY!
);

// WebSocket server for merchant real-time updates
const wss = new WebSocketServer({ port: Number(WS_PORT) });
const merchantConnections = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url!, `ws://localhost:${WS_PORT}`);
  const merchantId = url.searchParams.get('merchantId');

  if (merchantId) {
    merchantConnections.set(merchantId, ws);
    console.log(`✅ Merchant ${merchantId} connected to WebSocket`);

    ws.on('close', () => {
      merchantConnections.delete(merchantId);
      console.log(`❌ Merchant ${merchantId} disconnected`);
    });
  }
});

// Notify merchant of payment
function notifyMerchant(merchantId: string, payment: any) {
  const ws = merchantConnections.get(merchantId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'PAYMENT_CLEARED',
      payment
    }));
  }
}

// Yellow Hub event handlers
yellowHub.on('connected', () => {
  console.log('✅ Yellow Hub connected');
});

yellowHub.on('payment_cleared', (payment) => {
  console.log('💰 Payment cleared event:', payment);
  notifyMerchant(payment.merchantId, payment);
});

yellowHub.on('payments_settled', (data) => {
  console.log('💎 Payments settled:', data);
  const ws = merchantConnections.get(data.merchantId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'SETTLEMENT_COMPLETE',
      ...data
    }));
  }
});

yellowHub.on('error', (error) => {
  console.error('❌ Yellow Hub error:', error);
});

// Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    yellowHub: yellowHub.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Get Yellow Hub stats
app.get('/api/stats', (req: Request, res: Response) => {
  res.json(yellowHub.getStats());
});

// Open user channel
app.post('/api/channels/user', async (req: Request, res: Response) => {
  try {
    const { userId, initialDeposit } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const channel = await yellowHub.openUserChannel(userId, initialDeposit || '0');

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance,
        status: channel.status
      }
    });
  } catch (error: any) {
    console.error('Failed to open user channel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to open channel'
    });
  }
});

// Open merchant channel
app.post('/api/channels/merchant', async (req: Request, res: Response) => {
  try {
    const { merchantId, initialDeposit } = req.body;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required' });
    }

    const channel = await yellowHub.openMerchantChannel(merchantId, initialDeposit || '0');

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance,
        status: channel.status
      }
    });
  } catch (error: any) {
    console.error('Failed to open merchant channel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to open channel'
    });
  }
});

// Clear payment (instant off-chain via Yellow)
app.post('/api/payments/clear', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, amount, message, signature } = req.body;

    // Validate inputs
    if (!userId || !merchantId || !amount || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, merchantId, amount, signature'
      });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== userId.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    console.log(`💳 Processing payment: ${userId} -> ${merchantId}, ${amount} USDC`);

    // Clear payment via Yellow Network (instant, off-chain)
    const payment = await yellowHub.clearPayment(userId, merchantId, amount, signature);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        userId: payment.userId,
        merchantId: payment.merchantId,
        amount: payment.amount,
        status: payment.status,
        timestamp: payment.timestamp,
        clearedIn: '< 200ms' // Yellow Network instant clearing
      },
      message: 'Payment cleared instantly via Yellow Network'
    });
  } catch (error: any) {
    console.error('Payment clearing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear payment'
    });
  }
});

// Get cleared payments for merchant
app.get('/api/payments/cleared/:merchantId', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const payments = yellowHub.getClearedPayments(merchantId);
    const total = yellowHub.getTotalCleared(merchantId);

    res.json({
      success: true,
      merchantId,
      payments,
      totalCleared: total,
      count: payments.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Settle merchant payments (close Yellow channels, prepare for on-chain settlement)
app.post('/api/settle', async (req: Request, res: Response) => {
  try {
    const { merchantId, merchantAddress } = req.body;

    if (!merchantId || !merchantAddress) {
      return res.status(400).json({
        success: false,
        error: 'merchantId and merchantAddress are required'
      });
    }

    console.log(`💰 Settling payments for merchant: ${merchantId}`);

    // Settle payments via Yellow (closes channels, gets final balances)
    const settledPayments = await yellowHub.settleMerchantPayments(merchantId);
    const totalAmount = settledPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // TODO: Trigger on-chain settlement to Arc via SwiftPayVault
    // For now, we return the settlement details

    res.json({
      success: true,
      merchantId,
      settledPayments: settledPayments.length,
      totalAmount: totalAmount.toFixed(2),
      status: 'settled',
      message: 'Payments settled via Yellow Network. Ready for on-chain finalization.'
    });
  } catch (error: any) {
    console.error('Settlement failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Settlement failed'
    });
  }
});

// Get user channel balance
app.get('/api/balance/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const balance = await yellowHub.getUserChannelBalance(userId);

    res.json({
      success: true,
      userId,
      balance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get merchant channel balance
app.get('/api/balance/merchant/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const balance = await yellowHub.getMerchantChannelBalance(merchantId);

    res.json({
      success: true,
      merchantId,
      balance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Close user channel
app.post('/api/channels/user/close', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await yellowHub.closeUserChannel(userId);

    res.json({
      success: true,
      message: `Channel closed for user ${userId}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting SwiftPay Hub...');

    // Initialize Yellow Hub
    await yellowHub.initialize();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`✅ HTTP Server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket Server running on ws://localhost:${WS_PORT}`);
      console.log('\n📊 API Endpoints:');
      console.log(`   GET  /health`);
      console.log(`   GET  /api/stats`);
      console.log(`   POST /api/channels/user`);
      console.log(`   POST /api/channels/merchant`);
      console.log(`   POST /api/payments/clear`);
      console.log(`   GET  /api/payments/cleared/:merchantId`);
      console.log(`   POST /api/settle`);
      console.log(`   GET  /api/balance/user/:userId`);
      console.log(`   GET  /api/balance/merchant/:merchantId`);
      console.log('\n✨ SwiftPay Hub ready for instant payments via Yellow Network!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  yellowHub.disconnect();
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  yellowHub.disconnect();
  wss.close();
  process.exit(0);
});

startServer();
