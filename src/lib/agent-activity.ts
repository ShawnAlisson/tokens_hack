import fs from "fs";
import path from "path";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export type AgentName = "sentinel" | "strategist" | "actor" | "x402" | "system";
export type AgentStatus = "idle" | "running" | "success" | "error";

export interface AgentActivityEntry {
  id: string;
  tenant_id: string;
  agent: AgentName;
  message: string;
  status: AgentStatus;
  timestamp: string;
  meta?: Record<string, string | number>;
}

const ACTIVITY_PATH = path.join(process.cwd(), "data", "agent_activity.json");
const MAX_ENTRIES = 200;

type Listener = (entry: AgentActivityEntry) => void;
const listeners = new Set<Listener>();

function ensureFile(): AgentActivityEntry[] {
  const dir = path.dirname(ACTIVITY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ACTIVITY_PATH)) {
    fs.writeFileSync(ACTIVITY_PATH, "[]", "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"));
  } catch {
    return [];
  }
}

function save(entries: AgentActivityEntry[]) {
  const dir = path.dirname(ACTIVITY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(entries.slice(0, MAX_ENTRIES), null, 2), "utf8");
}

export function subscribeAgentActivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function logAgentActivity(
  entry: Omit<AgentActivityEntry, "id" | "timestamp">
): Promise<AgentActivityEntry> {
  const full: AgentActivityEntry = {
    ...entry,
    id: `log_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
  };

  const entries = ensureFile();
  entries.unshift(full);
  save(entries);

  listeners.forEach((fn) => fn(full));
  return full;
}

export function getAgentActivity(tenantId?: string, limit = 50): AgentActivityEntry[] {
  const entries = ensureFile();
  const filtered = tenantId ? entries.filter((e) => e.tenant_id === tenantId) : entries;
  return filtered.slice(0, limit);
}

export function getAgentHealth(tenantId: string): Record<AgentName, { status: AgentStatus; lastRun: string | null }> {
  const entries = ensureFile().filter((e) => e.tenant_id === tenantId);
  const agents: AgentName[] = ["sentinel", "strategist", "actor", "x402"];

  return agents.reduce(
    (acc, agent) => {
      const agentEntries = entries.filter((e) => e.agent === agent);
      const latest = agentEntries[0];
      acc[agent] = {
        status: latest?.status ?? "idle",
        lastRun: latest?.timestamp ?? null,
      };
      return acc;
    },
    {} as Record<AgentName, { status: AgentStatus; lastRun: string | null }>
  );
}
