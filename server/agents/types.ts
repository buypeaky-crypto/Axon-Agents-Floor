export type Discipline = 'code' | 'security' | 'data' | 'ops' | 'research' | 'support' | 'creative';
export interface AgentCard {
  id: string; name: string; discipline: Discipline;
  weight: number; price: number; seniority: string;
  model: { primary: string; fallback: string[] };
  description: string; systemPromptPath: string;
}
export interface EvalCard {
  agentId: string; discipline: Discipline; confidence: number;
  weight: number; weightedConfidence: number; proofScore: number;
  receiptCount: number; latencyMs: number; contribution: string; modelUsed: string;
}
export interface RouterDecision {
  input: string; keywords: string[]; isPayTask: boolean;
  selectedAgents: string[]; reason: string; forcedInjection?: string[];
}
export interface WeightedMergeResult {
  id: string; input: string; routerDecision: RouterDecision;
  contributions: EvalCard[]; totalConfidence: number; mergedOutput: string;
  adapterPack: { contributions: Record<string,string>; eval: EvalCard[]; totalConfidence: number; weights: Record<string,number> };
  created_at: string;
}
