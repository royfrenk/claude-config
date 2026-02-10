# API Integration Patterns Guide

Environment variables, fallback strategies, error handling, and API wrappers.

## Environment Variable Handling (From Quo - CRITICAL)

### Always .trim() and Read at Request Time

**❌ Anti-pattern: Reading at module load time**

```typescript
// Reading at module load time
const apiKey = process.env.API_KEY;
axios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
```

**Issues:**
- Whitespace bugs (trailing space causes "Invalid header")
- Serverless timing issues (env vars not ready at module load)
- No validation until first request

**✅ Correct pattern: Request-time interceptors**

```typescript
// Read at request time with trimming
axios.interceptors.request.use(config => {
  const apiKey = process.env.API_KEY?.trim();
  if (!apiKey) {
    console.error('API_KEY environment variable not configured');
    throw new Error('Server configuration error');
  }
  config.headers['Authorization'] = `Bearer ${apiKey}`;
  return config;
});
```

**Why this works:**
- Trim whitespace (prevents subtle bugs)
- Request-time reading (works in serverless)
- Explicit validation (clear error messages)

### Real-World Bug from Quo

**Incident:** Whitespace in `DATAFINITI_TOKEN` caused "Invalid header" errors

**What happened:**
1. Token copied from Vercel with trailing space
2. Module-load time reading: `const token = process.env.DATAFINITI_TOKEN`
3. Axios header: `Authorization: Bearer sk-xxxxx ` (space at end!)
4. API returned 401 Unauthorized
5. Took multiple iterations to discover whitespace

**Fix:**
```typescript
const token = process.env.DATAFINITI_TOKEN?.trim();  // Always trim!
```

**Lesson:** ALWAYS `.trim()` string environment variables.

### Centralized Config Pattern

**Standardize env var access:**

```typescript
// lib/config.ts
function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key]?.trim();
  if (required && !value) {
    console.error(`${key} environment variable not configured`);
    throw new Error(`Server configuration error: ${key} missing`);
  }
  return value ?? '';
}

export const config = {
  rapidApiKey: getEnvVar('RAPIDAPI_KEY'),
  datafinitiToken: getEnvVar('DATAFINITI_TOKEN'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  sendgridApiKey: getEnvVar('SENDGRID_API_KEY'),
  // ... all env vars centralized
};
```

**Benefits:**
- Single source of truth
- Consistent trimming and validation
- Easy to add defaults
- Type-safe access

### Vercel Environment Variables (From Quo Production Incident)

**Critical lesson:** Environment variables must be set in ALL environments (Production + Preview)

**Checklist:**
- [ ] Set in Production environment
- [ ] Set in Preview environment
- [ ] Set in Development environment (local .env)
- [ ] Documented in `.env.example`

**From Quo Sprint 010:**
- Search worked in Production
- Search FAILED in Preview (env var not set)
- User discovered during testing

**How to verify:**

```bash
# Check which environments have the variable
vercel env ls

# Should show:
# RAPIDAPI_KEY: production, preview, development
```

**How to add to all environments:**

```bash
# Interactive: select all environments with space bar
vercel env add RAPIDAPI_KEY

# Or programmatic
echo "sk-xxx" | vercel env add RAPIDAPI_KEY production preview development
```

## API Fallback Strategies (From Quo)

### Single Primary + Simple Fallback

**❌ Anti-pattern: Cross-API data matching**

```typescript
// Trying to match data from two different APIs
const rapidApiProperty = await fetchFromRapidAPI(address);
const datafinitiProperty = await fetchFromDatafiniti(address);

// Attempt complex matching by MLS number, address, etc.
if (rapidApiProperty.mlsNumber === datafinitiProperty.mlsId) {
  // Use Datafiniti images with RapidAPI data
  // Problem: MLS numbers don't match! Formats differ, IDs differ
}
```

**Issues from Quo:**
- MLS numbers don't match across APIs (different formats)
- Address formats differ ("San Bruno" vs "San Antonio, TX")
- <20% success rate for matching
- Complex, fragile code

**✅ Correct pattern: Primary + simple fallback**

```typescript
let property;
try {
  property = await fetchFromRapidAPI(address); // Primary
} catch (error) {
  console.warn('RapidAPI failed, using Datafiniti fallback');
  property = await fetchFromDatafiniti(address); // Fallback
}

// Accept placeholder images if needed
if (!property.images || property.images.length === 0) {
  property.images = [{ url: PLACEHOLDER_IMAGE, label: 'MOCK IMAGE' }];
}
```

**Benefits:**
- Simple architecture (no complex matching)
- Reliable fallback (if primary fails)
- Transparent about placeholders (good UX)

### Why Cross-API Matching Fails

**From Quo Sprint 003:**

1. **MLS numbers differ:**
   - RapidAPI: `"mls": "12345678"`
   - Datafiniti: `"mlsId": "ABC-12345678"`

2. **Address formats differ:**
   - RapidAPI: `"address": "123 Main St, San Bruno, CA 94066"`
   - Datafiniti: `"address": "123 Main Street, San Antonio, TX 78201"`

3. **Query syntax issues:**
   - Datafiniti substring matching: `city:san bruno` matches "San Antonio"
   - Required exact match: `city:"san bruno"`

**Final decision:** Abandoned cross-API matching. Use RapidAPI-first, Datafiniti fallback.

### Fallback Architecture

```typescript
// Standardized fallback wrapper
async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  defaultValue?: T
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    console.warn('Primary API failed:', primaryError);
    try {
      return await fallback();
    } catch (fallbackError) {
      console.error('Fallback API failed:', fallbackError);
      if (defaultValue) {
        return defaultValue;
      }
      throw new Error('All APIs failed');
    }
  }
}

// Usage
const property = await fetchWithFallback(
  () => fetchFromRapidAPI(query),
  () => fetchFromDatafiniti(query),
  { /* default property */ }
);
```

## Error Handling

### Graceful Degradation

**From Quo:** APIs fail. Design for it.

**Pattern:**

```typescript
async function fetchProperty(id: string) {
  try {
    // Try primary API
    return await primaryAPI.fetch(id);
  } catch (error) {
    console.error('Primary API failed:', error);

    try {
      // Try fallback API
      return await fallbackAPI.fetch(id);
    } catch (fallbackError) {
      console.error('Fallback API failed:', fallbackError);

      // Return graceful error
      throw new Error('Property data temporarily unavailable. Please try again later.');
    }
  }
}
```

**Key points:**
- Log errors (for debugging)
- Try fallback before failing
- User-friendly error messages (don't leak internals)

### Error Message Best Practices

**❌ Bad: Leak internal details**

```typescript
catch (error) {
  return { error: error.stack }  // Exposes code, API keys, paths
}
```

**✅ Good: User-friendly + logged details**

```typescript
catch (error) {
  console.error('Internal error:', error)  // Log for debugging
  return { error: 'Something went wrong. Please try again.' }  // User sees this
}
```

### Retry with Exponential Backoff

**For transient failures:**

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;  // Last attempt failed
      }
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should not reach here');
}

// Usage
const property = await fetchWithRetry(() => fetchFromAPI(id));
```

## API Query Syntax (From Quo)

### Exact Match vs Substring Match

**Issue from Quo:** Datafiniti substring matching caused wrong results

**Problem:**
```typescript
// Query: city:san bruno
// Expected: San Bruno, CA
// Actual: San Antonio, TX (substring match!)
```

**Solution: Use quotes for exact matching**

```typescript
// ❌ Wrong: Substring matching
const query = `city:${cityName}`;  // Matches any city containing substring

// ✅ Correct: Exact matching with quotes
const query = `city:"${cityName}"`;  // Only matches exact city name
```

**Lesson:** Always read API documentation for query syntax. Default behavior may not match expectations.

## Rate Limiting

### Respect API Rate Limits

**Pattern:**

```typescript
import Bottleneck from 'bottleneck';

// Limit to 10 requests per second
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100,  // 100ms between requests = 10 req/s
});

// Wrap API calls
const fetchProperty = limiter.wrap(async (id: string) => {
  return await api.fetch(id);
});
```

### Circuit Breaker

**Stop calling failing APIs:**

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000;  // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Circuit open: stop calling API
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure < this.timeout) {
        throw new Error('Circuit breaker open');
      }
      // Reset after timeout
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.failures = 0;  // Success: reset
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      throw error;
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
const property = await breaker.execute(() => fetchFromAPI(id));
```

## Email Service Integration (From Quo Sprint 007)

### Test Mode Limitations

**Critical lesson from Quo:** Email service test mode can block real use cases.

**Issue:**
- Resend test mode only sends to verified emails
- Attempted to send to unverified email (QuoDemoLeads@gmail.com)
- Failed silently (no error, but email not sent)
- Dual-email test failed (ALL recipients must be verified)

**Solution:**
1. Use production mode for staging/production
2. Test with actual intended recipients BEFORE deploying
3. Verify sender email in service provider console
4. Have fallback service (Quo migrated to SendGrid)

### Email Service Checklist

**Before production:**
- [ ] Verify sender email in service provider console
- [ ] Test with actual intended recipients (not just verified test accounts)
- [ ] Have fallback service or console logging for local dev
- [ ] Document email service limitations in setup docs

### Development vs Production

**Local development:**

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Email would be sent:', { from, to, subject });
  return { success: true, id: 'dev-mock-id' };
}
```

**Production:**

```typescript
const result = await sendgrid.send({
  from: 'noreply@quoify.com',  // Verified in SendGrid
  to: recipientEmail,
  subject: 'Rebate Claim',
  html: emailHtml,
});
```

## See Also

- Security rules: `~/.claude/rules/security.md` (Secret management)
- Database patterns: `~/.claude/guides/database-patterns.md` (Caching strategies)
- Code performance: `~/.claude/guides/code-performance.md` (API scaling)
