export function hash32(text, seed = 2166136261) {
  let h = seed >>> 0;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function validateNodes(nodes) {
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > 64) throw new Error("nodes");
  const clean = nodes.map(x => String(x).trim());
  if (clean.some(x => !x || x.length > 64)) throw new Error("node-name");
  if (new Set(clean).size !== clean.length) throw new Error("duplicate-node");
  return clean;
}

export function buildRing(nodes, virtualNodes = 64) {
  nodes = validateNodes(nodes);
  if (!Number.isInteger(virtualNodes) || virtualNodes < 1 || virtualNodes > 512) throw new Error("virtualNodes");
  const ring = [];
  for (const node of nodes) {
    for (let i = 0; i < virtualNodes; i++) {
      ring.push({point: hash32(`${node}#${i}`), node});
    }
  }
  ring.sort((a,b) => a.point - b.point || a.node.localeCompare(b.node));
  return ring;
}

export function assignConsistent(keys, nodes, virtualNodes = 64) {
  if (!Array.isArray(keys) || keys.length > 100000) throw new Error("keys");
  const ring = buildRing(nodes, virtualNodes);
  const out = new Map();
  for (const key of keys) {
    const h = hash32(key);
    let lo=0, hi=ring.length;
    while (lo < hi) {
      const mid=(lo+hi)>>1;
      if (ring[mid].point < h) lo=mid+1; else hi=mid;
    }
    out.set(String(key), ring[lo === ring.length ? 0 : lo].node);
  }
  return out;
}

export function assignModulo(keys, nodes) {
  nodes = validateNodes(nodes);
  if (!Array.isArray(keys) || keys.length > 100000) throw new Error("keys");
  const out = new Map();
  for (const key of keys) out.set(String(key), nodes[hash32(key) % nodes.length]);
  return out;
}

export function compareAssignments(before, after) {
  let compared=0, moved=0;
  for (const [key,node] of before) {
    if (!after.has(key)) continue;
    compared++;
    if (after.get(key) !== node) moved++;
  }
  return {compared, moved, fraction: compared ? moved/compared : 0};
}

export function distribution(assignments, nodes) {
  const result = Object.fromEntries(validateNodes(nodes).map(n=>[n,0]));
  for (const node of assignments.values()) if (node in result) result[node]++;
  return result;
}

export function makeKeys(n=1000) {
  if (!Number.isInteger(n) || n < 1 || n > 100000) throw new Error("count");
  return Array.from({length:n}, (_,i)=>`key-${String(i+1).padStart(5,"0")}`);
}
