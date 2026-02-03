import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { CircleGatewayService } from './services/CircleGatewayService';
import { CircleWalletsService } from './services/CircleWalletsService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Environment configuration
const PORT = process.env.PORT || 3001;
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || '';
const CIRCLE_ENVIRONMENT = (process.env.CIRCLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

/**
 * SwiftPay Hub - Main Backend Server
 * 
 * Integrates:
 * - Circle Gateway (USDC operations)
 * - Circle Wallets (merchant payouts)
 * - Yellow Network (state channels) - TODO Phase 3
 * - LI.FI (cross-chain routing) - TODO Phase 6
 * - Arc Settlement (vault interactions)
 */
class SwiftPayHub {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer | null = null;
  
  // Circle integrations
  private circleGateway: CircleGatewayService;
  private circleWallets: CircleWalletsService;

  constructor() {
    this.app = express();
    this.setupCircleIntegrations();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupCircleIntegrations(): void {
    logger.info('Setting up Circle integrations...');
    
    if (!CIRCLE_API_KEY) {
      logger.warn('Circle API key not provided - some features will be disabled');
    }

    // Initialize Circle Gateway
    this.circleGateway = new CircleGatewayService(CIRCLE_API_KEY, CIRCLE_ENVIRONMENT);
    
    // Initialize Circle Wallets
    this.circleWallets = new CircleWalletsService(this.circleGateway);

    logger.info('Circle integrations initialized successfully');
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          circleGateway: !!CIRCLE_API_KEY,
          circleWallets: true
        }
      });
    });

    // Circle Gateway routes
    this.app.post('/api/merchants/:merchantId/wallet', async (req, res) => {
      try {
        const { merchantId } = req.params;
        const { blockchain = 'arc-sepolia' } = req.body;

        const wallet = await this.circleWallets.getOrCreateMerchantWallet(merchantId, blockchain);
        
        res.json({
          success: true,
          wallet
        });
      } catch (error) {
        logger.error('Failed to create merchant wallet', { error, merchantId: req.params.merchantId });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get merchant balance
    this.app.get('/api/merchants/:merchantId/balance', async (req, res) => {
      try {
        const { merchantId } = req.params;
        const balance = await this.circleWallets.getMerchantBalance(merchantId);
        
        res.json({
          success: true,
          balance,
          currency: 'USDC'
        });
      } catch (error) {
        logger.error('Failed to get merchant balance', { error, merchantId: req.params.merchantId });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Execute payout
    this.app.post('/api/merchants/:merchantId/payout', async (req, res) => {
      try {
        const { merchantId } = req.params;
        const { amount, settlementId, blockchain } = req.body;

        const payoutRequest = {
          merchantId,
          amount,
          currency: 'USDC' as const,
          settlementId,
          blockchain
        };

        const payout = await this.circleWallets.executePayout(payoutRequest);
        
        res.json({
          success: true,
          payout
        });
      } catch (error) {
        logger.error('Failed to execute payout', { error, merchantId: req.params.merchantId });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Circle webhook endpoint
    this.app.post('/webhooks/circle', (req, res) => {
      try {
        logger.info('Received Circle webhook', { headers: req.headers });
        
        this.circleGateway.handleWebhook(req.body);
        
        res.status(200).json({ received: true });
      } catch (error) {
        logger.error('Failed to process Circle webhook', { error });
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    // Settlement completion endpoint (called by Arc settlement process)
    this.app.post('/api/settlements/:settlementId/complete', async (req, res) => {
      try {
        const { settlementId } = req.params;
        const { merchantId, amount } = req.body;

        logger.info('Processing settlement completion', {
          settlementId,
          merchantId,
          amount
        });

        // Execute payout to merchant wallet
        const payout = await this.circleWallets.processSettlementCompletion(
          settlementId,
          merchantId,
          amount
        );

        // Notify merchant via WebSocket
        if (this.wss) {
          this.broadcastToMerchant(merchantId, {
            type: 'settlement_completed',
            data: {
              settlementId,
              amount,
              payout
            }
          });
        }

        res.json({
          success: true,
          payout
        });
      } catch (error) {
        logger.error('Failed to process settlement completion', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get Arc network configuration
    this.app.get('/api/config/arc', (req, res) => {
      res.json({
        chainId: 5042002, // Arc testnet
        rpcUrl: 'https://rpc.testnet.arc.network',
        explorerUrl: 'https://testnet-explorer.arc.network',
        vaultAddress: process.env.VAULT_ADDRESS || '0x...', // Deployed vault address
        usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Example USDC on Arc
      });
    });

    // List all merchant wallets (admin endpoint)
    this.app.get('/api/admin/wallets', async (req, res) => {
      try {
        const wallets = await this.circleWallets.listMerchantWallets();
        res.json({
          success: true,
          wallets,
          count: wallets.length
        });
      } catch (error) {
        logger.error('Failed to list merchant wallets', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private setupWebSocket(): void {
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const merchantId = url.searchParams.get('merchantId');
      
      logger.info('WebSocket connection established', { merchantId });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message, merchantId);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error });
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed', { merchantId });
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          message: 'Connected to SwiftPay Hub',
          merchantId,
          timestamp: new Date().toISOString()
        }
      }));
    });
  }

  private handleWebSocketMessage(ws: any, message: any, merchantId: string | null): void {
    logger.debug('WebSocket message received', { message, merchantId });
    
    // Handle different message types
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      
      case 'subscribe_merchant':
        // Subscribe to merchant-specific events
        if (merchantId) {
          logger.info('Merchant subscribed to events', { merchantId });
        }
        break;
      
      default:
        logger.warn('Unknown WebSocket message type', { type: message.type });
    }
  }

  private broadcastToMerchant(merchantId: string, message: any): void {
    if (!this.wss) return;

    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });

    logger.debug('Message broadcasted to merchant', { merchantId, messageType: message.type });
  }

  public start(): void {
    const port = parseInt(PORT.toString());
    
    this.server.listen(port, () => {
      logger.info(`SwiftPay Hub started successfully`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        circleEnvironment: CIRCLE_ENVIRONMENT
      });
      
      logger.info('Available endpoints:', {
        health: `http://localhost:${port}/health`,
        api: `http://localhost:${port}/api`,
        websocket: `ws://localhost:${port}`
      });
    });
  }
}

// Start the server
if (require.main === module) {
  const hub = new SwiftPayHub();
  hub.start();
}

export default SwiftPayHub;