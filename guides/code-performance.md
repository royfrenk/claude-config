# Code Performance Guide

Patterns for database queries, frontend rendering, and caching.

## Database Optimization

### N+1 Query Prevention

**❌ Wrong: N+1 Query**
```python
# Fetches users, then makes one query per user for orders
for user in users:
    orders = get_orders(user.id)  # Query per user!
    print(f"{user.name}: {len(orders)} orders")
```

**✅ Correct: Single Query with Join**
```python
# Fetch users with orders in one query
users_with_orders = get_users_with_orders()
for user in users_with_orders:
    print(f"{user.name}: {len(user.orders)} orders")
```

### Indexing Strategy (From Quo)

**Proactive indexing:**

```prisma
model Property {
  id        String   @id
  city      String
  state     String
  zip       String?
  expiresAt DateTime

  @@index([city, state])  // Common query: search by city/state
  @@index([zip])           // Filter by zip
  @@index([expiresAt])     // Cleanup expired entries
}
```

**When to add indexes:**
- All frequently queried fields
- Foreign keys (for joins)
- Fields used in WHERE clauses
- Fields used in ORDER BY

**Performance impact (from Quo):**
- Before indexing: 2-3s (external API calls)
- After indexing: <500ms (DB cache with indexes)

### Query Optimization

**Use connection pooling:**
```typescript
// Use Prisma's connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Pooled connection
    },
  },
})
```

**Limit result sets:**
```typescript
// Don't fetch everything
const properties = await prisma.property.findMany({
  take: 20,  // Limit to 20 results
  skip: page * 20,  // Pagination
  where: { city: 'Sacramento' },
})
```

**Select only needed fields:**
```typescript
// Don't select * when you only need a few fields
const properties = await prisma.property.findMany({
  select: {
    id: true,
    address: true,
    price: true,
    // Don't fetch images, description, etc. if not needed
  },
})
```

## Caching Strategy

### Two-Tier Caching (From Quo)

**Architecture:**
1. **Server:** PostgreSQL (<500ms cached searches)
2. **Client:** SWR hook (0ms perceived latency on repeat)
3. **Fallback:** External APIs on cache miss

**Implementation:**

```typescript
// Server-side: PostgreSQL cache with expiration
async function searchProperties(query: string) {
  // Check cache first
  const cached = await prisma.property.findMany({
    where: {
      city: query,
      expiresAt: { gte: new Date() },  // Not expired
    },
  })

  if (cached.length > 0) {
    return cached  // <500ms
  }

  // Cache miss: fetch from external API
  const properties = await fetchFromExternalAPI(query)

  // Store in cache with 7-day expiration
  await prisma.property.createMany({
    data: properties.map(p => ({
      ...p,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })),
  })

  return properties
}
```

```typescript
// Client-side: SWR for 0ms repeat searches
import useSWR from 'swr'

function SearchResults({ query }) {
  const { data, error } = useSWR(
    `/api/property/search?q=${query}`,
    fetcher,
    {
      revalidateOnFocus: false,  // Don't refetch on tab focus
      dedupingInterval: 60000,   // Dedupe requests within 1 minute
    }
  )

  // First request: 500ms (server cache)
  // Repeat request: 0ms (SWR cache)
}
```

### Why PostgreSQL over Redis? (From Quo)

**Reasons:**
- Already using PostgreSQL for other data (users, searches)
- Persistent cache (survives restarts, unlike Redis unless configured)
- Easy Prisma integration (type-safe queries)
- Can query with SQL for analytics

**Trade-off:**
- ✅ Simplicity (one database, not two)
- ✅ Persistence (survives restarts)
- ✅ Queryable (SQL analytics)
- ⚠️ Slightly slower than Redis (but <500ms is good enough)

**When to use Redis:**
- Need <50ms response times
- Extremely high request volume (>1M requests/month)
- Complex caching patterns (LRU eviction, TTL)

### Cache Expiration Strategy (From Quo)

**7-day expiration:**
- Real estate listings change frequently
- 7 days balances freshness vs API call reduction
- Daily cron job keeps data reasonably current

**Trade-offs:**
- ✅ Fresh data (updated weekly)
- ✅ Reduced API calls (save money)
- ⚠️ Some data may be stale (up to 7 days old)

**Consider adding manual refresh:**
```typescript
// Allow users to force refresh
async function refreshProperty(id: string) {
  await prisma.property.delete({ where: { id } })  // Clear cache
  return await fetchFromExternalAPI(id)  // Re-fetch
}
```

## Frontend Performance

### Avoid Unnecessary Re-renders

**❌ Wrong: New Object Every Render**
```typescript
function Component() {
  return <ChildComponent style={{ margin: 10 }} />
  // Creates new object every render → ChildComponent re-renders unnecessarily
}
```

**✅ Correct: Stable Reference**
```typescript
function Component() {
  const style = useMemo(() => ({ margin: 10 }), [])
  return <ChildComponent style={style} />
  // Same object every render → ChildComponent doesn't re-render
}
```

### Memoize Expensive Calculations

```typescript
function PropertyList({ properties }) {
  // ❌ Wrong: Recalculates on every render
  const avgPrice = properties.reduce((sum, p) => sum + p.price, 0) / properties.length

  // ✅ Correct: Only recalculates when properties change
  const avgPrice = useMemo(() => {
    return properties.reduce((sum, p) => sum + p.price, 0) / properties.length
  }, [properties])

  return <div>Average: ${avgPrice}</div>
}
```

### Use React.memo for Pure Components

```typescript
// Component only re-renders when props change
const PropertyCard = React.memo(({ property }) => {
  return (
    <div>
      <h3>{property.address}</h3>
      <p>${property.price}</p>
    </div>
  )
})
```

### Virtualize Long Lists

For lists with 100+ items, use virtualization:

```typescript
import { FixedSizeList } from 'react-window'

function PropertyList({ properties }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={properties.length}
      itemSize={100}
      width="100%"
    >
      {({ index, style }) => (
        <PropertyCard key={properties[index].id} property={properties[index]} style={style} />
      )}
    </FixedSizeList>
  )
}
```

## Scaling Considerations

### Database Scaling (When >10K Properties)

**Current architecture supports ~10K properties efficiently.**

For 100K+ properties:
- [ ] Index optimization (composite indexes on common query patterns)
- [ ] Query optimization (pagination with cursor-based navigation)
- [ ] Redis hot cache layer (top 1000 most-searched properties)
- [ ] Partitioning strategy (by state or region)
- [ ] Read replicas for search queries

### API Scaling (When >1M Requests/Month)

**Current architecture supports ~100K requests/month.**

For 1M+ requests:
- [ ] Rate limit management (queues, circuit breaker)
- [ ] Caching layer (Redis or Cloudflare CDN)
- [ ] Dedicated sync workers (background jobs with Bull/BullMQ)
- [ ] Regional edge caching (Vercel Edge Functions)
- [ ] CDN for property images (Cloudflare Images or Imgix)

### Search Performance Targets

**Target:** <500ms for cached, 0ms for SWR
**Current (Quo):** Meets target ✅

**Monitor as property count grows:**
- [ ] Database query performance (Neon dashboard)
- [ ] API response times (monitoring service)
- [ ] Cache hit rate (should be >80%)

## See Also

- Context efficiency: `~/.claude/rules/performance.md`
- Database patterns: `~/.claude/guides/database-patterns.md`
