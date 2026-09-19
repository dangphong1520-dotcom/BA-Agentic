"use client";

import { useState } from "react";
import type { DesignPreview } from "@ba/contracts";

type Screen = DesignPreview["prototype"]["screens"][number];

function MockElement({ label, onAdvance }: { label: string; onAdvance: () => void }) {
  const normalized = label.toLocaleLowerCase("vi");
  if (normalized.includes("nút") || normalized.includes("hành động") || normalized.includes("tiếp tục")) {
    return <button className="prototype-live-button" type="button" onClick={onAdvance}>{label}</button>;
  }
  if (normalized.includes("thông tin") || normalized.includes("bộ lọc") || normalized.includes("tiêu đề")) {
    return <label className="prototype-live-field"><span>{label}</span><input aria-label={label} placeholder={`Nhập ${label.toLocaleLowerCase("vi")}`} /></label>;
  }
  return <div className="prototype-live-card"><span>{label}</span><strong>Chưa có dữ liệu mẫu</strong></div>;
}

export function PrototypePlayer({ screens }: { screens: Screen[] }) {
  const [active, setActive] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const screen = screens[active];
  if (!screen) return null;
  const advance = () => setActive((current) => Math.min(current + 1, screens.length - 1));

  return <section className="panel prototype-live-section">
    <div className="prototype-live-heading">
      <div><span className="eyebrow">INTERACTIVE PREVIEW</span><h2>Xem thử hành trình giao diện</h2><p className="muted">Bản mô phỏng dùng dữ liệu giả và không thay đổi requirement.</p></div>
      <div className="prototype-viewport-switch" aria-label="Kích thước màn hình">
        <button type="button" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}>Desktop</button>
        <button type="button" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}>Mobile</button>
      </div>
    </div>
    <div className="prototype-screen-tabs" aria-label="Các màn hình prototype">
      {screens.map((item, index) => <button type="button" className={index === active ? "active" : ""} aria-pressed={index === active} key={`${item.name}-${index}`} onClick={() => setActive(index)}>{index + 1}. {item.name}</button>)}
    </div>
    <div className={`prototype-live-frame ${viewport}`}>
      <div className="prototype-live-browser"><i/><i/><i/><span>BA Agent · Prototype proposal</span></div>
      <div className="prototype-live-content">
        <span className="eyebrow">SCREEN {active + 1} / {screens.length}</span>
        <h3>{screen.name}</h3><p>{screen.purpose}</p>
        <div className="prototype-live-elements">{screen.elements.map((element, index) => <MockElement key={`${element}-${index}`} label={element} onAdvance={advance}/>)}</div>
      </div>
    </div>
  </section>;
}
