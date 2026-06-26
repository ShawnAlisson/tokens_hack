import fs from "fs";
import path from "path";
import { createClient, type ClickHouseClient } from "@clickhouse/client";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface CompetitorEvent {
  id: string;
  tenant_id: string;
  competitor: string;
  source_type: "pricing" | "launch" | "mention" | "trend" | "comparison";
  severity: "high" | "medium" | "low";
  url: string;
  url_hash: string;
  title: string;
  snippet: string;
  inserted_at: string;
  processed: boolean;
}

export interface CounterAction {
  id: string;
  event_id: string;
  tenant_id: string;
  competitor: string;
  trigger_title: string;
  strategy_angle: string;
  content_draft: string;
  published_url: string;
  notion_page_id: string;
  latency_ms: number;
  published_at: string;
}

export interface RevenueEvent {
  id: string;
  event_id: string;
  amount_usd: number;
  timestamp: string;
}

// Fallback disk database file
const FALLBACK_DB_PATH = path.join(process.cwd(), "data", "db_fallback.json");

// Ensure the data directory exists
function ensureDataDirectory() {
  const dir = path.dirname(FALLBACK_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Mock fallback store
interface FallbackSchema {
  competitor_events: CompetitorEvent[];
  counter_actions: CounterAction[];
  revenue_events: RevenueEvent[];
}

function loadFallbackDb(): FallbackSchema {
  ensureDataDirectory();
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
    } catch {
      // Ignore corrupt fallback DBs
    }
  }
  const defaultDb: FallbackSchema = {
    competitor_events: [],
    counter_actions: [],
    revenue_events: []
  };
  saveFallbackDb(defaultDb);
  return defaultDb;
}

function saveFallbackDb(db: FallbackSchema) {
  ensureDataDirectory();
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

class UniversalClickHouseClient {
  private client: ClickHouseClient | null = null;
  private isFallback: boolean = true;

  constructor() {
    const host = process.env.CLICKHOUSE_HOST;
    const username = process.env.CLICKHOUSE_USER || "default";
    const password = process.env.CLICKHOUSE_PASSWORD;

    if (host && host.includes("localhost") === false && password) {
      try {
        this.client = createClient({
          host,
          username,
          password,
          database: "default",
        });
        this.isFallback = false;
        console.log("[ClickHouse] Real cloud client initialized.");
      } catch (e) {
        console.warn("[ClickHouse] Real client init failed, using JSON fallback.", e);
        this.isFallback = true;
      }
    } else {
      console.log("[ClickHouse] Using local file-backed JSON fallback.");
      this.isFallback = true;
    }
  }

  isUsingFallback(): boolean {
    return this.isFallback;
  }

  async setupTables() {
    if (!this.isFallback && this.client) {
      try {
        await this.client.command({
          query: `
            CREATE TABLE IF NOT EXISTS competitor_events (
              id String,
              tenant_id String,
              competitor String,
              source_type String,
              severity String,
              url String,
              url_hash String,
              title String,
              snippet String,
              inserted_at String,
              processed UInt8
            ) ENGINE = ReplacingMergeTree()
            ORDER BY (tenant_id, id);
          `,
        });

        await this.client.command({
          query: `
            CREATE TABLE IF NOT EXISTS counter_actions (
              id String,
              event_id String,
              tenant_id String,
              competitor String,
              trigger_title String,
              strategy_angle String,
              content_draft String,
              published_url String,
              notion_page_id String,
              latency_ms UInt32,
              published_at String
            ) ENGINE = ReplacingMergeTree()
            ORDER BY (tenant_id, id);
          `,
        });

        await this.client.command({
          query: `
            CREATE TABLE IF NOT EXISTS revenue_events (
              id String,
              event_id String,
              amount_usd Float32,
              timestamp String
            ) ENGINE = MergeTree()
            ORDER BY (timestamp, id);
          `,
        });

        console.log("[ClickHouse] Real tables verified/created.");
      } catch (e) {
        console.error("[ClickHouse] Real table setup failed, fallback active.", e);
        this.isFallback = true;
      }
    } else {
      // For fallback, just ensure the file database structure exists
      loadFallbackDb();
      console.log("[ClickHouse] Fallback JSON storage verified.");
    }
  }

  async insertCompetitorEvent(event: CompetitorEvent) {
    if (!this.isFallback && this.client) {
      try {
        await this.client.insert({
          table: "competitor_events",
          values: [{ ...event, processed: event.processed ? 1 : 0 }],
          format: "JSONEachRow",
        });
        return;
      } catch (e) {
        console.error("[ClickHouse] Cloud insert failed, logging to fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    // Prevent duplicate url_hashes for same tenant
    const exists = db.competitor_events.some(
      (e) => e.url_hash === event.url_hash && e.tenant_id === event.tenant_id
    );
    if (!exists) {
      db.competitor_events.push(event);
      saveFallbackDb(db);
    }
  }

  async insertCounterAction(action: CounterAction) {
    if (!this.isFallback && this.client) {
      try {
        await this.client.insert({
          table: "counter_actions",
          values: [action],
          format: "JSONEachRow",
        });
        return;
      } catch (e) {
        console.error("[ClickHouse] Cloud counter insert failed, logging to fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    db.counter_actions.push(action);
    // Mark the trigger event as processed
    const event = db.competitor_events.find((e) => e.id === action.event_id);
    if (event) {
      event.processed = true;
    }
    saveFallbackDb(db);
  }

  async insertRevenueEvent(rev: RevenueEvent) {
    if (!this.isFallback && this.client) {
      try {
        await this.client.insert({
          table: "revenue_events",
          values: [rev],
          format: "JSONEachRow",
        });
        return;
      } catch (e) {
        console.error("[ClickHouse] Cloud revenue insert failed, logging to fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    db.revenue_events.push(rev);
    saveFallbackDb(db);
  }

  async getCompetitorEvents(tenantId: string, limit: number = 100): Promise<CompetitorEvent[]> {
    if (!this.isFallback && this.client) {
      try {
        const resultSet = await this.client.query({
          query: `SELECT * FROM competitor_events WHERE tenant_id = {tenant:String} ORDER BY inserted_at DESC LIMIT {lim:UInt32}`,
          query_params: { tenant: tenantId, lim: limit },
          format: "JSONEachRow",
        });
        const rows = (await resultSet.json<any>()) as any[];
        const mapped: CompetitorEvent[] = rows.map((r: any) => ({
          ...r,
          processed: r.processed === 1 || r.processed === true,
        }));
        return mapped;
      } catch (e) {
        console.error("[ClickHouse] Cloud query failed, fetching from fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    return db.competitor_events
      .filter((e) => e.tenant_id === tenantId)
      .sort((a, b) => b.inserted_at.localeCompare(a.inserted_at))
      .slice(0, limit);
  }

  async getCompetitorEventById(tenantId: string, id: string): Promise<CompetitorEvent | null> {
    if (!this.isFallback && this.client) {
      try {
        const resultSet = await this.client.query({
          query: `SELECT * FROM competitor_events WHERE tenant_id = {tenant:String} AND id = {id:String} LIMIT 1`,
          query_params: { tenant: tenantId, id },
          format: "JSONEachRow",
        });
        const rows = (await resultSet.json<any>()) as any[];
        if (rows.length > 0) {
          const r = rows[0] as any;
          return {
            ...r,
            processed: r.processed === 1 || r.processed === true,
          } as CompetitorEvent;
        }
        return null;
      } catch (e) {
        console.error("[ClickHouse] Cloud query failed, fetching from fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    return db.competitor_events.find((e) => e.tenant_id === tenantId && e.id === id) || null;
  }

  async getCounterActions(tenantId: string, limit: number = 100): Promise<CounterAction[]> {
    if (!this.isFallback && this.client) {
      try {
        const resultSet = await this.client.query({
          query: `SELECT * FROM counter_actions WHERE tenant_id = {tenant:String} ORDER BY published_at DESC LIMIT {lim:UInt32}`,
          query_params: { tenant: tenantId, lim: limit },
          format: "JSONEachRow",
        });
        return (await resultSet.json<any>()) as CounterAction[];
      } catch (e) {
        console.error("[ClickHouse] Cloud query failed, fetching from fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    return db.counter_actions
      .filter((a) => a.tenant_id === tenantId)
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
      .slice(0, limit);
  }

  async getRevenueStats(tenantId: string): Promise<{ count: number; total: number }> {
    if (!this.isFallback && this.client) {
      try {
        const resultSet = await this.client.query({
          query: `
            SELECT 
              count() as count, 
              sum(amount_usd) as total 
            FROM revenue_events
          `,
          format: "JSONEachRow",
        });
        const rows = (await resultSet.json<any>()) as any[];
        if (rows.length > 0) {
          return {
            count: Number(rows[0].count) || 0,
            total: Number(rows[0].total) || 0.0,
          };
        }
      } catch (e) {
        console.error("[ClickHouse] Cloud query failed, fetching from fallback.", e);
      }
    }

    // Fallback logic
    const db = loadFallbackDb();
    const count = db.revenue_events.length;
    const total = db.revenue_events.reduce((sum, r) => sum + r.amount_usd, 0);
    return { count, total };
  }

  async getCompetitorStats(tenantId: string, name: string) {
    const events = await this.getCompetitorEvents(tenantId);
    const compEvents = events.filter((e) => e.competitor.toLowerCase() === name.toLowerCase());

    // Calculate sources
    const sourcesMap: Record<string, number> = {};
    compEvents.forEach((e) => {
      try {
        const host = new URL(e.url).hostname;
        sourcesMap[host] = (sourcesMap[host] || 0) + 1;
      } catch {
        sourcesMap["other"] = (sourcesMap["other"] || 0) + 1;
      }
    });
    const top_sources = Object.entries(sourcesMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trend over last 14 days
    const trend: Record<string, { date: string; count: number; high: number; medium: number; low: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trend[dateStr] = { date: dateStr, count: 0, high: 0, medium: 0, low: 0 };
    }

    compEvents.forEach((e) => {
      const dateStr = e.inserted_at.split("T")[0];
      if (trend[dateStr]) {
        trend[dateStr].count += 1;
        trend[dateStr][e.severity] += 1;
      }
    });

    return {
      events: compEvents,
      trend: Object.values(trend),
      top_sources,
    };
  }

  // Clear database helper for seeding
  clearAll() {
    if (this.isFallback) {
      saveFallbackDb({
        competitor_events: [],
        counter_actions: [],
        revenue_events: []
      });
    }
  }
}

// Single instance across the application
export const clickhouse = new UniversalClickHouseClient();
