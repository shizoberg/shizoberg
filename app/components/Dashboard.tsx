"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { computeOverview, joinAttribution, parseTabularFile, toMetaRows, toShopifyRows } from "@/app/lib/analytics";
import { MetaRow, ShopifyRow } from "@/app/lib/types";
import Link from "next/link";

const colors = ["#8b5cf6", "#3b82f6", "#14b8a6", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [metaRows, setMetaRows] = useState<MetaRow[]>([]);
  const [shopifyRows, setShopifyRows] = useState<ShopifyRow[]>([]);
  const [dark, setDark] = useState(true);
  const [currency, setCurrency] = useState("TRY");

  const joined = useMemo(() => joinAttribution(shopifyRows, metaRows), [shopifyRows, metaRows]);
  const overview = useMemo(() => computeOverview(metaRows, joined), [metaRows, joined]);

  const byCampaign = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number }>();
    metaRows.forEach((m) => {
      const v = map.get(m.campaign_name) || { spend: 0, revenue: 0 };
      v.spend += m.spend;
      v.revenue += m.purchase_value;
      map.set(m.campaign_name, v);
    });
    return [...map.entries()].map(([name, v]) => ({ name, ...v, roas: v.spend ? v.revenue / v.spend : 0 }));
  }, [metaRows]);

  const timeSeries = useMemo(() => {
    const map = new Map<string, { spend: number; metaRevenue: number; shopifyRevenue: number }>();
    metaRows.forEach((m) => {
      const e = map.get(m.date) || { spend: 0, metaRevenue: 0, shopifyRevenue: 0 };
      e.spend += m.spend;
      e.metaRevenue += m.purchase_value;
      map.set(m.date, e);
    });
    joined.forEach((o) => {
      const date = o.created_at.slice(0, 10);
      const e = map.get(date) || { spend: 0, metaRevenue: 0, shopifyRevenue: 0 };
      e.shopifyRevenue += o.total_price - o.refunded_total - o.discount_total;
      map.set(date, e);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
  }, [metaRows, joined]);

  const confidence = useMemo(() => {
    const total = joined.length || 1;
    const counts = { high: 0, medium: 0, low: 0, unattributed: 0 };
    joined.forEach((j) => counts[j.confidence]++);
    return {
      high: (counts.high / total) * 100,
      medium: (counts.medium / total) * 100,
      low: (counts.low / total) * 100,
      unattributed: (counts.unattributed / total) * 100
    };
  }, [joined]);

  const upload = async (file: File, type: "meta" | "shopify") => {
    const parsed = await parseTabularFile(file);
    if (type === "meta") setMetaRows(toMetaRows(parsed));
    else setShopifyRows(toShopifyRows(parsed));
  };

  return (
    <main className={dark ? "dark min-h-screen" : "min-h-screen"}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Marketing Performance Intelligence Dashboard</h1>
          <div className="flex gap-2">
            <button className="rounded bg-slate-900 px-3 py-2 text-white dark:bg-white dark:text-slate-900" onClick={() => setDark((v) => !v)}>Theme</button>
            <Link href="/report" className="rounded border px-3 py-2">Report View</Link>
            <button className="rounded border px-3 py-2" onClick={() => document.documentElement.requestFullscreen()}>Presentation</button>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          <label className="rounded-xl border p-4">Meta CSV/XLSX Upload<input type="file" className="mt-2" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "meta")} /></label>
          <label className="rounded-xl border p-4">Shopify CSV Upload<input type="file" className="mt-2" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "shopify")} /></label>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            ["Total Spend", overview.spend],
            ["Meta ROAS", overview.metaRoas],
            ["True ROAS", overview.trueRoas],
            ["Attribution Gap", overview.attributionGap]
          ].map(([label, value]) => (
            <motion.div key={label as string} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm text-slate-500">{label as string}</p>
              <p className="text-2xl font-bold">{Number(value).toFixed(2)} {currency}</p>
            </motion.div>
          ))}
        </section>

        <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h2 className="mb-2 font-semibold">Attribution Quality</h2>
          <p>UTM ID Match: {confidence.high.toFixed(1)}% · UTM Name Match: {confidence.medium.toFixed(1)}% · Heuristic Paid Social: {confidence.low.toFixed(1)}%</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
            <h3 className="mb-3 font-semibold">Spend vs Revenue</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="spend" stroke="#8b5cf6" />
                  <Line dataKey="metaRevenue" stroke="#14b8a6" />
                  <Line dataKey="shopifyRevenue" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
            <h3 className="mb-3 font-semibold">Spend Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCampaign} dataKey="spend" nameKey="name" outerRadius={100} label>
                    {byCampaign.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold">Efficiency Quadrant</h3>
          <div className="h-80">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="spend" name="Spend" />
                <YAxis dataKey="roas" name="ROAS" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={byCampaign} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold">Deterministic Insights</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Meta ROAS {overview.metaRoas.toFixed(2)} vs True ROAS {overview.trueRoas.toFixed(2)}. Attribution window differences likely if gap exceeds 20%.</li>
            <li>Highest spend campaign should be scaled only if ROAS above account average ({(overview.metaRoas || 0).toFixed(2)}).</li>
            <li>If CTR strong but True ROAS weak, test landing page and offer alignment.</li>
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold">Templates</h3>
          <div className="flex gap-3">
            <a href="/templates/meta-template.csv" download className="rounded border px-3 py-2">Download Meta Template</a>
            <a href="/templates/shopify-template.csv" download className="rounded border px-3 py-2">Download Shopify Template</a>
          </div>
        </section>
      </div>
    </main>
  );
}
