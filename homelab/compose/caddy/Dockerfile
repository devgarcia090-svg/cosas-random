# La imagen oficial de Caddy no incluye los módulos de DNS, y sin uno de ellos
# no se puede resolver el reto ACME por DNS-01 (el que permite obtener
# certificados sin exponer la máquina a internet). Así que la construimos.
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/cloudflare

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
