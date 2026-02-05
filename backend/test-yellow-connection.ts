/**
 * Yellow Network Connection Test
 * Tests connection to Yellow Network Testnet ClearNode
 */

import WebSocket from 'ws';

const YELLOW_TESTNET = 'ws://localhost:9999';

console.log('🔌 Connecting to Yellow Network (Mock Server)...');
console.log(`Endpoint: ${YELLOW_TESTNET}\n`);

const ws = new WebSocket(YELLOW_TESTNET);

ws.on('open', () => {
  console.log('✅ CONNECTED to Yellow Network Testnet!');
  console.log('🔄 Sending get_info request...\n');
  
  // Send JSON-RPC request to get node info
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'get_info',
    id: 1
  }));
});

ws.on('message', (data) => {
  console.log('📨 Received from Yellow Network:');
  try {
    const parsed = JSON.parse(data.toString());
    console.log(JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.log(data.toString());
  }
  console.log('');
});

ws.on('error', (error: any) => {
  console.error('❌ Connection failed:', error.message);
  console.error('\n🔍 Troubleshooting:');
  console.error('  - Check internet connection');
  console.error('  - Verify Yellow Network testnet is online');
  console.error('  - Check firewall/proxy settings');
  console.error('  - Try: nslookup testnet.clearnet.yellow.com');
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed (code: ${code})`);
  if (reason) {
    console.log(`Reason: ${reason.toString()}`);
  }
  process.exit(code === 1000 ? 0 : 1);
});

// Keep alive for 5 seconds to receive responses
setTimeout(() => {
  console.log('⏱️  Test timeout - closing connection...');
  ws.close();
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Interrupted - closing connection...');
  ws.close();
  process.exit(0);
});
