"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Loader2 } from "lucide-react";

// Geocoding dictionary for common cities
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "aracaju": { lat: -10.9472, lon: -37.0731 },
  "são paulo": { lat: -23.5505, lon: -46.6333 },
  "sao paulo": { lat: -23.5505, lon: -46.6333 },
  "simão dias": { lat: -10.7397, lon: -37.8114 },
  "simao dias": { lat: -10.7397, lon: -37.8114 },
  "montreal": { lat: 45.5017, lon: -73.5673 },
  "beauharnois": { lat: 45.3101, lon: -73.8662 },
  "singapore": { lat: 1.3521, lon: 103.8198 },
  "singapura": { lat: 1.3521, lon: 103.8198 },
  "tokyo": { lat: 35.6762, lon: 139.6503 },
  "tóquio": { lat: 35.6762, lon: 139.6503 },
  "london": { lat: 51.5074, lon: -0.1278 },
  "londres": { lat: 51.5074, lon: -0.1278 },
  "new york": { lat: 40.7128, lon: -74.0060 },
  "nova york": { lat: 40.7128, lon: -74.0060 },
  "paris": { lat: 48.8566, lon: 2.3522 },
  "berlin": { lat: 52.5200, lon: 13.4050 },
  "berlim": { lat: 52.5200, lon: 13.4050 },
  "dublin": { lat: 53.3498, lon: -6.2603 },
  "amsterdam": { lat: 52.3676, lon: 4.9041 },
  "amsterdã": { lat: 52.3676, lon: 4.9041 },
  "lisbon": { lat: 38.7223, lon: -9.1393 },
  "lisboa": { lat: 38.7223, lon: -9.1393 },
  "porto": { lat: 41.1579, lon: -8.6291 },
  "madrid": { lat: 40.4168, lon: -3.7038 },
  "madri": { lat: 40.4168, lon: -3.7038 },
};

// Country geocoding fallback dictionary
const COUNTRY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "BR": { lat: -14.2350, lon: -51.9253 },
  "CA": { lat: 56.1304, lon: -106.3468 },
  "US": { lat: 37.0902, lon: -95.7129 },
  "SG": { lat: 1.3521, lon: 103.8198 },
  "PT": { lat: 39.3999, lon: -8.2245 },
  "ES": { lat: 40.4637, lon: -3.7492 },
  "FR": { lat: 46.2276, lon: 2.2137 },
  "DE": { lat: 51.1657, lon: 10.4515 },
  "GB": { lat: 55.3781, lon: -3.4360 },
  "IE": { lat: 53.4129, lon: -8.2439 },
  "NL": { lat: 52.1326, lon: 5.2913 },
  "IT": { lat: 41.8719, lon: 12.5674 },
  "JP": { lat: 36.2048, lon: 138.2529 },
  "CN": { lat: 35.8617, lon: 104.1954 },
  "IN": { lat: 20.5937, lon: 78.9629 },
  "AU": { lat: -25.2744, lon: 133.7751 },
};

interface TopLocation {
  city: string;
  region: string;
  country: string;
  count: number;
}

interface WorldBubbleMapProps {
  topLocations: TopLocation[];
}

export default function WorldBubbleMap({ topLocations }: WorldBubbleMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!svgRef.current) return;

    // Reset SVG canvas content
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    const width = 500;
    const height = 280;

    const projection = d3.geoMercator()
      .scale(80)
      .translate([width / 2, height / 1.6]);

    const pathGenerator = d3.geoPath().projection(projection);

    setLoading(true);

    // Fetch the standard world atlas TopoJSON map data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((atlasData: any) => {
        setLoading(false);
        if (!atlasData) return;

        // Convert TopoJSON to GeoJSON features
        const countryFeature = topojson.feature(atlasData, atlasData.objects.countries) as any;
        const countries = countryFeature.features;

        // Draw background countries
        svgEl.append("g")
          .selectAll("path")
          .data(countries)
          .enter()
          .append("path")
          .attr("d", pathGenerator as any)
          .style("fill", "#18202c") // dark slate blue matching system
          .style("stroke", "#0e121a") // dark borders
          .style("stroke-width", 0.5)
          .style("stroke-opacity", 0.8);

        // Map database locations to coordinates
        const activeCities = topLocations
          .map((loc) => {
            const cityName = loc.city.toLowerCase().trim();
            const countryCode = loc.country.trim().toUpperCase();
            
            let coords = CITY_COORDINATES[cityName];
            let isExact = true;

            if (!coords) {
              // Try fallback to country coordinates
              const fallback = COUNTRY_COORDINATES[countryCode];
              if (fallback) {
                isExact = false;
                // Add a tiny random jitter to prevent perfect overlap for different cities in the same country
                const jitterLat = (Math.random() - 0.5) * 1.5;
                const jitterLon = (Math.random() - 0.5) * 1.5;
                coords = { lat: fallback.lat + jitterLat, lon: fallback.lon + jitterLon };
              }
            }

            return coords ? { ...loc, lat: coords.lat, lon: coords.lon, isExact } : null;
          })
          .filter((c): c is (TopLocation & { lat: number; lon: number; isExact: boolean }) => c !== null);

        // Draw proportional bubbles
        const bubblesG = svgEl.append("g");

        bubblesG.selectAll("circle")
          .data(activeCities)
          .enter()
          .append("circle")
          .attr("cx", (d) => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[0] : 0;
          })
          .attr("cy", (d) => {
            const projected = projection([d.lon, d.lat]);
            return projected ? projected[1] : 0;
          })
          .attr("r", (d) => {
            // Radius calculation: proportional to square root of counts
            return Math.max(3.5, Math.sqrt(d.count) * 5.5);
          })
          .style("fill", "rgba(0, 173, 181, 0.4)") // cyan transparency
          .style("stroke", "#00adb5") // neon cyan border
          .style("stroke-width", 1.2)
          .style("cursor", "pointer")
          .attr("filter", "drop-shadow(0 0 4px rgba(0, 173, 181, 0.5))")
          .style("transition", "all 0.15s ease-out")
          
          // Interactions
          .on("mouseover", function (event, d) {
            d3.select(this)
              .style("fill", "rgba(0, 173, 181, 0.7)")
              .style("stroke", "#ffffff")
              .style("stroke-width", 1.8)
              .attr("filter", "drop-shadow(0 0 10px rgba(0, 173, 181, 0.9))")
              .attr("r", Math.max(3.5, Math.sqrt(d.count) * 5.5) + 3.5);

            if (tooltipRef.current) {
              const tooltip = d3.select(tooltipRef.current);
              tooltip.select("#tooltip-city").text(d.city);
              tooltip.select("#tooltip-region").text(`${d.region && d.region !== "Dev" && d.region !== "Desconhecido" ? d.region + ", " : ""}${d.country}`);
              tooltip.select("#tooltip-value").text(`${d.count} ${d.count > 1 ? "visitas" : "visita"}`);
              tooltip.style("display", "block");
            }
          })
          .on("mousemove", function (event) {
            if (tooltipRef.current) {
              d3.select(tooltipRef.current)
                .style("left", (event.pageX + 18) + "px")
                .style("top", (event.pageY - 18) + "px");
            }
          })
          .on("mouseout", function (event, d) {
            d3.select(this)
              .style("fill", "rgba(0, 173, 181, 0.4)")
              .style("stroke", "#00adb5")
              .style("stroke-width", 1.2)
              .attr("filter", "drop-shadow(0 0 4px rgba(0, 173, 181, 0.5))")
              .attr("r", Math.max(3.5, Math.sqrt(d.count) * 5.5));

            if (tooltipRef.current) {
              d3.select(tooltipRef.current).style("display", "none");
            }
          });
      })
      .catch((err) => {
        console.error("Failed to render world bubble map:", err);
        setLoading(false);
      });
  }, [topLocations]);

  return (
    <div className="w-full relative flex flex-col items-center justify-center min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0e121a]/80 z-20">
          <Loader2 className="w-6 h-6 text-[#00adb5] animate-spin" />
        </div>
      )}
      
      <div className="w-full flex justify-center items-center overflow-x-auto select-none pointer-events-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 500 280"
          className="w-full h-auto max-w-[500px]"
        />
      </div>

      {/* Premium Glassmorphic Tooltip Component */}
      <div
        ref={tooltipRef}
        className="absolute hidden bg-[#1c2027]/95 backdrop-blur-md border border-white/10 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl pointer-events-none transition-all duration-75 z-50 min-w-[130px]"
        style={{ position: "fixed" }}
      >
        <div className="text-[9px] text-[#718096] font-semibold uppercase tracking-wider mb-1">Localização</div>
        <div id="tooltip-city" className="font-bold text-white text-sm">São Paulo</div>
        <div id="tooltip-region" className="text-xs text-[#a0aec0] mt-0.5">São Paulo, BR</div>
        <div className="border-t border-white/5 my-1.5"></div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#718096]">Acessos:</span>
          <span id="tooltip-value" className="text-[#00adb5] font-bold text-xs">1 visita</span>
        </div>
      </div>
    </div>
  );
}
