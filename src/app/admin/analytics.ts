"use server";

import { getSqlClient } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Lightweight helper to parse basic Device and Browser type from User-Agent.
 * Zero external packages, 100% fast and secure.
 */
export async function parseUserAgent(ua: string) {
  let device_type = "Desktop";
  let browser = "Desconhecido";

  const lowerUa = ua.toLowerCase();
  
  if (lowerUa.includes("mobi") || lowerUa.includes("android") || lowerUa.includes("iphone") || lowerUa.includes("ipod")) {
    device_type = "Celular";
  } else if (lowerUa.includes("tablet") || lowerUa.includes("ipad")) {
    device_type = "Tablet";
  }

  if (lowerUa.includes("chrome") || lowerUa.includes("chromium")) {
    browser = "Chrome";
  } else if (lowerUa.includes("safari") && !lowerUa.includes("chrome")) {
    browser = "Safari";
  } else if (lowerUa.includes("firefox")) {
    browser = "Firefox";
  } else if (lowerUa.includes("edge")) {
    browser = "Edge";
  } else if (lowerUa.includes("opera") || lowerUa.includes("opr")) {
    browser = "Opera";
  }

  return { device_type, browser };
}

/**
 * Server Action to record clicks on CV, Certificate, or contact options.
 */
export async function recordClickAction(targetType: "cv" | "certificate" | "contact", targetDetail: string = "") {
  const sql = getSqlClient();
  if (!sql) return { success: false, error: "Database not connected" };

  try {
    await sql`
      INSERT INTO click_logs (target_type, target_detail)
      VALUES (${targetType}, ${targetDetail});
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to record click:", error);
    return { success: false, error: "Failed to record click" };
  }
}

function safeDecode(val: string | null | undefined): string {
  if (!val) return "Desconhecido";
  try {
    return decodeURIComponent(val);
  } catch {
    try {
      return decodeURIComponent(escape(val));
    } catch {
      return val;
    }
  }
}

/**
 * Server Action to fetch consolidated metrics and logs for the Admin Dashboard.
 */
export async function getAnalyticsData(range: "today" | "yesterday" | "week" | "month" | "all" = "today") {
  const sql = getSqlClient();
  if (!sql) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (range === "today") {
    startDate = todayStart;
  } else if (range === "yesterday") {
    startDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    endDate = todayStart;
  } else if (range === "week") {
    startDate = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    startDate = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const startStr = startDate ? startDate.toISOString() : null;
  const endStr = endDate ? endDate.toISOString() : null;

  try {
    // 1. Totalizadores (KPIs)
    const totalVisitsRes = await sql`
      SELECT COUNT(*)::int as count 
      FROM visit_logs
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp);
    `;
    const cvClicksRes = await sql`
      SELECT COUNT(*)::int as count 
      FROM click_logs 
      WHERE target_type = 'cv'
        AND (${startStr}::text IS NULL OR clicked_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR clicked_at < ${endStr}::timestamp);
    `;
    const certClicksRes = await sql`
      SELECT COUNT(*)::int as count 
      FROM click_logs 
      WHERE target_type = 'certificate'
        AND (${startStr}::text IS NULL OR clicked_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR clicked_at < ${endStr}::timestamp);
    `;
    const contactClicksRes = await sql`
      SELECT COUNT(*)::int as count 
      FROM click_logs 
      WHERE target_type = 'contact'
        AND (${startStr}::text IS NULL OR clicked_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR clicked_at < ${endStr}::timestamp);
    `;

    const stats = {
      totalVisits: totalVisitsRes[0]?.count || 0,
      cvClicks: cvClicksRes[0]?.count || 0,
      certClicks: certClicksRes[0]?.count || 0,
      contactClicks: contactClicksRes[0]?.count || 0,
    };

    // 2. Detalhamento de Cliques de Contato
    const contactBreakdown = await sql`
      SELECT target_detail as platform, COUNT(*)::int as count 
      FROM click_logs 
      WHERE target_type = 'contact' 
        AND (${startStr}::text IS NULL OR clicked_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR clicked_at < ${endStr}::timestamp)
      GROUP BY target_detail 
      ORDER BY count DESC;
    `;

    // 3. Top Cidades / Localizações (Geolocalização)
    const topLocations = await sql`
      SELECT city, region, country, COUNT(*)::int as count 
      FROM visit_logs 
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp)
      GROUP BY city, region, country 
      ORDER BY count DESC 
      LIMIT 8;
    `;

    // 4. Tipo de Dispositivo
    const devicesBreakdown = await sql`
      SELECT device_type as device, COUNT(*)::int as count 
      FROM visit_logs 
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp)
      GROUP BY device_type 
      ORDER BY count DESC;
    `;

    // 5. Navegadores
    const browsersBreakdown = await sql`
      SELECT browser, COUNT(*)::int as count 
      FROM visit_logs 
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp)
      GROUP BY browser 
      ORDER BY count DESC;
    `;

    // 6. Fontes de Tráfego (Referrers)
    const trafficSources = await sql`
      SELECT referrer, COUNT(*)::int as count 
      FROM visit_logs 
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp)
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 5;
    `;

    // 7. Registro das últimas 15 visitas em tempo real
    const recentVisits = await sql`
      SELECT ip_address, city, region, country, device_type, browser, referrer, visited_at 
      FROM visit_logs 
      WHERE (${startStr}::text IS NULL OR visited_at >= ${startStr}::timestamp)
        AND (${endStr}::text IS NULL OR visited_at < ${endStr}::timestamp)
      ORDER BY visited_at DESC 
      LIMIT 15;
    `;

    const mappedLocations = topLocations.map((loc: any) => ({
      ...loc,
      city: safeDecode(loc.city),
      region: safeDecode(loc.region),
    }));

    const mappedRecent = recentVisits.map((visit: any) => ({
      ...visit,
      city: safeDecode(visit.city),
      region: safeDecode(visit.region),
    }));

    return {
      stats,
      contactBreakdown,
      topLocations: mappedLocations,
      devicesBreakdown,
      browsersBreakdown,
      trafficSources,
      recentVisits: mappedRecent,
    };
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return null;
  }
}
