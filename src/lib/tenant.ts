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

export interface TenantConfig {
  id: string;
  display_name: string;
  domain: string;
  logo_url: string;
  market: string;
  competitors: Competitor[];
  owned_publish_channel: OwnedPublishChannel;
  tavily_search_profiles: string[];
}

/**
 * Loads the active tenant configuration from config/tenants/{ACTIVE_TENANT}.yaml.
 * Defaults to "gymshark" if ACTIVE_TENANT env var is not specified.
 */
export function getActiveTenantConfig(): TenantConfig {
  const tenantId = process.env.ACTIVE_TENANT || "gymshark";
  const configPath = path.join(process.cwd(), "config", "tenants", `${tenantId}.yaml`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Tenant configuration file not found at: ${configPath}`);
  }

  try {
    const fileContents = fs.readFileSync(configPath, "utf8");
    
    // Replace environment variables in YAML if they exist (specifically database_id)
    const processedContents = fileContents.replace(/\${NOTION_DATABASE_ID}/g, process.env.NOTION_DATABASE_ID || "");
    
    const config = yaml.load(processedContents) as Partial<TenantConfig>;

    // Validate structure
    if (!config.id || !config.display_name || !config.domain) {
      throw new Error(`Invalid tenant configuration in ${configPath}: Missing id, display_name, or domain.`);
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
    };
  } catch (error) {
    console.error(`Failed to load tenant configuration for: ${tenantId}`, error);
    throw error;
  }
}
