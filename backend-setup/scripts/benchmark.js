/* eslint-disable no-console */
const { performance } = require('perf_hooks');

const baseUrl = process.env.BENCH_URL || process.argv[2] || 'http://localhost:3000';
const runs = Number(process.env.BENCH_RUNS || process.argv[3] || 30);
const concurrency = Number(process.env.BENCH_CONCURRENCY || process.argv[4] || 10);

const endpoints = [
  '/health',
  '/api/halls?page=1&limit=10'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const p = (values, percentile) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

const benchmarkEndpoint = async (path) => {
  const url = `${baseUrl}${path}`;
  const latencies = [];
  let errors = 0;
  let ok = 0;

  const worker = async () => {
    for (let i = 0; i < runs; i += 1) {
      const start = performance.now();
      try {
        const response = await fetch(url, { method: 'GET' });
        const end = performance.now();
        latencies.push(end - start);
        if (response.ok) ok += 1;
        else errors += 1;
        await response.arrayBuffer();
      } catch (error) {
        const end = performance.now();
        latencies.push(end - start);
        errors += 1;
      }
    }
  };

  const startAt = performance.now();
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  const totalMs = performance.now() - startAt;
  const totalRequests = runs * concurrency;

  return {
    path,
    totalRequests,
    ok,
    errors,
    rps: (totalRequests / totalMs) * 1000,
    avgMs: latencies.reduce((sum, x) => sum + x, 0) / latencies.length,
    p50Ms: p(latencies, 50),
    p95Ms: p(latencies, 95),
    p99Ms: p(latencies, 99)
  };
};

const main = async () => {
  console.log('Benchmark configuration:');
  console.log(`  baseUrl      = ${baseUrl}`);
  console.log(`  runs         = ${runs}`);
  console.log(`  concurrency  = ${concurrency}`);
  console.log('');

  const results = [];
  for (const endpoint of endpoints) {
    await sleep(250);
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);
  }

  console.log('Results');
  for (const result of results) {
    console.log(`\n${result.path}`);
    console.log(`  requests: ${result.totalRequests} (ok: ${result.ok}, errors: ${result.errors})`);
    console.log(`  rps     : ${result.rps.toFixed(2)}`);
    console.log(`  avg ms  : ${result.avgMs.toFixed(2)}`);
    console.log(`  p50 ms  : ${result.p50Ms.toFixed(2)}`);
    console.log(`  p95 ms  : ${result.p95Ms.toFixed(2)}`);
    console.log(`  p99 ms  : ${result.p99Ms.toFixed(2)}`);
  }
};

main().catch((error) => {
  console.error('Benchmark failed:', error.message);
  process.exit(1);
});
