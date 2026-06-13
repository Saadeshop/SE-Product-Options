import React from "react";

export function SkeletonSettingsGrid() {
  return (
    <>
      <style>{`
        @keyframes se-sk-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .se-sk-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
          background-size: 600px 100%;
          animation: se-sk-shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
        .se-sk-swatch {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .se-sk-divider {
          border-top: 1px solid #eff1f3;
          margin: 14px 0;
        }
        .se-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 18px;
        }
        @media (max-width: 1020px) {
          .se-grid {
            grid-template-columns: 1fr;
          }
        }
        .se-card {
          background: #fff;
          border: 1px solid #e1e3e5;
          border-radius: 10px;
          padding: 10px 18px 18px;
        }
        .se-title {
          font-size: 15px;
          font-weight: 700;
          margin: 8px 0 12px;
        }
        .se-sub {
          font-size: 13px;
          font-weight: 600;
          color: #4a4a4a;
          margin: 12px 0 9px;
        }
        .se-colors {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 14px;
        }
        .se-color-item {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .se-sliders {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .se-slider-box {
          border: 1px solid #eceef0;
          border-radius: 10px;
          padding: 12px 12px 2px;
          background: #fafbfc;
        }
        .se-slider-box-title {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          display: block;
          margin-bottom: 12px;
          text-transform: capitalize;
        }
        .se-typo {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .se-typo-card {
          border: 1px solid #eceef0;
          border-radius: 10px;
          padding: 12px;
          background: #fafbfc;
        }
      `}</style>
      <div className="se-grid">
        {/* ══ LEFT COLUMN ══ */}
        <div className="se-card">
          {/* Color Title */}
          <div className="se-title">Color</div>

          {/* Section: General (3 items) */}
          <div>
            <div className="se-sub">General</div>
            <div className="se-colors">
              {[1, 2, 3].map((i) => (
                <div className="se-color-item" key={i}>
                  <div className="se-sk-box se-sk-swatch" />
                  <div>
                    <div className="se-sk-box" style={{ width: 64, height: 11, marginBottom: 5 }} />
                    <div className="se-sk-box" style={{ width: 46, height: 9 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="se-sk-divider" />
          </div>

          {/* Section: Single input (5 items) */}
          <div>
            <div className="se-sub">Single input</div>
            <div className="se-colors">
              {[1, 2, 3, 4, 5].map((i) => (
                <div className="se-color-item" key={i}>
                  <div className="se-sk-box se-sk-swatch" />
                  <div>
                    <div className="se-sk-box" style={{ width: 70, height: 11, marginBottom: 5 }} />
                    <div className="se-sk-box" style={{ width: 46, height: 9 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="se-sk-divider" />
          </div>

          {/* Section: Choice list (5 items) */}
          <div>
            <div className="se-sub">Choice list</div>
            <div className="se-colors">
              {[1, 2, 3, 4, 5].map((i) => (
                <div className="se-color-item" key={i}>
                  <div className="se-sk-box se-sk-swatch" />
                  <div>
                    <div className="se-sk-box" style={{ width: 74, height: 11, marginBottom: 5 }} />
                    <div className="se-sk-box" style={{ width: 46, height: 9 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="se-sk-divider" />
          </div>

          {/* Section: Swatch (9 items) */}
          <div>
            <div className="se-sub">Swatch</div>
            <div className="se-colors">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div className="se-color-item" key={i}>
                  <div className="se-sk-box se-sk-swatch" />
                  <div>
                    <div className="se-sk-box" style={{ width: 68, height: 11, marginBottom: 5 }} />
                    <div className="se-sk-box" style={{ width: 46, height: 9 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="se-sk-divider" />
          </div>

          {/* Borders Title */}
          <div className="se-title">Borders</div>
          <div className="se-sliders">
            {["input", "dropdown", "swatch"].map((group) => (
              <div className="se-slider-box" key={group}>
                <div className="se-slider-box-title">{group}</div>

                {/* Border Size field skeleton */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div className="se-sk-box" style={{ width: 60, height: 10 }} />
                    <div className="se-sk-box" style={{ width: 20, height: 10 }} />
                  </div>
                  <div style={{ height: "20px", display: "flex", alignItems: "center" }}>
                    <div className="se-sk-box" style={{ width: "100%", height: "4px" }} />
                  </div>
                </div>

                {/* Border Radius field skeleton */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div className="se-sk-box" style={{ width: 70, height: 10 }} />
                    <div className="se-sk-box" style={{ width: 20, height: 10 }} />
                  </div>
                  <div style={{ height: "20px", display: "flex", alignItems: "center" }}>
                    <div className="se-sk-box" style={{ width: "100%", height: "4px" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="se-sk-divider" />

          {/* Typography Title */}
          <div className="se-title">Typography</div>
          <div className="se-typo">
            {["Label Text", "Main Text"].map((title) => (
              <div className="se-typo-card" key={title}>
                <div className="se-sk-box" style={{ width: 65, height: 12, marginBottom: 8 }} />

                {/* Select dropdown box skeleton */}
                <div className="se-sk-box" style={{ width: "100%", height: 32, borderRadius: 6, marginBottom: 14 }} />

                {/* Base Size field skeleton */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div className="se-sk-box" style={{ width: 50, height: 10 }} />
                    <div className="se-sk-box" style={{ width: 20, height: 10 }} />
                  </div>
                  <div style={{ height: "20px", display: "flex", alignItems: "center" }}>
                    <div className="se-sk-box" style={{ width: "100%", height: "4px" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="se-sk-divider" />

          {/* Additional CSS Title */}
          <div className="se-title">Additional CSS</div>
          <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, height: 320, overflow: "hidden", display: "flex" }}>
            <div style={{ width: 40, background: "#161b22", borderRight: "1px solid #30363d", padding: "12px 6px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} style={{ height: 7, background: "#2d333b", borderRadius: 3, opacity: 0.7 }} />
              ))}
            </div>
            <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {[70, 50, 65, 45, 60, 40, 55, 35, 50].map((w, i) => (
                <div key={i} style={{ height: 7, width: `${w}%`, background: i % 2 === 0 ? "#1c3054" : "#162b20", borderRadius: 3, opacity: 0.75 }} />
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div>
          <div className="se-preview-wrap-all" style={{ background: "#ffffff", border: "1px solid #e1e1e1", borderRadius: 12, padding: 8 }}>
            <div className="se-preview-head" style={{ color: "#666666", borderBottom: "1px solid #666666", padding: "4px 4px 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Preview</div>
            <div style={{ padding: "8px 0" }}>
              <div className="se-sk-box" style={{ width: 52, height: 10, marginBottom: 12 }} />
              {[85, 65, 75, 55, 70, 80, 60].map((w, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div className="se-sk-box" style={{ width: `${w}%`, height: 34, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SkeletonSettingsPage() {
  return (
    <>
      <style>{`
        @keyframes se-sk-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .se-sk-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
          background-size: 600px 100%;
          animation: se-sk-shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
        .se-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #e1e3e5;
          border-radius: 10px;
          padding: 10px 14px;
          background: #fff;
          margin-bottom: 16px;
          height: 54px;
          box-sizing: border-box;
        }
      `}</style>
      <s-page heading="SE Product Options">
        <div className="se-nav">
          <div className="se-sk-box" style={{ width: 80, height: 20 }} />
          <div className="se-sk-box" style={{ width: 110, height: 32, borderRadius: 8 }} />
        </div>
        <SkeletonSettingsGrid />
      </s-page>
    </>
  );
}
