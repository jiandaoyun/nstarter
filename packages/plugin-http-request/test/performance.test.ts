/**
 * 性能测试：对比 Axios 和 Undici
 * 注意：这些测试需要网络连接和较长时间运行
 */

import { describe, it } from 'node:test';
import { HttpClient } from '../src/client';

interface BenchmarkResult {
  adapter: 'axios' | 'undici';
  totalRequests: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  requestsPerSecond: number;
}

/**
 * 运行性能测试
 */
async function runBenchmark(
  adapter: 'axios' | 'undici',
  url: string,
  concurrency: number,
  totalRequests: number
): Promise<BenchmarkResult> {
  const client = new HttpClient({
    adapter,
    logging: { enabled: false },
    security: {
      enableDnsValidation: false, // 禁用以减少开销
      enableIpValidation: false
    }
  });

  const durations: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  const startTime = Date.now();

  // 分批执行请求
  const batches = Math.ceil(totalRequests / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < batchSize; i++) {
      const requestStart = Date.now();
      const promise = client.get(url)
        .then(() => {
          const duration = Date.now() - requestStart;
          durations.push(duration);
          successCount++;
        })
        .catch(() => {
          failureCount++;
        });
      
      promises.push(promise);
    }

    await Promise.all(promises);
  }

  const totalDuration = Date.now() - startTime;

  return {
    adapter,
    totalRequests,
    successCount,
    failureCount,
    totalDuration,
    avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    minDuration: durations.length > 0 ? Math.min(...durations) : 0,
    maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
    requestsPerSecond: (successCount / totalDuration) * 1000
  };
}

/**
 * 打印性能测试结果
 */
function printResults(results: BenchmarkResult[]): void {
  console.log('\n========== Performance Test Results ==========\n');
  
  for (const result of results) {
    console.log(`Adapter: ${result.adapter.toUpperCase()}`);
    console.log(`  Total Requests: ${result.totalRequests}`);
    console.log(`  Success: ${result.successCount}`);
    console.log(`  Failure: ${result.failureCount}`);
    console.log(`  Total Duration: ${result.totalDuration}ms`);
    console.log(`  Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
    console.log(`  Min Duration: ${result.minDuration}ms`);
    console.log(`  Max Duration: ${result.maxDuration}ms`);
    console.log(`  Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
    console.log('');
  }

  // 对比分析
  if (results.length === 2) {
    const [axios, undici] = results;
    const speedup = axios.avgDuration / undici.avgDuration;
    const throughputImprovement = (undici.requestsPerSecond - axios.requestsPerSecond) / axios.requestsPerSecond * 100;
    
    console.log('========== Comparison ==========');
    console.log(`Undici is ${speedup.toFixed(2)}x ${speedup > 1 ? 'faster' : 'slower'} than Axios (avg duration)`);
    console.log(`Undici throughput is ${Math.abs(throughputImprovement).toFixed(2)}% ${throughputImprovement > 0 ? 'higher' : 'lower'} than Axios`);
    console.log('');
  }

  console.log('==============================================\n');
}

describe('Performance Tests', () => {
  // 这些测试默认跳过，因为它们需要网络连接且运行时间较长
  // 可以通过设置环境变量 RUN_PERF_TESTS=1 来运行
  const shouldRun = process.env.RUN_PERF_TESTS === '1';

  it('should compare Axios and Undici performance', async function() {
    if (!shouldRun) {
      console.log('Skipping performance test. Set RUN_PERF_TESTS=1 to run.');
      return;
    }

    const testUrl = 'https://httpbin.org/get';
    const concurrency = 10;
    const totalRequests = 100;

    console.log(`\nRunning performance test: ${totalRequests} requests with concurrency ${concurrency}\n`);

    try {
      // 测试 Axios
      const axiosResult = await runBenchmark('axios', testUrl, concurrency, totalRequests);
      
      // 测试 Undici
      const undiciResult = await runBenchmark('undici', testUrl, concurrency, totalRequests);

      // 打印结果
      printResults([axiosResult, undiciResult]);
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('Skipping test: Network unavailable');
        return;
      }
      throw error;
    }
  });

  it('should test concurrent request handling', async function() {
    if (!shouldRun) {
      console.log('Skipping performance test. Set RUN_PERF_TESTS=1 to run.');
      return;
    }

    const testUrl = 'https://httpbin.org/get';
    const concurrency = 50;
    const totalRequests = 200;

    console.log(`\nRunning concurrent test: ${totalRequests} requests with concurrency ${concurrency}\n`);

    try {
      const axiosResult = await runBenchmark('axios', testUrl, concurrency, totalRequests);
      const undiciResult = await runBenchmark('undici', testUrl, concurrency, totalRequests);

      printResults([axiosResult, undiciResult]);
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('Skipping test: Network unavailable');
        return;
      }
      throw error;
    }
  });

  it('should measure memory usage', async function() {
    if (!shouldRun) {
      console.log('Skipping performance test. Set RUN_PERF_TESTS=1 to run.');
      return;
    }

    const testUrl = 'https://httpbin.org/get';
    const requests = 100;

    console.log('\nMeasuring memory usage...\n');

    // 强制 GC（如果可用）
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage();

    try {
      // 测试 Axios
      const axiosClient = new HttpClient({ adapter: 'axios', logging: { enabled: false } });
      for (let i = 0; i < requests; i++) {
        await axiosClient.get(testUrl);
      }

      if (global.gc) {
        global.gc();
      }

      const axiosMemory = process.memoryUsage();

      console.log('Axios Memory Usage:');
      console.log(`  Heap Used: ${((axiosMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  External: ${((axiosMemory.external - initialMemory.external) / 1024 / 1024).toFixed(2)} MB`);

      // 测试 Undici
      if (global.gc) {
        global.gc();
      }

      const beforeUndici = process.memoryUsage();

      const undiciClient = new HttpClient({ adapter: 'undici', logging: { enabled: false } });
      for (let i = 0; i < requests; i++) {
        await undiciClient.get(testUrl);
      }

      if (global.gc) {
        global.gc();
      }

      const undiciMemory = process.memoryUsage();

      console.log('\nUndici Memory Usage:');
      console.log(`  Heap Used: ${((undiciMemory.heapUsed - beforeUndici.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  External: ${((undiciMemory.external - beforeUndici.external) / 1024 / 1024).toFixed(2)} MB`);
      console.log('');
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('Skipping test: Network unavailable');
        return;
      }
      throw error;
    }
  });
});

