/**
 * Mock Yellow Network ClearNode Server
 * For development/testing when real Yellow Network is not accessible
 * 
 * This simulates the Yellow Network ClearNode WebSocket API
 */

import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = 9999;

interface RPCRequest {
  jsonrpc: string;
  method: string;
  params?: any;
  id: number | string;
}

interface Channel {
  channelId: string;
  participants: string[];
  balances: Record<string, string>;
  nonce: number;
  status: 'opening' | 'active' | 'closing' | 'closed';
}

class MockYellowNode {
  private channels: Map<string, Channel> = new Map();
  private connections: Map<string, WebSocket> = new Map();

  handleRequest(ws: WebSocket, request: RPCRequest): void {
    console.log(`📨 Received: ${request.method}`);

    switch (request.method) {
      case 'get_info':
        this.sendResponse(ws, request.id, {
          node_id: 'mock-clearnode-001',
          version: '1.0.0-mock',
          network: 'testnet',
          timestamp: Date.now()
        });
        break;

      case 'auth_request':
        // Send auth challenge
        this.sendResponse(ws, request.id, {
          challenge: `mock_challenge_${Date.now()}`,
          timestamp: Date.now()
        });
        break;

      case 'auth_response':
        // Validate signature (mock - always accept)
        this.sendResponse(ws, request.id, {
          authenticated: true,
          address: request.params?.address || '0x0000',
          sessionId: `session_${Date.now()}`
        });
        break;

      case 'channel_create':
        const channelId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const channel: Channel = {
          channelId,
          participants: [request.params?.userId, request.params?.counterparty || 'hub'],
          balances: {
            [request.params?.userId]: request.params?.initialBalance || '0',
            [request.params?.counterparty || 'hub']: '0'
          },
          nonce: 0,
          status: 'opening'
        };
        
        this.channels.set(channelId, channel);
        
        this.sendResponse(ws, request.id, {
          channelId,
          status: 'opening'
        });
        
        // Simulate channel opening
        setTimeout(() => {
          channel.status = 'active';
          this.sendNotification(ws, 'channel_opened', {
            channelId,
            status: 'active',
            balance: channel.balances
          });
        }, 500);
        break;

      case 'transfer':
        const txChannelId = request.params?.channelId;
        const txChannel = this.channels.get(txChannelId);
        
        if (txChannel && txChannel.status === 'active') {
          const from = request.params?.from;
          const to = request.params?.to;
          const amount = parseFloat(request.params?.amount || '0');
          
          // Update balances
          const fromBalance = parseFloat(txChannel.balances[from] || '0');
          const toBalance = parseFloat(txChannel.balances[to] || '0');
          
          txChannel.balances[from] = (fromBalance - amount).toString();
          txChannel.balances[to] = (toBalance + amount).toString();
          txChannel.nonce++;
          
          this.sendResponse(ws, request.id, {
            success: true,
            channelId: txChannelId,
            nonce: txChannel.nonce,
            newBalance: txChannel.balances
          });
          
          // Notify recipient
          this.sendNotification(ws, 'payment_received', {
            channelId: txChannelId,
            from,
            to,
            amount: amount.toString(),
            timestamp: Date.now()
          });
        } else {
          this.sendError(ws, request.id, 'Channel not found or inactive');
        }
        break;

      case 'channel_close':
        const closeChannelId = request.params?.channelId;
        const closeChannel = this.channels.get(closeChannelId);
        
        if (closeChannel) {
          closeChannel.status = 'closing';
          
          this.sendResponse(ws, request.id, {
            success: true,
            channelId: closeChannelId,
            status: 'closing',
            finalBalances: closeChannel.balances
          });
          
          setTimeout(() => {
            closeChannel.status = 'closed';
            this.sendNotification(ws, 'channel_closed', {
              channelId: closeChannelId,
              finalBalances: closeChannel.balances
            });
          }, 1000);
        } else {
          this.sendError(ws, request.id, 'Channel not found');
        }
        break;

      default:
        this.sendError(ws, request.id, `Unknown method: ${request.method}`);
    }
  }

  private sendResponse(ws: WebSocket, id: number | string, result: any): void {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    }));
  }

  private sendError(ws: WebSocket, id: number | string, message: string): void {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message
      }
    }));
  }

  private sendNotification(ws: WebSocket, method: string, params: any): void {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method,
      params
    }));
  }
}

// Start mock server
const server = createServer();
const wss = new WebSocketServer({ server });
const mockNode = new MockYellowNode();

wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).slice(2, 9);
  console.log(`✅ Client connected: ${clientId}`);

  ws.on('message', (data: Buffer) => {
    try {
      const request: RPCRequest = JSON.parse(data.toString());
      mockNode.handleRequest(ws, request);
    } catch (err: any) {
      console.error('❌ Invalid JSON:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`👋 Client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${clientId}:`, error.message);
  });
});

server.listen(PORT, () => {
  console.log(`🟢 Mock Yellow Network ClearNode running on ws://localhost:${PORT}`);
  console.log(`📡 Ready to accept connections`);
  console.log(`\nTo use this mock server, update your .env:`);
  console.log(`YELLOW_WS_URL=ws://localhost:${PORT}\n`);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down mock Yellow Network node...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});
