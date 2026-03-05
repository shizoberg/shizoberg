export type ConfidenceTier = "high" | "medium" | "low" | "unattributed";

export type MetaRow = {
  date: string;
  account_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  link_clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  adds_to_cart: number;
  initiate_checkout: number;
  purchases: number;
  purchase_value: number;
};

export type ShopifyRow = {
  order_id: string;
  created_at: string;
  total_price: number;
  subtotal_price: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  refunded_total: number;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  customer_id: string;
  is_new_customer: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_site?: string;
  referring_site?: string;
};

export type JoinedOrder = ShopifyRow & {
  attributed_campaign: string;
  confidence: ConfidenceTier;
};
