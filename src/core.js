export function hash32(text, seed = 2166136261) {
  let h = seed >>> 0;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function normalizeNodes(nodes) {
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > 64) throw new Error("nodes");
  const clean = nodes.map((node) => {
    const obj = typeof node === "string" ? { name: node, weight: 1 } : node;
    const name = String(obj?.name ?? "").trim();
    const weight = Number(obj?.weight ?? 1);
    if (!name || name.length > 64) throw new Error("node-name");
    if (!Number.isFinite(weight) || weight <= 0 || weight > 16) throw new Error("node-weight");
    return { name, weight };
  });
  if (new Set(clean.map(x => x.name)).size !== clean.length) throw new Error("duplicate-node");
  return clean;
}

export function buildRing(nodes, virtualNodes = 64) {
  const clean = normalizeNodes(nodes);
  if (!Number.isInteger(virtualNodes) || virtualNodes < 1 || virtualNodes > 1024) throw new Error("virtualNodes");
  const ring = [];
  for (const node of clean) {
    const replicas = Math.max(1, Math.round(virtualNodes * node.weight));
    for (let i = 0; i < replicas; i++) {
      ring.push({ point: hash32(`${node.name}#${i}`), node: node.name, replica: i });
    }
  }
  ring.sort((a, b) => a.point - b.point || a.node.localeCompare(b.node) || a.replica - b.replica);
  return ring;
}

function ringOwner(ring, h) {
  let lo = 0, hi = ring.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ring[mid].point < h) lo = mid + 1;
    else hi = mid;
  }
  return ring[lo === ring.length ? 0 : lo].node;
}

export function assignConsistent(keys, nodes, virtualNodes = 64) {
  if (!Array.isArray(keys) || keys.length > 100000) throw new Error("keys");
  const ring = buildRing(nodes, virtualNodes);
  return new Map(keys.map(key => [String(key), ringOwner(ring, hash32(key))]));
}

export function assignModulo(keys, nodes) {
  const clean = normalizeNodes(nodes);
  if (!Array.isArray(keys) || keys.length > 100000) throw new Error("keys");
  return new Map(keys.map(key => [String(key), clean[hash32(key) % clean.length].name]));
}

export function compareAssignments(before, after) {
  let compared = 0, moved = 0;
  for (const [key, node] of before) {
    if (!after.has(key)) continue;
    compared++;
    if (after.get(key) !== node) moved++;
  }
  return { compared, moved, fraction: compared ? moved / compared : 0 };
}

export function distribution(assignments, nodes) {
  const clean = normalizeNodes(nodes);
  const result = Object.fromEntries(clean.map(n => [n.name, 0]));
  for (const node of assignments.values()) if (node in result) result[node]++;
  return result;
}

export function distributionStats(assignments, nodes) {
  const clean = normalizeNodes(nodes);
  const counts = distribution(assignments, clean);
  const values = Object.values(counts);
  const total = values.reduce((a, b) => a + b, 0);
  const mean = total / values.length;
  const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const nonzero = values.filter(x => x > 0);
  const max = Math.max(...values), min = Math.min(...values);
  const maxMinRatio = min === 0 ? Infinity : max / min;
  const totalWeight = clean.reduce((s, n) => s + n.weight, 0);
  const targets = Object.fromEntries(clean.map(n => [n.name, n.weight / totalWeight]));
  const maxTargetDeviation = total
    ? Math.max(...clean.map(n => Math.abs(counts[n.name] / total - targets[n.name])))
    : 0;
  return {
    counts, total, mean, stddev,
    coefficientOfVariation: mean ? stddev / mean : 0,
    maxMinRatio,
    maxTargetDeviation,
    targets,
  };
}

export function makeKeys(n = 1000, prefix = "key") {
  if (!Number.isInteger(n) || n < 1 || n > 100000) throw new Error("count");
  return Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(6, "0")}`);
}

export function runComparison({ keys, baselineNodes, currentNodes, virtualNodes = 64 }) {
  const beforeConsistent = assignConsistent(keys, baselineNodes, virtualNodes);
  const afterConsistent = assignConsistent(keys, currentNodes, virtualNodes);
  const beforeModulo = assignModulo(keys, baselineNodes);
  const afterModulo = assignModulo(keys, currentNodes);
  return {
    consistent: compareAssignments(beforeConsistent, afterConsistent),
    modulo: compareAssignments(beforeModulo, afterModulo),
    distribution: distributionStats(afterConsistent, currentNodes),
  };
}

export function applyChurn(nodes, delta, prefix = "churn") {
  const clean = normalizeNodes(nodes);
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 16) throw new Error("churn");
  if (delta < 0) {
    if (clean.length + delta < 1) throw new Error("churn-removes-all");
    return clean.slice(0, clean.length + delta);
  }
  const names = new Set(clean.map(n => n.name));
  const out = clean.map(n => ({ ...n }));
  let i = 1;
  while (out.length < clean.length + delta) {
    const name = `${prefix}-${i++}`;
    if (!names.has(name)) {
      names.add(name);
      out.push({ name, weight: 1 });
    }
  }
  if (out.length > 64) throw new Error("nodes");
  return out;
}
