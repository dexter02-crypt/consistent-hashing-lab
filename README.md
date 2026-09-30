# Consistent Hashing Lab

Interactive browser experiment comparing modulo placement with a weighted virtual-node consistent-hash ring.

**Live demo:** https://dexter02-crypt.github.io/consistent-hashing-lab/

## v1.1 experiments

- weighted nodes
- configurable virtual-node density
- membership churn by adding or removing several nodes
- key-remapping comparison against ordinary modulo hashing
- per-node observed share versus configured weight target
- max/min load ratio and coefficient of variation
- deterministic 10k–100k key experiments
- browser-side timing
- JSON experiment export

The implementation uses FNV-1a as a compact deterministic teaching hash. It is not collision-resistant and is not suitable for cryptographic use.

## Run

```bash
python3 serve.py
```

## Test

```bash
npm test
```

No runtime package installation is required.

## Scope

This is an educational systems model. It is not a production load balancer, service-discovery system, storage cluster, or benchmark of a deployed distributed system. Browser timing is illustrative and depends on the device.

## License

MIT. Maintainer: Shikhar Singh.
