# Computer Networking Starter Site Plan

## Intended topics
1. Packet path across layered stack
2. TCP handshake and retransmission intuition
3. Congestion window behavior under loss
4. DNS + TLS setup cost in request latency
5. HTTP multiplexing and head-of-line constraints

## Key points by topic
- **Layering:** each layer adds capability and overhead; observability needs all layers.
- **Handshake:** connection setup cost matters for short-lived traffic.
- **Congestion:** throughput is bounded by RTT, loss, and cwnd behavior.
- **DNS/TLS:** first-byte latency often dominated by setup work, not payload size.
- **HTTP/2/3:** multiplexing helps but bottlenecks shift to transport and server limits.

## Starter visuals
- Animated packet stream with configurable RTT/loss.
- Handshake timeline bars (DNS/TCP/TLS/request).
- Throughput and retransmit info panels.
