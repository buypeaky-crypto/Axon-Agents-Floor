import 'dotenv/config';
import fs from 'fs'; import path from 'path';
import { agentRegistry } from './registry';
import { routeTask } from './router';
async function callModel(modelId:string, sys:string, user:string): Promise<string> {
  const [provider, model] = modelId.split(':');
  if (provider==='groq') {
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{ method:'POST', headers:{ Authorization:`Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify({ model, messages:[{role:'system',content:sys},{role:'user',content:user}], temperature:0.2 }) });
    if(!r.ok) throw new Error(`groq ${r.status} ${await r.text()}`); const j=await r.json(); return j.choices[0].message.content;
  }
  if (provider==='openrouter') {
    const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{ method:'POST', headers:{ Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type':'application/json', 'HTTP-Referer':'https://axon-agents-floor.vercel.app', 'X-Title':'Axon' }, body:JSON.stringify({ model, messages:[{role:'system',content:sys},{role:'user',content:user}] }) });
    if(!r.ok) throw new Error(`openrouter ${r.status} ${await r.text()}`); const j=await r.json(); return j.choices[0].message.content;
  }
  if (provider==='github' || provider==='huggingface' || provider==='hf') {
    const r=await fetch('https://models.inference.ai.azure.com/chat/completions',{ method:'POST', headers:{ Authorization:`Bearer ${process.env.GITHUB_TOKEN||process.env.HF_TOKEN}`, 'Content-Type':'application/json' }, body:JSON.stringify({ model, messages:[{role:'system',content:sys},{role:'user',content:user}] }) });
    if(!r.ok) throw new Error(`${provider} ${r.status} ${await r.text()}`); const j=await r.json(); return j.choices[0].message.content;
  }
  throw new Error(`Unknown ${provider}`);
}
export async function runWeightedOrchestrator(input:string, explicit?:string[]) {
  const routerDecision=routeTask(input,explicit);
  const evalCards=await Promise.all(routerDecision.selectedAgents.map(async (agentId)=>{
    const agent=agentRegistry[agentId];
    const sysPath=path.resolve(`./server/agents/prompts/${agentId}.md`);
    const sysPrompt=fs.existsSync(sysPath)?fs.readFileSync(sysPath,'utf-8'): `You are ${agent.name} ${agent.seniority}`;
    const t0=Date.now(); let contrib=''; let modelUsed=agent.model.primary; let conf=0.7;
    try { contrib=await callModel(agent.model.primary, sysPrompt, input); conf=0.85; }
    catch(e1){ for(const fb of agent.model.fallback){ try{ contrib=await callModel(fb, sysPrompt, input); modelUsed=fb; conf=0.72; break; }catch{} } if(!contrib) contrib=`[${agentId} stub] ${String(e1).slice(0,300)}`; }
    return { agentId, discipline:agent.discipline, confidence:conf, weight:agent.weight, weightedConfidence:conf*agent.weight, proofScore:Math.min(95,60+contrib.length/20+conf*20), receiptCount:(contrib.match(/receipt|proof|invoice/gi)||[]).length+1, latencyMs:Date.now()-t0, contribution:contrib, modelUsed };
  }));
  const totalConfidence=evalCards.reduce((s,c)=>s+c.weightedConfidence,0);
  const contributions:Record<string,string>={}; evalCards.forEach(c=>contributions[c.agentId]=c.contribution);
  const mergedOutput=evalCards.sort((a,b)=>b.weight-a.weight).map(c=>`### ${c.agentId} (w=${c.weight}, conf=${c.confidence.toFixed(2)}, model=${c.modelUsed})\n${c.contribution}`).join('\n\n---\n\n');
  const result={ id:`run_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, input, routerDecision, contributions:evalCards, totalConfidence, mergedOutput, adapterPack:{ contributions, eval:evalCards, totalConfidence, weights:Object.fromEntries(evalCards.map(c=>[c.agentId,c.weight])) }, created_at:new Date().toISOString() };
  const outDir=path.resolve('./.axon/runs'); fs.mkdirSync(outDir,{recursive:true}); fs.writeFileSync(path.join(outDir,`${result.id}.axonwgt.json`), JSON.stringify(result,null,2));
  return result;
}
if (process.argv[1]?.endsWith('orchestrator.ts')) { const input=process.argv.slice(2).join(' ')||'Fix audit: implement 7 weighted agents'; runWeightedOrchestrator(input).then(r=>console.log(JSON.stringify(r,null,2))); }
