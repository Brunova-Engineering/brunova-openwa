# Brunova OpenWA deployment — 2026-10-17

The WhatsApp logout evidence change and dependency updates were built from
`db591693234c710f90145ead7735068d0683315a`. The AMD64 minimal image passed
the OpenVEX gate, published-digest Trivy rescan and non-root smoke in
[run 39057719523](https://github.com/Brunova-Engineering/brunova-openwa/actions/runs/39057719523).
Its private GHCR digest is
`ghcr.io/brunova-engineering/brunova-openwa@sha256:fba5fa9dcb8a4bfa98d2853d141578e23c8c1674de3321b0d1ac543d12ab1892`.

Because the GHCR package is private and the VPS has no package credential,
[run 39058519515](https://github.com/Brunova-Engineering/brunova-openwa/actions/runs/39058519515)
exported that exact digest as a private, checksummed image artifact. The
artifact was checked after download and on the VPS, then loaded into Docker.
It was mirrored to a registry bound only to `127.0.0.1:5000`, with persistent
storage under `.deploy-state/registry-data`. The production Compose reference is
`127.0.0.1:5000/openwa@sha256:dc9c92ae7b34acd4973e7497182c0d442c1497ecaa7130b8f4af71410b1544e8`.
The local registry digest differs from the GHCR index digest because the
transport contains the AMD64 image; both references resolved to Docker image ID
`sha256:414800292b024b1b685927da2cbe928e07e6d54b8b02b54333d0b1cefbb6868a`.
Keep the loopback registry running for `compose pull` and rollback operations.

Before deployment, an encrypted online backup was created and copied off the
VPS. The two copies had the same SHA-256 checksum. With the old OpenWA container
stopped, the VPS preflight returned `GLOBAL=WARN`, with 14 passes and no failures.
The reviewed warnings were minimum RAM headroom (2048 MiB available), existing
swap use, inactive UFW and the read-only preflight's inability to test the
off-site copy. A prior encrypted archive had already passed a restore-read test.

Deployment passed `validate.sh`, pulled the pinned local digest, recreated
OpenWA and passed readiness, dashboard, API authentication, Swagger-off and MCP
smoke checks. The resulting container was healthy and its image ID matched the
mirrored digest. The host then completed a full package upgrade. An immediate
simulation showed zero upgrades remaining. The VPS was rebooted: boot ID changed
and the kernel moved from `6.8.0-138-generic` to `6.8.0-147-generic`. After
reboot, OpenWA passed the same smoke checks and remained healthy on the exact
image ID. The web and portal containers were healthy, n8n was running, and
Docker and Nginx were active.

The WhatsApp session was already logged out and awaiting QR before this release.
The new evidence fields can diagnose a future logout; they cannot recover the
missing reason for the prior event. Linked-session stability and a cross-release
rollback drill remain separate acceptance work.
