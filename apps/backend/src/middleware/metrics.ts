import { Hono } from 'hono';

const metricsApp = new Hono();

// Simple metrics for Prometheus
let requestCount = 0;
const requestDurations: number[] = [];

metricsApp.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  requestCount++;
  requestDurations.push(duration);
  // Keep last 1000 durations
  if (requestDurations.length > 1000) {
    requestDurations.shift();
  }
});

metricsApp.get('/', (c) => {
  const avgDuration = requestDurations.length > 0 
    ? requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length 
    : 0;

  const metrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${requestCount}

# HELP http_request_duration_seconds Average HTTP request duration
# TYPE http_request_duration_seconds gauge
http_request_duration_seconds ${avgDuration / 1000}

# HELP http_request_duration_count Number of requests in duration calculation
# TYPE http_request_duration_count gauge
http_request_duration_count ${requestDurations.length}
`;

  return c.text(metrics);
});

export { metricsApp as metrics };