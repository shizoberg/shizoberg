import * as XLSX from "xlsx";
import { ConfidenceTier, JoinedOrder, MetaRow, ShopifyRow } from "./types";

export const parseTabularFile = async (file: File): Promise<Record<string, string>[]> => {
  const buffer = await file.arrayBuffer();
  if (file.name.endsWith(".xlsx")) {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { raw: false });
  }
  const text = new TextDecoder().decode(buffer);
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows.map((row) => {
    const values = row.split(",");
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx]?.trim() ?? "";
      return acc;
    }, {} as Record<string, string>);
  });
};

const num = (value: string | number | undefined) => Number(value ?? 0) || 0;

export const toMetaRows = (rows: Record<string, string>[]): MetaRow[] =>
  rows.map((row) => ({
    date: row.date,
    account_name: row.account_name,
    campaign_id: row.campaign_id,
    campaign_name: row.campaign_name,
    adset_id: row.adset_id,
    adset_name: row.adset_name,
    ad_id: row.ad_id,
    ad_name: row.ad_name,
    spend: num(row.spend),
    impressions: num(row.impressions),
    reach: num(row.reach),
    clicks: num(row.clicks),
    link_clicks: num(row.link_clicks),
    ctr: num(row.ctr),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    adds_to_cart: num(row.adds_to_cart),
    initiate_checkout: num(row.initiate_checkout),
    purchases: num(row.purchases),
    purchase_value: num(row.purchase_value)
  }));

export const toShopifyRows = (rows: Record<string, string>[]): ShopifyRow[] =>
  rows.map((row) => ({
    order_id: row.order_id,
    created_at: row.created_at,
    total_price: num(row.total_price),
    subtotal_price: num(row.subtotal_price),
    discount_total: num(row.discount_total),
    shipping_total: num(row.shipping_total),
    tax_total: num(row.tax_total),
    refunded_total: num(row.refunded_total),
    currency: row.currency || "USD",
    financial_status: row.financial_status,
    fulfillment_status: row.fulfillment_status,
    customer_id: row.customer_id,
    is_new_customer: row.is_new_customer === "true",
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    landing_site: row.landing_site,
    referring_site: row.referring_site
  }));

export const joinAttribution = (orders: ShopifyRow[], campaigns: MetaRow[]): JoinedOrder[] => {
  const campaignIds = new Set(campaigns.map((c) => c.campaign_id));
  const campaignNames = new Set(campaigns.map((c) => c.campaign_name.toLowerCase()));

  return orders.map((order) => {
    const utmCampaign = order.utm_campaign?.toLowerCase();
    let confidence: ConfidenceTier = "unattributed";
    let attributed_campaign = "Unattributed";

    if (utmCampaign && campaignIds.has(order.utm_campaign || "")) {
      confidence = "high";
      attributed_campaign = order.utm_campaign || "";
    } else if (utmCampaign && campaignNames.has(utmCampaign)) {
      confidence = "medium";
      attributed_campaign = order.utm_campaign || "";
    } else if ((order.referring_site || "").match(/facebook|instagram|meta/i)) {
      confidence = "low";
      attributed_campaign = "Paid Social (Heuristic)";
    }

    return { ...order, confidence, attributed_campaign };
  });
};

export const computeOverview = (metaRows: MetaRow[], joinedOrders: JoinedOrder[]) => {
  const spend = metaRows.reduce((s, r) => s + r.spend, 0);
  const clicks = metaRows.reduce((s, r) => s + r.clicks, 0);
  const impressions = metaRows.reduce((s, r) => s + r.impressions, 0);
  const metaRevenue = metaRows.reduce((s, r) => s + r.purchase_value, 0);
  const grossRevenue = joinedOrders.reduce((s, o) => s + o.total_price, 0);
  const netRevenue = joinedOrders.reduce((s, o) => s + (o.total_price - o.refunded_total - o.discount_total), 0);
  const attributedShopifyRevenue = joinedOrders
    .filter((o) => o.confidence !== "unattributed")
    .reduce((s, o) => s + (o.total_price - o.refunded_total - o.discount_total), 0);

  return {
    spend,
    clicks,
    impressions,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpc: clicks ? spend / clicks : 0,
    cpm: impressions ? (spend / impressions) * 1000 : 0,
    metaRevenue,
    grossRevenue,
    netRevenue,
    metaRoas: spend ? metaRevenue / spend : 0,
    trueRoas: spend ? netRevenue / spend : 0,
    attributionGap: metaRevenue - attributedShopifyRevenue
  };
};
