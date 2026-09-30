import test from "node:test"; import assert from "node:assert/strict";
import {hash32,buildRing,assignConsistent,assignModulo,compareAssignments,distribution,makeKeys} from "../src/core.js";
test("hash deterministic",()=>assert.equal(hash32("abc"),hash32("abc")));
test("ring sorted and sized",()=>{const r=buildRing(["a","b"],8);assert.equal(r.length,16);for(let i=1;i<r.length;i++)assert.ok(r[i-1].point<=r[i].point)});
test("consistent assignment only uses known nodes",()=>{const a=assignConsistent(makeKeys(100),["a","b","c"],16);assert.ok([...a.values()].every(x=>["a","b","c"].includes(x)))});
test("adding a node moves fewer keys than modulo on deterministic sample",()=>{const k=makeKeys(5000);const c=compareAssignments(assignConsistent(k,["a","b","c"],128),assignConsistent(k,["a","b","c","d"],128));const m=compareAssignments(assignModulo(k,["a","b","c"]),assignModulo(k,["a","b","c","d"]));assert.ok(c.fraction<m.fraction)});
test("distribution counts every assignment",()=>{const k=makeKeys(700);const a=assignConsistent(k,["a","b"],32);assert.equal(Object.values(distribution(a,["a","b"])).reduce((x,y)=>x+y,0),700)});
test("input bounds enforced",()=>{assert.throws(()=>buildRing([],1));assert.throws(()=>makeKeys(100001));assert.throws(()=>buildRing(["a","a"],2))});
