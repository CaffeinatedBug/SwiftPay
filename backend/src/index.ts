import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { YellowNetworkHub } from './yellow/YellowNetworkHub';
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

// Initialize Yellow Network Hub (Real Nitrolite SDK)
const yellowHub = new YellowNetworkHub(process.env.HUB_PRIVATE_KEY!);

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
  console.log('✅ Yellow Network Hub connected (Sepolia Sandbox)');
});

yellowHub.on('payment_cleared', (payment) => {
  console.log('💰 Payment cleared event:', payment);
  notifyMerchant(payment.merchantId, payment);
});

yellowHub.on('channel_settled', (data) => {
  console.log('💎 Channel settled:', data);
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
    yellowHub: {
      connected: yellowHub.isReady(),
      hubAddress: yellowHub.getHubAddress()
    },
    timestamp: new Date().toISOString()
  });
});

// Deposit funds to Yellow Network
app.post('/api/deposit', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body; // Amount in USDC (6 decimals)

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const amountBigInt = BigInt(amount);
    const txHash = await yellowHub.depositFunds(amountBigInt);

    res.json({
      success: true,
      txHash,
      amount: amount.toString()
    });
  } catch (error: any) {
    console.error('Deposit failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deposit failed'
    });
  }
});

// Open user channel
app.post('/api/channels/user', async (req: Request, res: Response) => {
  try {
    const { userId, initialBalance } = req.body;

    if (!userId || !initialBalance) {
      return res.status(400).json({ error: 'userId and initialBalance are required' });
    }

    const balanceBigInt = BigInt(initialBalance);
    const channel = await yellowHub.createUserChannel(userId, balanceBigInt);

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance.toString(),
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
    const { merchantId } = req.body;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required' });
    }

    const channel = await yellowHub.createMerchantChannel(merchantId);

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance.toString(),
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

    // Convert amount to bigint (USDC has 6 decimals)
    const amountBigInt = BigInt(amount);

    // Clear payment via Yellow Network (instant, off-chain)
    const result = await yellowHub.clearPayment(userId, merchantId, amountBigInt, signature);

    res.json({
      success: true,
      payment: {
        userId,
        merchantId,
        amount: amount.toString(),
        timestamp: result.timestamp,
        userChannelBalance: result.userChannelBalance,
        merchantChannelBalance: result.merchantChannelBalance
      },
      message: 'Payment cleared instantly via Yellow Network (<200ms)'
    });
  } catch (error: any) {
    console.error('Payment clearing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear payment'
    });
  }
});

// Get user channel info
app.get('/api/channels/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const channel = yellowHub.getUserChannel(userId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance.toString(),
        status: channel.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get merchant channel info
app.get('/api/channels/merchant/:merchantId', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const channel = yellowHub.getMerchantChannel(merchantId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    res.json({
      success: true,
      channel: {
        channelId: channel.channelId,
        userId: channel.userId,
        balance: channel.balance.toString(),
        status: channel.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Settle merchant channel (close Yellow channel, settle on-chain)
app.post('/api/settle', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.body;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
    }

    console.log(`💰 Settling channel for merchant: ${merchantId}`);

    // Settle channel on Yellow Network (closes channel, settles on-chain)
    const txHash = await yellowHub.settleMerchantChannel(merchantId);

    res.json({
      success: true,
      merchantId,
      txHash,
      status: 'settled',
      message: 'Channel settled on-chain via Yellow Network'
    });
  } catch (error: any) {
    console.error('Settlement failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to settle'
    });
  }
});

// Initialize and start server// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting SwiftPay Hub...');
    console.log('🔄 Connecting to Yellow Network Sandbox (Sepolia)...');

    // Initialize Yellow Hub
    await yellowHub.connect();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✅ HTTP Server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket Server running on ws://localhost:${WS_PORT}`);
      console.log(`✅ Yellow Network Hub: ${yellowHub.getHubAddress()}`);
      console.log('\n📊 API Endpoints:');
      console.log(`   GET  /health`);
      console.log(`   POST /api/deposit`);
      console.log(`   POST /api/channels/user`);
      console.log(`   POST /api/channels/merchant`);
      console.log(`   GET  /api/channels/user/:userId`);
      console.log(`   GET  /api/channels/merchant/:merchantId`);
      console.log(`   POST /api/payments/clear`);
      console.log(`   POST /api/settle`);
      console.log('\n✨ SwiftPay Hub ready - Real Yellow Network integration active!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  wss.close();
  process.exit(0);
});

startServer();
