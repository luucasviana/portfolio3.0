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

/**
 * Server Action to fetch consolidated metrics and logs for the Admin Dashboard.
 */
export async function getAnalyticsData() {
  const sql = getSqlClient();
  if (!sql) return null;

  try {
    // 1. Totalizadores (KPIs)
    const totalVisitsRes = await sql`SELECT COUNT(*)::int as count FROM visit_logs;`;
    const cvClicksRes = await sql`SELECT COUNT(*)::int as count FROM click_logs WHERE target_type = 'cv';`;
    const certClicksRes = await sql`SELECT COUNT(*)::int as count FROM click_logs WHERE target_type = 'certificate';`;
    const contactClicksRes = await sql`SELECT COUNT(*)::int as count FROM click_logs WHERE target_type = 'contact';`;

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
      GROUP BY target_detail 
      ORDER BY count DESC;
    `;

    // 3. Top Cidades / Localizações (Geolocalização)
    const topLocations = await sql`
      SELECT city, region, country, COUNT(*)::int as count 
      FROM visit_logs 
      GROUP BY city, region, country 
      ORDER BY count DESC 
      LIMIT 8;
    `;

    // 4. Tipo de Dispositivo
    const devicesBreakdown = await sql`
      SELECT device_type as device, COUNT(*)::int as count 
      FROM visit_logs 
      GROUP BY device_type 
      ORDER BY count DESC;
    `;

    // 5. Navegadores
    const browsersBreakdown = await sql`
      SELECT browser, COUNT(*)::int as count 
      FROM visit_logs 
      GROUP BY browser 
      ORDER BY count DESC;
    `;

    // 6. Fontes de Tráfego (Referrers)
    const trafficSources = await sql`
      SELECT referrer, COUNT(*)::int as count 
      FROM visit_logs 
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 5;
    `;

    // 7. Registro das últimas 15 visitas em tempo real
    const recentVisits = await sql`
      SELECT ip_address, city, region, country, device_type, browser, referrer, visited_at 
      FROM visit_logs 
      ORDER BY visited_at DESC 
      LIMIT 15;
    `;

    return {
      stats,
      contactBreakdown,
      topLocations,
      devicesBreakdown,
      browsersBreakdown,
      trafficSources,
      recentVisits,
    };
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return null;
  }
}
