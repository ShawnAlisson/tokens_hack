if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}
import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";

export interface Competitor {
  name: string;
  domains: string[];
}

export interface OwnedPublishChannel {
  type: string;
  database_id: string;
  workspace_url: string;
}

export interface TenantProduct {
  name: string;
  price_gbp: number;
  category: string;
  image_url: string;
}

export interface TenantConfig {
  id: string;
  display_name: string;
  domain: string;
  logo_url: string;
  market: string;
  competitors: Competitor[];
  owned_publish_channel: OwnedPublishChannel;
  tavily_search_profiles: string[];
  products?: TenantProduct[];
}

export interface TenantSummary {
  id: string;
  display_name: string;
  domain: string;
  logo_url: string;
  market: string;
}

const TENANTS_DIR = path.join(process.cwd(), "config", "tenants");

export function resolveTenantId(request?: Request): string {
  if (request) {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie.match(/(?:^|;\s*)bc_tenant=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);

    const header = request.headers.get("x-tenant-id");
    if (header) return header;
  }
  return process.env.ACTIVE_TENANT || "gymshark";
}

export function listAvailableTenants(): TenantSummary[] {
  if (!fs.existsSync(TENANTS_DIR)) return [];

  return fs
    .readdirSync(TENANTS_DIR)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((file) => {
      const config = loadTenantFile(path.join(TENANTS_DIR, file));
      return {
        id: config.id,
        display_name: config.display_name,
        domain: config.domain,
        logo_url: config.logo_url,
        market: config.market,
      };
    });
}

function loadTenantFile(configPath: string): TenantConfig {
  const fileContents = fs.readFileSync(configPath, "utf8");
  const processedContents = fileContents.replace(
    /\${NOTION_DATABASE_ID}/g,
    process.env.NOTION_DATABASE_ID || ""
  );
  const config = yaml.load(processedContents) as Partial<TenantConfig>;

  if (!config.id || !config.display_name || !config.domain) {
    throw new Error(`Invalid tenant configuration in ${configPath}`);
  }

  return {
    id: config.id,
    display_name: config.display_name,
    domain: config.domain,
    logo_url: config.logo_url || "",
    market: config.market || "",
    competitors: config.competitors || [],
    owned_publish_channel: {
      type: config.owned_publish_channel?.type || "notion",
      database_id: config.owned_publish_channel?.database_id || process.env.NOTION_DATABASE_ID || "",
      workspace_url: config.owned_publish_channel?.workspace_url || "",
    },
    tavily_search_profiles: config.tavily_search_profiles || [],
    products: config.products || [],
  };
}

export function getTenantConfig(tenantId?: string): TenantConfig {
  const id = tenantId || process.env.ACTIVE_TENANT || "gymshark";
  const configPath = path.join(TENANTS_DIR, `${id}.yaml`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Tenant configuration file not found at: ${configPath}`);
  }

  try {
    return loadTenantFile(configPath);
  } catch (error) {
    console.error(`Failed to load tenant configuration for: ${id}`, error);
    throw error;
  }
}

export function getActiveTenantConfig(request?: Request): TenantConfig {
  return getTenantConfig(resolveTenantId(request));
}
