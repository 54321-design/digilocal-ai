import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiTracker, ApiServiceType } from '../telemetry/apiTracker';

export interface GatewayExecuteOptions<T> {
  service: ApiServiceType;
  endpoint: string;
  task: () => Promise<T>;
  cacheKey?: string;
  cacheTtlMs?: number; // Time-to-live in ms (e.g. 10 * 60 * 1000 = 10 min)
  maxRetries?: number;
  tokensEstimated?: number;
}

interface QueuedTask {
  run: () => Promise<void>;
}

class ResilientLoadBalancer {
  private maxConcurrency = 4;
  private activeCount = 0;
  private queue: QueuedTask[] = [];

  // In-memory fast cache
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  // Circuit breaker state per service
  private failureCounts = new Map<ApiServiceType, number>();
  private circuitOpenUntil = new Map<ApiServiceType, number>();

  // Rate limiter timestamps
  private serviceCallHistory = new Map<ApiServiceType, number[]>();

  // Service maximums per 10-second window
  private rateLimits: Record<ApiServiceType, number> = {
    gemini_ai: 8, // max 8 requests per 10s
    google_gmb: 15, // max 15 requests per 10s
    seo_audit: 10,
    n8n_webhook: 10,
    firestore: 25,
  };

  /**
   * Execute an API call through the load balancer gateway with rate limiting,
   * connection pooling, smart caching, auto-retry, and circuit breaker.
   */
  public async execute<T>(options: GatewayExecuteOptions<T>): Promise<T> {
    const {
      service,
      endpoint,
      task,
      cacheKey,
      cacheTtlMs = 0,
      maxRetries = 2,
      tokensEstimated,
    } = options;

    // 1. Check Cache first
    if (cacheKey && cacheTtlMs > 0) {
      const cached = await this.readCache<T>(cacheKey);
      if (cached !== null) {
        ApiTracker.recordCall({
          service,
          endpoint: `${endpoint} [CACHE_HIT]`,
          status: 200,
          latencyMs: 1,
          cached: true,
          tokensEstimated: 0,
        });
        return cached;
      }
    }

    // 2. Check Circuit Breaker
    const now = Date.now();
    const openUntil = this.circuitOpenUntil.get(service) || 0;
    if (now < openUntil) {
      const waitSeconds = Math.ceil((openUntil - now) / 1000);
      throw new Error(`[Circuit Breaker] ${service} is temporarily resting (${waitSeconds}s cooldown).`);
    }

    // 3. Queue through concurrency pool
    return new Promise<T>((resolve, reject) => {
      const executeWithSlot = async () => {
        const startMs = Date.now();
        let attempts = 0;
        let lastError: any = null;

        // Apply rate limit delay if needed
        await this.throttleService(service);

        while (attempts <= maxRetries) {
          try {
            attempts++;
            const result = await task();
            const latencyMs = Date.now() - startMs;

            // Reset failures on success
            this.failureCounts.set(service, 0);

            // Record successful telemetry
            ApiTracker.recordCall({
              service,
              endpoint,
              status: 200,
              latencyMs,
              cached: false,
              tokensEstimated,
            });

            // Write to cache if requested
            if (cacheKey && cacheTtlMs > 0 && result !== undefined && result !== null) {
              await this.writeCache(cacheKey, result, cacheTtlMs);
            }

            resolve(result);
            return;
          } catch (err: any) {
            lastError = err;
            const statusCode = err?.response?.status || err?.status || 500;

            // If 429 (Rate Limit) or 503 (Server Busy), apply exponential backoff
            if (statusCode === 429 || statusCode >= 500) {
              const currentFailures = (this.failureCounts.get(service) || 0) + 1;
              this.failureCounts.set(service, currentFailures);

              // Trip circuit breaker if 5 consecutive severe failures
              if (currentFailures >= 5) {
                this.circuitOpenUntil.set(service, Date.now() + 30000); // 30s cooldown
              }

              if (attempts <= maxRetries) {
                // Exponential backoff with jitter
                const backoffMs = Math.pow(2, attempts) * 800 + Math.random() * 400;
                await new Promise((r) => setTimeout(r, backoffMs));
                continue;
              }
            } else {
              // 400, 401, 403 or client error: don't retry endlessly
              break;
            }
          }
        }

        const latencyMs = Date.now() - startMs;
        const finalStatus = lastError?.response?.status || lastError?.status || 500;

        // Record error telemetry
        ApiTracker.recordCall({
          service,
          endpoint: `${endpoint} [ERROR]`,
          status: finalStatus,
          latencyMs,
          cached: false,
          tokensEstimated: 0,
        });

        reject(lastError);
      };

      this.enqueueTask(executeWithSlot);
    });
  }

  private enqueueTask(taskRunner: () => Promise<void>) {
    this.queue.push({ run: taskRunner });
    this.processNext();
  }

  private async processNext() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.activeCount++;
    const nextTask = this.queue.shift();

    if (nextTask) {
      try {
        await nextTask.run();
      } finally {
        this.activeCount--;
        this.processNext();
      }
    } else {
      this.activeCount--;
    }
  }

  private async throttleService(service: ApiServiceType) {
    const limit = this.rateLimits[service] || 15;
    const windowMs = 10000;
    const now = Date.now();

    const history = this.serviceCallHistory.get(service) || [];
    const recent = history.filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      // Must wait until oldest drops out of window
      const oldest = recent[0];
      const waitMs = Math.max(100, windowMs - (now - oldest) + 50);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    recent.push(Date.now());
    this.serviceCallHistory.set(service, recent);
  }

  private async readCache<T>(key: string): Promise<T | null> {
    const now = Date.now();
    // 1. Check fast memory cache
    const mem = this.memoryCache.get(key);
    if (mem && mem.expiry > now) {
      return mem.data as T;
    }

    // 2. Check persistent storage
    try {
      const raw = await AsyncStorage.getItem(`@gateway_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiry > now) {
          this.memoryCache.set(key, parsed);
          return parsed.data as T;
        } else {
          await AsyncStorage.removeItem(`@gateway_cache_${key}`);
        }
      }
    } catch {
      // Ignore cache read error
    }
    return null;
  }

  private async writeCache(key: string, data: any, ttlMs: number) {
    const entry = { data, expiry: Date.now() + ttlMs };
    this.memoryCache.set(key, entry);
    try {
      await AsyncStorage.setItem(`@gateway_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore cache write error
    }
  }

  public getGatewayDiagnostics() {
    return {
      activeConnections: this.activeCount,
      queuedRequests: this.queue.length,
      memoryCacheEntries: this.memoryCache.size,
      maxConcurrency: this.maxConcurrency,
      circuitBreakers: Array.from(this.circuitOpenUntil.entries()).map(([service, expiry]) => ({
        service,
        isOpen: Date.now() < expiry,
        cooldownRemainingSec: Math.max(0, Math.ceil((expiry - Date.now()) / 1000)),
      })),
    };
  }
}

export const LoadBalancer = new ResilientLoadBalancer();
