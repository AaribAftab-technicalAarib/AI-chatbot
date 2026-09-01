import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Formula Graph — type a formula, get a graph";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            ƒ
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Formula Graph</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            Type a formula,
            <br />
            get a graph.
          </div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>
            Free. No signup. Share by link.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
