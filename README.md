# Consistent Hashing Lab

Interactive browser experiment comparing ordinary modulo placement with a virtual-node consistent-hash ring.

## What it demonstrates

- deterministic key hashing and ring placement
- virtual nodes
- binary search for the next clockwise owner
- distribution across active nodes
- key remapping when membership changes
- a direct comparison with modulo hashing

This is an educational systems model, not a production load balancer or a cryptographic implementation.

## Run

```bash
python3 serve.py
```

or open `index.html` through any local static server.

## Test

```bash
npm test
```

The project has no runtime package dependencies.

## Hash choice

The implementation uses FNV-1a as a small deterministic teaching hash. It is not collision-resistant and must not be used for security-sensitive hashing.

## License

MIT. Maintainer: Shikhar Singh.
