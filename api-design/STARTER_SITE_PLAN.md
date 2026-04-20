# API Design Starter Site Plan

## Intended topics
1. REST vs GraphQL request shape trade-offs
2. Versioning and compatibility windows
3. Rate limiting algorithms (fixed window, token bucket)
4. Caching + stale data behavior
5. Auth/token lifecycle and webhook signatures

## Key points by topic
- **REST vs GraphQL:** over-fetch vs under-fetch, schema evolution, operational complexity.
- **Versioning:** additive change first, deprecation timelines, contract tests for consumers.
- **Rate limiting:** burst vs sustained throughput; fairness and retry headers.
- **Caching:** cache key design, invalidation paths, staleness budgets.
- **Auth + webhooks:** token scope, rotation, replay protection, signature verification.

## Starter visuals
- Endpoint throughput animation with limit bucket depletion/refill.
- Response-time panel comparing cache hit/miss and schema shape choices.
- Info panels summarizing practical production defaults.
