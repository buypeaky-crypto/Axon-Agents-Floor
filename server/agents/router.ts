import { agentRegistry } from './registry';
const KEYWORDS: Record<string,string[]> = {
  'code-meridian': ['code','api','route','typescript','fix','scaffold'],
  'security-assay': ['pay','payment','paypal','invoice','webhook','security','pglite'],
  'data-silt': ['neon','database','migration','drizzle','agent_runs','jsonb'],
  'ops-conduit': ['vercel','env','prod','DATABASE_URL','.vercel/output','.node_modules.lock'],
  'research-gyre': ['audit','eval','proof','weighted','adapter'],
  'support-sable': ['error','receipt','support','groq','bug'],
  'creative-vellum': ['landing','og','pwa','brand','design']
};
const PAY_REGEX = /(pay|invoice|paypal|webhook|payment|checkout|price|\$)/i;
export function routeTask(input:string, explicit?:string[]) {
  const lower=input.toLowerCase(); const kws:string[]=[]; const scores:Record<string,number>={};
  for (const [id,words] of Object.entries(KEYWORDS)) { let s=0; for (const w of words) if(lower.includes(w)){s++;kws.push(w);} scores[id]=s; }
  let selected = Object.entries(scores).filter(([,s])=>s>0).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  if (explicit?.length) { const ex = Object.values(agentRegistry).filter(a=>explicit.includes(a.discipline)).map(a=>a.id); selected=[...new Set([...ex,...selected])]; }
  if (selected.length===0) selected=['code-meridian','research-gyre','support-sable'];
  if (selected.length>4) selected=selected.slice(0,3);
  const isPayTask = PAY_REGEX.test(input); const forced:string[]=[];
  if (isPayTask && !selected.includes('security-assay')) { selected=['security-assay',...selected].slice(0,4); forced.push('security-assay'); }
  return { input, keywords:[...new Set(kws)], isPayTask, selectedAgents:selected, reason:`Selected ${selected.join(', ')} based on [${[...new Set(kws)].join(', ')}]${isPayTask?' + pay-task forced security-assay':''}`, forcedInjection:forced };
}
