# Use Ubuntu-based golang to match fluent-bit's GLIBC
FROM golang:1.19-bullseye AS builder

WORKDIR /go/src/github.com/majst01/fluent-bit-go-redis-output/

COPY .git Makefile go.* *.go /go/src/github.com/majst01/fluent-bit-go-redis-output/

# Build the plugin
RUN make

# Use fluent-bit 1.9 which has better compatibility
FROM fluent/fluent-bit:1.9

COPY --from=builder /go/src/github.com/majst01/fluent-bit-go-redis-output/out_redis.so /fluent-bit/bin/
COPY *.conf /fluent-bit/etc/

CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/etc/fluent-bit.conf", "-e", "/fluent-bit/bin/out_redis.so"]