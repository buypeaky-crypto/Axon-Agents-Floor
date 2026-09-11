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
};

export type AgentSummary = Omit<AgentRecord, "body" | "trainingNotes">;

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
