import test from "node:test";
import assert from "node:assert/strict";
import {
  hash32, normalizeNodes, buildRing, assignConsistent, assignModulo,
  compareAssignments, distribution, distributionStats, makeKeys,
  runComparison, applyChurn
} from "../src/core.js";

test("hash deterministic", () => assert.equal(hash32("abc"), hash32("abc")));
test("string nodes normalize to weight one", () => assert.deepEqual(normalizeNodes(["a"]), [{name:"a",weight:1}]));
test("weighted ring allocates proportional replica counts", () => {
  const r = buildRing([{name:"a",weight:1},{name:"b",weight:2}], 10);
  assert.equal(r.filter(x=>x.node==="a").length,10);
  assert.equal(r.filter(x=>x.node==="b").length,20);
});
test("ring sorted", () => {
  const r=buildRing(["a","b"],8);
  for(let i=1;i<r.length;i++) assert.ok(r[i-1].point<=r[i].point);
});
test("consistent assignment uses known nodes", () => {
  const a=assignConsistent(makeKeys(100),["a","b","c"],16);
  assert.ok([...a.values()].every(x=>["a","b","c"].includes(x)));
});
test("adding one node moves fewer keys than modulo on deterministic sample", () => {
  const k=makeKeys(10000);
  const c=compareAssignments(assignConsistent(k,["a","b","c"],256),assignConsistent(k,["a","b","c","d"],256));
  const m=compareAssignments(assignModulo(k,["a","b","c"]),assignModulo(k,["a","b","c","d"]));
  assert.ok(c.fraction<m.fraction);
});
test("distribution counts every assignment", () => {
  const k=makeKeys(700), a=assignConsistent(k,["a","b"],32);
  assert.equal(Object.values(distribution(a,["a","b"])).reduce((x,y)=>x+y,0),700);
});
test("distribution stats are finite with populated nodes", () => {
  const a=assignConsistent(makeKeys(10000),["a","b","c"],256);
  const s=distributionStats(a,["a","b","c"]);
  assert.equal(s.total,10000); assert.ok(Number.isFinite(s.stddev)); assert.ok(s.coefficientOfVariation>=0);
});
test("weighted nodes move observed share toward weight target", () => {
  const nodes=[{name:"a",weight:1},{name:"b",weight:3}];
  const s=distributionStats(assignConsistent(makeKeys(50000),nodes,512),nodes);
  assert.ok(s.counts.b>s.counts.a*2);
});
test("runComparison reports both schemes", () => {
  const r=runComparison({keys:makeKeys(1000),baselineNodes:["a","b"],currentNodes:["a","b","c"],virtualNodes:64});
  assert.equal(r.consistent.compared,1000); assert.equal(r.modulo.compared,1000);
});
test("churn add and remove are bounded and deterministic", () => {
  const a=applyChurn(["a","b"],2); assert.deepEqual(a.map(x=>x.name),["a","b","churn-1","churn-2"]);
  assert.deepEqual(applyChurn(a,-2).map(x=>x.name),["a","b"]);
});
test("input bounds enforced", () => {
  assert.throws(()=>buildRing([],1)); assert.throws(()=>makeKeys(100001));
  assert.throws(()=>normalizeNodes([{name:"a",weight:0}]));
  assert.throws(()=>normalizeNodes(["a","a"]));
  assert.throws(()=>applyChurn(["a"],-1));
});
