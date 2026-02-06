/**
 * Settlement Flow Integration Test
 * Tests the complete end-to-end settlement orchestration
 */

import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const MERCHANT_ID = process.env.TEST_MERCHANT_ID || '0xYourMerchantAddress';
const USER_ID = process.env.TEST_USER_ID || '0xYourUserAddress';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

async function log(step: string, message: string) {
  console.log(`\n[${step}] ${message}`);
}

async function testStep(step: string, fn: () => Promise<any>): Promise<boolean> {
  try {
    log(step, 'Starting...');
    const data = await fn();
    results.push({ step, success: true, data });
    log(step, '✅ Success');
    return true;
  } catch (error: any) {
    results.push({ step, success: false, error: error.message });
    log(step, `❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   🧪 Settlement Flow Integration Test 🧪                  ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Merchant ID: ${MERCHANT_ID}`);
  console.log(`User ID: ${USER_ID}`);
  console.log('');

  // Step 1: Health Check
  await testStep('Health Check', async () => {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('   Yellow Hub:', response.data.yellowHub.connected ? '✅' : '❌');
    console.log('   Settlement Orchestrator:', response.data.settlementOrchestrator ? '✅' : '❌');
    return response.data;
  });

  // Step 2: Create Merchant Channel
  await testStep('Create Merchant Channel', async () => {
    const response = await axios.post(`${API_BASE}/api/channels/merchant`, {
      merchantId: MERCHANT_ID,
    });
    console.log('   Channel ID:', response.data.channel.channelId);
    return response.data;
  });

  // Step 3: Create User Channel
  await testStep('Create User Channel', async () => {
    const response = await axios.post(`${API_BASE}/api/channels/user`, {
      userId: USER_ID,
      initialBalance: '100000000', // 100 USDC
    });
    console.log('   Channel ID:', response.data.channel.channelId);
    console.log('   Balance:', response.data.channel.balance);
    return response.data;
  });

  // Step 4: Clear Payment
  await testStep('Clear Payment', async () => {
    // Note: In real scenario, you'd sign this with user's wallet
    const message = `Payment from ${USER_ID} to ${MERCHANT_ID} for 10 USDC`;
    const signature = '0x' + '00'.repeat(65); // Mock signature for testing

    const response = await axios.post(`${API_BASE}/api/payments/clear`, {
      userId: USER_ID,
      merchantId: MERCHANT_ID,
      amount: '10000000', // 10 USDC
      message,
      signature,
    });
    console.log('   Amount:', response.data.payment.amount);
    console.log('   User Balance:', response.data.payment.userChannelBalance);
    console.log('   Merchant Balance:', response.data.payment.merchantChannelBalance);
    return response.data;
  });

  // Step 5: Check Settlement Eligibility
  await testStep('Check Settlement Eligibility', async () => {
    const response = await axios.get(`${API_BASE}/api/settlement/check/${MERCHANT_ID}`);
    console.log('   Should Settle:', response.data.shouldSettle ? '✅' : '❌');
    return response.data;
  });

  // Step 6: Get Merchant Channel Info
  await testStep('Get Merchant Channel', async () => {
    const response = await axios.get(`${API_BASE}/api/channels/merchant/${MERCHANT_ID}`);
    console.log('   Balance:', response.data.channel.balance);
    console.log('   Status:', response.data.channel.status);
    return response.data;
  });

  // Step 7: Trigger Settlement (Force)
  let jobId: string | undefined;
  const settlementSuccess = await testStep('Trigger Settlement', async () => {
    const response = await axios.post(`${API_BASE}/api/settlement/merchant/${MERCHANT_ID}`, {
      force: true, // Force settlement regardless of schedule
    });
    jobId = response.data.job.id;
    console.log('   Job ID:', jobId);
    console.log('   Status:', response.data.job.status);
    console.log('   Stage:', response.data.job.stage);
    console.log('   Amount:', response.data.job.totalAmount);
    return response.data;
  });

  // Step 8: Poll Job Status
  if (settlementSuccess && jobId) {
    await testStep('Monitor Settlement Job', async () => {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts = 5 minutes max
      const pollInterval = 10000; // 10 seconds

      while (attempts < maxAttempts) {
        const response = await axios.get(`${API_BASE}/api/settlement/jobs/${jobId}`);
        const job = response.data.job;

        console.log(`   [Attempt ${attempts + 1}/${maxAttempts}]`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Stage: ${job.stage}`);

        if (job.status === 'completed') {
          console.log('   ✅ Settlement completed!');
          console.log('   TX Hashes:');
          console.log('     Yellow Close:', job.txHashes.yellowClose);
          console.log('     Avail Bridge:', job.txHashes.availBridge);
          console.log('     Arc Deposit:', job.txHashes.arcDeposit);
          return job;
        }

        if (job.status === 'failed') {
          throw new Error(`Settlement failed: ${job.error}`);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      throw new Error('Settlement timeout - job did not complete in time');
    });
  }

  // Step 9: Get Settlement Statistics
  await testStep('Get Settlement Stats', async () => {
    const response = await axios.get(`${API_BASE}/api/settlement/stats`);
    console.log('   Total Jobs:', response.data.stats.totalJobs);
    console.log('   Completed:', response.data.stats.completed);
    console.log('   Failed:', response.data.stats.failed);
    console.log('   Active:', response.data.stats.active);
    console.log('   Total Settled:', response.data.stats.totalSettled, 'USDC');
    return response.data;
  });

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   📊 Test Summary 📊                                      ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('');

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.step}: ${r.error}`);
      });
    console.log('');
  }

  const successRate = ((passed / results.length) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All tests passed! Settlement orchestration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
