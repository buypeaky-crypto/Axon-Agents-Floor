export type AgentRecord = {
  id: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  name: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  priceCents: number;
  version: string;
  hoursTrained: number;
  modelLabel: string;
  capabilities: string[];
  trainingNotes: string;
  sigil: string;
  featured: boolean;
  listed: boolean;
  ratingAvg: number;
  reviewCount: number;
  salesCount: number;
  createdAt: string;
  weightsId: string;
  runtimeModel: string;
  temperature: number;
  maxTokens: number;
  weightCard: string;
  evals: { tasks: number; pass: number; note: string } | null;
  sample: { user: string; reply: string } | null;
  sellerBtc: string;
};

export type AgentSummary = Omit<AgentRecord, "body" | "trainingNotes" | "sample" | "weightCard">;

export type ReviewRecord = {
  id: number;
  agentId: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  isMine: boolean;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
