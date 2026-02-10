# Database Patterns Guide

Best practices for schema design, caching, migrations, and scaling.

## Schema Design

### Indexing for Performance

**From Quo:** Add indexes for all frequently queried fields

```prisma
model Property {
  id        String   @id @default(cuid())
  city      String
  state     String
  zip       String?
  price     Int
  expiresAt DateTime

  @@index([city, state])  // Composite index for common query
  @@index([zip])           // Used in WHERE clause
  @@index([expiresAt])     // Used for cleanup queries
  @@index([price])         // Used in ORDER BY
}
```

**Performance impact:**
- Before: 2-3s (external API)
- After: <500ms (DB cache with indexes)

**When to add indexes:**
- All frequently queried fields
- Foreign keys (for joins)
- Fields used in WHERE clauses
- Fields used in ORDER BY
- Composite indexes for common query patterns

**Index maintenance:**
- Monitor slow queries (Neon dashboard, pg_stat_statements)
- Add indexes proactively, not reactively
- Don't over-index (each index slows down writes)

### SQL.js in Production (Anti-Pattern from Expensinator)

**❌ Don't use SQL.js for production:**
- In-memory database (data lost on restart)
- No concurrent access
- Performance issues at scale
- lastInsertRowid gotchas (not thread-safe)

**✅ Use PostgreSQL from start:**
- Persistent storage
- Battle-tested at scale
- Full SQL feature set
- Easy Prisma integration
- Free tier available (Neon, Supabase)

**Migration path if you started with SQL.js:**
1. Set up PostgreSQL (Neon or Supabase)
2. Export data from SQL.js to JSON
3. Write migration script to import into PostgreSQL
4. Update connection string
5. Test thoroughly (data types may differ)

### Choose Production-Ready Tools from Start

**Principle (from Expensinator):** Don't use "good enough for now" tools that need migration later.

**Examples:**
- ❌ SQL.js → ✅ PostgreSQL
- ❌ LocalStorage → ✅ Database
- ❌ Mock data → ✅ Real API (even if rate-limited)

**Trade-off:**
- ⚠️ Slower initial setup (PostgreSQL vs SQL.js)
- ✅ No migration pain later
- ✅ Production-ready from day 1

## Caching Strategy

### Two-Tier Caching (From Quo)

**Architecture:**
1. Server: PostgreSQL (<500ms cached searches)
2. Client: SWR hook (0ms perceived latency on repeat)
3. Fallback: External APIs on cache miss

**Implementation:**

```typescript
// 1. Check DB cache
const cached = await prisma.property.findMany({
  where: {
    city: query,
    expiresAt: { gte: new Date() },  // Not expired
  },
})

if (cached.length > 0) {
  return cached  // <500ms
}

// 2. Cache miss: fetch from external API
const properties = await fetchFromExternalAPI(query)

// 3. Store in cache with 7-day expiration
await prisma.property.createMany({
  data: properties.map(p => ({
    ...p,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })),
})

return properties
```

### 7-Day Cache Expiration (From Quo)

**Rationale:**
- Real estate listings change frequently (price drops, status changes)
- 7 days balances freshness vs API call reduction
- Daily cron job keeps data reasonably current

**Trade-offs:**
- ✅ Fresh data (updated weekly)
- ✅ Reduced API calls (save money)
- ⚠️ Some data may be stale (up to 7 days old)

**Adjust based on your domain:**
- Stock prices: 1 minute
- Weather: 1 hour
- Real estate: 7 days
- Static content: 30 days

### Cache Invalidation Strategies

**1. TTL-based (from Quo):**
```typescript
expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```

**2. Manual invalidation:**
```typescript
async function invalidateCache(city: string) {
  await prisma.property.deleteMany({
    where: { city },
  })
}
```

**3. Event-based invalidation:**
```typescript
// When property updated in external system
webhookHandler(async (event) => {
  if (event.type === 'property.updated') {
    await prisma.property.delete({
      where: { id: event.propertyId },
    })
  }
})
```

## Migration Strategies

### When Scaling to >10K Records (From Quo)

**Current:** 1,964 cached properties across 45 cities (works well)

**For 100K+ properties:**

1. **Index optimization:**
   - Composite indexes on common query patterns
   - Partial indexes for filtered queries

2. **Query optimization:**
   - Pagination with cursor-based navigation
   - Limit result sets (don't fetch everything)

3. **Redis hot cache layer:**
   - Cache top 1000 most-searched properties in Redis
   - PostgreSQL for everything else

4. **Partitioning strategy:**
   - Partition by state or region
   - Improves query performance for large tables

5. **Read replicas:**
   - Use read replicas for search queries
   - Write to primary, read from replicas

### Migration Best Practices

**1. Write migrations, don't manual edit:**
```bash
# Good: Version-controlled migration
npx prisma migrate dev --name add_property_index

# Bad: Manual SQL in production
psql -c "CREATE INDEX idx_city ON properties(city);"
```

**2. Test migrations on staging first:**
```bash
# Apply to staging
DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy

# Verify it works
# Then apply to production
DATABASE_URL=$PROD_DB_URL npx prisma migrate deploy
```

**3. Make migrations reversible:**
```sql
-- Up migration
CREATE INDEX idx_city ON properties(city);

-- Down migration (in separate file)
DROP INDEX idx_city;
```

**4. Monitor migration performance:**
- Large tables may take minutes to index
- Use `CREATE INDEX CONCURRENTLY` (PostgreSQL) to avoid locking

## Connection Management

### Connection Pooling

**Use pooled connections for serverless:**

```typescript
// DATABASE_URL: pooled connection (Neon, Supabase)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,  // Pooled
    },
  },
})
```

**Use direct connection for migrations:**

```bash
# DATABASE_URL_UNPOOLED: direct connection
DATABASE_URL=$DATABASE_URL_UNPOOLED npx prisma migrate deploy
```

**Why:**
- Serverless functions need pooling (short-lived connections)
- Migrations need direct connection (long-running operations)

### Connection Limits

**Watch for "too many connections" errors:**

```typescript
// Limit Prisma connection pool size
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Limit concurrent connections
  connectionLimit: 10,
})
```

**Free tier limits:**
- Neon: 100 connections
- Supabase: 100 connections
- Railway PostgreSQL: 100 connections

## Monitoring & Debugging

### Slow Query Monitoring

**Enable slow query logging:**

```sql
-- PostgreSQL: Log queries slower than 1 second
ALTER DATABASE mydb SET log_min_duration_statement = 1000;
```

**Check slow queries:**

```sql
-- Top 10 slowest queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Query Explain Plans

**Analyze query performance:**

```sql
EXPLAIN ANALYZE
SELECT * FROM properties
WHERE city = 'Sacramento' AND state = 'CA'
ORDER BY price DESC
LIMIT 20;
```

**Look for:**
- Seq Scan (bad) → add index
- Index Scan (good)
- High execution time → optimize query

## See Also

- Code performance: `~/.claude/guides/code-performance.md`
- Caching strategies: `~/.claude/guides/code-performance.md` (Two-Tier Caching section)
