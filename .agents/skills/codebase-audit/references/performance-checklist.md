# Performance & Architecture Checklist

The governing question for every item here is: **is this choice appropriate for the system's actual (or clearly intended) scale?** Flag mismatches in both directions — over-engineering (unneeded complexity, premature microservices, distributed systems for a problem that fits on one box) is also an architecture finding, not just under-engineering.

## 1. Algorithmic complexity & data structures

- Any nested loops or repeated linear scans over data that will grow with usage (O(n²) or worse on a collection that isn't bounded small)?
- Right data structure for the access pattern — e.g. list lookups where a set/dict/index would turn O(n) into O(1), or vice versa unnecessary complexity where a plain list is enough?
- Any obviously redundant recomputation that could be cached or memoized within a single request/operation?

## 2. Data access (database/storage)

- **N+1 queries**: does a loop over results trigger one query per item instead of a single batched/joined query? This is the single most common real-world performance bug — look for it specifically in any code that iterates over a fetched collection and then fetches related data per item.
- Are the columns/fields actually used indexed appropriately for the queries run against them? (Infer from query patterns even without direct DB access — WHERE/JOIN/ORDER BY columns without an obvious index defined nearby are worth flagging.)
- Pagination: do endpoints/queries that could return unbounded result sets have a limit, or can a single request pull an entire table?
- Are transactions scoped appropriately — not so broad they hold locks longer than needed, not so narrow that related writes can end up inconsistent?
- Connection pooling: is the app opening a new DB/HTTP connection per request instead of reusing a pool?

## 3. Caching

- Is there caching where the same expensive computation or fetch happens repeatedly with the same inputs (in-memory, Redis, HTTP cache headers, CDN)?
- If caching exists, is invalidation handled correctly, or is there a risk of serving stale/incorrect data after a write? (A cache with no invalidation story is itself a finding.)
- Is caching used somewhere it shouldn't be — masking a correctness issue, or caching data that must always be fresh (e.g. permission checks, balances)?

## 4. Concurrency & async

- Blocking I/O (network/disk calls) inside a hot path that's otherwise async/event-loop based — does it block the whole loop?
- Shared mutable state accessed from multiple threads/workers/requests without synchronization — race condition risk?
- Are expensive/slow operations (email sending, image processing, report generation) done synchronously in the request path instead of offloaded to a background job/queue?
- Retry logic on external calls: present, and does it have backoff, or will it hammer a failing dependency?

## 5. Resource management

- Are file handles, DB connections, network sockets reliably closed/released (context managers, try/finally, `defer`, RAII) even on the error path?
- Memory: any pattern that loads an entire large file/dataset into memory where streaming would do (e.g. reading a huge CSV fully into a list instead of iterating)?
- Timeouts: do outbound calls to other services have a timeout set, or can one slow dependency hang the whole request indefinitely?

## 6. Scalability vs. actual need

- Does the architecture match the stated or inferable scale? A few concrete smells to look for either direction:
  - **Under-built**: a single global lock or singleton that will serialize all traffic once there's more than one concurrent user; state held only in process memory in an app that will run multiple instances; no pagination on a dataset that will clearly grow unbounded.
  - **Over-built**: a message queue/event bus wiring together two services that only ever talk to each other; a microservice split with no clear ownership boundary; premature sharding/multi-region setup for an app with no users yet.
- Are there any single points of failure that a moderately scaled version of this system couldn't tolerate (one instance, no replicas, no failover for a dependency the whole app needs)?
- Build/deploy performance counts too if relevant: unnecessarily slow CI, huge unoptimized bundle sizes shipped to end users, missing build caching.

## Severity guide

- **Critical**: will cause an outage or unusable latency at the system's realistic near-term scale (e.g. an N+1 query on the single most-hit endpoint that will 10x DB load as users grow modestly).
- **High**: a clear, specific bottleneck or scalability cliff that's likely to bite soon, even if it's fine today.
- **Medium**: a real inefficiency worth fixing, but with a clear workaround or long runway before it matters.
- **Low**: a best-practice deviation or minor inefficiency with negligible real-world impact at current or reasonably foreseeable scale.
