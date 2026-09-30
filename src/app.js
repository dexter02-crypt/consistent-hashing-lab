import {buildRing,assignConsistent,assignModulo,compareAssignments,distribution,makeKeys} from "./core.js";
const $=s=>document.querySelector(s);
let nodes=["alpha","bravo","charlie","delta"];
let baseline=[...nodes];

function colorFor(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return `hsl(${h} 75% 68%)`}

function render(){
  const count=Math.max(10,Math.min(10000,Number($("#keys").value)||1000));
  const vn=Math.max(1,Math.min(256,Number($("#vn").value)||64));
  const keys=makeKeys(count);
  const beforeC=assignConsistent(keys,baseline,vn), afterC=assignConsistent(keys,nodes,vn);
  const beforeM=assignModulo(keys,baseline), afterM=assignModulo(keys,nodes);
  const c=compareAssignments(beforeC,afterC), m=compareAssignments(beforeM,afterM);
  $("#consistent").textContent=`${(c.fraction*100).toFixed(1)}%`;
  $("#modulo").textContent=`${(m.fraction*100).toFixed(1)}%`;
  $("#nodeCount").textContent=nodes.length;
  $("#nodes").innerHTML=nodes.map(n=>`<span class="pill">${n}</span>`).join(" ");
  $("#table").innerHTML=Object.entries(distribution(afterC,nodes)).map(([n,v])=>`<tr><td>${n}</td><td>${v}</td><td>${(100*v/count).toFixed(1)}%</td></tr>`).join("");

  const ring=buildRing(nodes,vn);
  const sample=ring.filter((_,i)=>i%Math.max(1,Math.floor(ring.length/96))===0).slice(0,96);
  const pts=sample.map(x=>{
    const a=(x.point/2**32)*Math.PI*2-Math.PI/2;
    const cx=250+190*Math.cos(a),cy=250+190*Math.sin(a);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${colorFor(x.node)}"><title>${x.node}</title></circle>`
  }).join("");
  $("#ring").innerHTML=`<circle cx="250" cy="250" r="190" fill="none" stroke="#344258" stroke-width="2"/>${pts}`;
}
$("#add").onclick=()=>{const name=$("#newNode").value.trim();if(name&&!nodes.includes(name)&&nodes.length<12){nodes.push(name);$("#newNode").value="";render()}};
$("#remove").onclick=()=>{if(nodes.length>1){nodes.pop();render()}};
$("#reset").onclick=()=>{nodes=[...baseline];render()};
$("#setBaseline").onclick=()=>{baseline=[...nodes];render()};
$("#keys").oninput=render;$("#vn").oninput=render;render();
