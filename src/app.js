import {
  buildRing, assignConsistent, assignModulo, compareAssignments,
  distributionStats, makeKeys, normalizeNodes, applyChurn
} from "./core.js";

const $ = s => document.querySelector(s);
let nodes = [
  {name:"alpha", weight:1}, {name:"bravo", weight:1},
  {name:"charlie", weight:1}, {name:"delta", weight:1},
];
let baseline = nodes.map(x => ({...x}));
let lastReport = null;

function colorFor(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 75% 68%)`;
}
function download(name, value) {
  const blob = new Blob([JSON.stringify(value, null, 2) + "\n"], {type:"application/json"});
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function keyCount() {
  return Math.max(10, Math.min(100000, Number($("#keys").value) || 10000));
}
function replicas() {
  return Math.max(1, Math.min(1024, Number($("#vn").value) || 64));
}
function benchmark() {
  const keys = makeKeys(keyCount());
  const vn = replicas();
  const t0 = performance.now();
  const afterC = assignConsistent(keys, nodes, vn);
  const consistentMs = performance.now() - t0;
  const t1 = performance.now();
  assignModulo(keys, nodes);
  const moduloMs = performance.now() - t1;
  return { consistentMs, moduloMs, stats: distributionStats(afterC, nodes) };
}
function render() {
  const count = keyCount(), vn = replicas(), keys = makeKeys(count);
  const beforeC = assignConsistent(keys, baseline, vn);
  const afterC = assignConsistent(keys, nodes, vn);
  const beforeM = assignModulo(keys, baseline);
  const afterM = assignModulo(keys, nodes);
  const c = compareAssignments(beforeC, afterC);
  const m = compareAssignments(beforeM, afterM);
  const stats = distributionStats(afterC, nodes);

  $("#consistent").textContent = `${(c.fraction*100).toFixed(1)}%`;
  $("#modulo").textContent = `${(m.fraction*100).toFixed(1)}%`;
  $("#imbalance").textContent = stats.maxMinRatio === Infinity ? "∞" : stats.maxMinRatio.toFixed(2);
  $("#cv").textContent = stats.coefficientOfVariation.toFixed(3);
  $("#nodeCount").textContent = nodes.length;
  $("#nodes").innerHTML = nodes.map(n => `<span class="pill">${n.name} ×${n.weight}</span>`.replace(":g","")).join(" ");
  $("#table").innerHTML = normalizeNodes(nodes).map(n => {
    const v = stats.counts[n.name], target = stats.targets[n.name];
    return `<tr><td>${n.name}</td><td>${n.weight}</td><td>${v}</td><td>${(100*v/count).toFixed(1)}%</td><td>${(100*target).toFixed(1)}%</td></tr>`;
  }).join("");

  const ring = buildRing(nodes, vn);
  const stride = Math.max(1, Math.floor(ring.length / 120));
  const sample = ring.filter((_,i) => i % stride === 0).slice(0,120);
  const pts = sample.map(x => {
    const a = (x.point / 2**32) * Math.PI * 2 - Math.PI/2;
    const cx = 250 + 190*Math.cos(a), cy = 250 + 190*Math.sin(a);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.2" fill="${colorFor(x.node)}"><title>${x.node}</title></circle>`;
  }).join("");
  $("#ring").innerHTML = `<circle cx="250" cy="250" r="190" fill="none" stroke="#344258" stroke-width="2"/>${pts}`;

  lastReport = {
    generatedAt: new Date().toISOString(),
    keys: count,
    virtualNodesPerWeight: vn,
    baselineNodes: baseline,
    currentNodes: nodes,
    remapping: {consistent:c, modulo:m},
    distribution: stats,
  };
}

$("#add").onclick = () => {
  const name = $("#newNode").value.trim(), weight = Number($("#weight").value);
  if (!name || nodes.some(n => n.name === name)) return;
  nodes = normalizeNodes([...nodes, {name, weight}]);
  $("#newNode").value = "";
  render();
};
$("#remove").onclick = () => { if (nodes.length > 1) { nodes = nodes.slice(0,-1); render(); } };
$("#setBaseline").onclick = () => { baseline = nodes.map(x => ({...x})); render(); };
$("#reset").onclick = () => { nodes = baseline.map(x => ({...x})); render(); };
$("#churnAdd").onclick = () => { nodes = applyChurn(nodes, Math.max(1, Math.min(8, Number($("#churn").value)||1))); render(); };
$("#churnRemove").onclick = () => {
  const n = Math.max(1, Math.min(8, Number($("#churn").value)||1));
  if (nodes.length > n) { nodes = applyChurn(nodes, -n); render(); }
};
$("#benchmark").onclick = () => {
  const b = benchmark();
  $("#timing").textContent = `consistent ${b.consistentMs.toFixed(2)} ms · modulo ${b.moduloMs.toFixed(2)} ms`;
};
$("#export").onclick = () => lastReport && download("consistent-hashing-report.json", lastReport);
$("#keys").oninput = render;
$("#vn").oninput = render;
render();
