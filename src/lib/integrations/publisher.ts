import { type CounterPlan } from "../agents/strategist";
import { getTenantConfig } from "../tenant";
import { citedmd, type CitedMdPublishOutput } from "./citedmd";
import { notion, type NotionPublishOutput } from "./notion";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface PublishOutput {
  page_id: string;
  published_url: string;
  channel: "citedmd" | "notion";
}

function fromCitedMd(output: CitedMdPublishOutput): PublishOutput {
  return {
    page_id: output.content_id,
    published_url: output.published_url,
    channel: "citedmd",
  };
}

function fromNotion(output: NotionPublishOutput): PublishOutput {
  return {
    page_id: output.notion_page_id,
    published_url: output.published_url,
    channel: "notion",
  };
}

export async function publishCampaignBrief(plan: CounterPlan): Promise<PublishOutput> {
  const channelType = getTenantConfig(plan.tenant_id).owned_publish_channel.type;

  if (channelType === "citedmd" || channelType === "cited.md") {
    return fromCitedMd(await citedmd.publishCampaignBrief(plan));
  }

  return fromNotion(await notion.publishCampaignBrief(plan));
}
