import React, { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import {
  BlockStack, Box, ColorPicker, Popover, TextField, hsbToHex, rgbToHsb,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { LivePreview } from "../components/preview/LivePreview";
import { CssEditor } from "../components/settings/CssEditor";
import { DEFAULT_APP_SETTINGS, useSettings } from "../context/SettingsContext";
import type { AppSettings } from "../context/SettingsContext";
import "../styles/product-options.css";

// ── Types ─────────────────────────────────────────────────────────────────────
type Settings = AppSettings;
type ColorGroup = keyof Settings["colors"];
const HEX_COLOR_REGEX = /^#([a-fA-F0-9]{6})$/;

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New",
  "Verdana", "Inter", "Roboto", "Open Sans", "Montserrat",
  "Lato", "Poppins", "Oswald", "Nunito",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeHex = (value: string) => {
  if (!value) return "#000000";
  const next = value.startsWith("#") ? value : `#${value}`;
  return HEX_COLOR_REGEX.test(next) ? next.toLowerCase() : "#000000";
};

const hexToHsb = (hex: string) => {
  const safe = normalizeHex(hex).slice(1);
  const red = parseInt(safe.slice(0, 2), 16);
  const green = parseInt(safe.slice(2, 4), 16);
  const blue = parseInt(safe.slice(4, 6), 16);
  return rgbToHsb({ red, green, blue });
};

// ── RangeField ────────────────────────────────────────────────────────────────
function RangeField({ label, value, min, max, onChange, unit = "px" }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const val = value ?? min;
  const percentage = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const move = (clientX: number) => {
      const pos = (clientX - rect.left) / rect.width;
      onChange(Math.min(max, Math.max(min, Math.round(min + pos * (max - min)))));
    };
    const onMM = (ev: MouseEvent) => move(ev.clientX);
    const onTM = (ev: TouchEvent) => move(ev.touches[0].clientX);
    const onEnd = () => {
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTM);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTM);
    document.addEventListener("touchend", onEnd);
    move("touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);
  };

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#666", textTransform: "capitalize" }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>{val}{unit}</span>
      </div>
      <div onMouseDown={onStart} onTouchStart={onStart}
        style={{ position: "relative", height: "20px", display: "flex", alignItems: "center", cursor: "pointer", padding: "0 2px", touchAction: "none" }}>
        <div style={{ width: "100%", height: "4px", background: "#e1e3e5", borderRadius: "4px", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${percentage}%`, background: "#000", borderRadius: "4px" }} />
          <div className="se-custom-thumb" style={{
            position: "absolute", left: `${percentage}%`, top: "50%",
            transform: "translate(-50%,-50%)", width: "14px", height: "14px",
            background: "#000", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            zIndex: 2, transition: "transform 0.1s ease"
          }} />
        </div>
      </div>
    </div>
  );
}

// ── PolarisColorPopover ───────────────────────────────────────────────────────
function PolarisColorPopover({ label, value, onChange }: {
  label: string; value: string; onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localHsb, setLocalHsb] = useState(() => hexToHsb(value));

  useEffect(() => { setLocalHsb(hexToHsb(value)); }, [value]);

  return (
    <Popover
      active={open}
      onClose={() => setOpen(false)}
      activator={
        <button type="button" aria-label={`Open ${label} color picker`}
          className="se-color-popover-trigger"
          onClick={() => setOpen(p => !p)}
          style={{ backgroundColor: normalizeHex(value) }}
        />
      }
    >
      <Box padding="300" minWidth="220px">
        <BlockStack gap="300">
          <ColorPicker color={localHsb} onChange={(next) => {
            setLocalHsb(next);
            const nextHex = hsbToHex(next);
            if (normalizeHex(nextHex) !== normalizeHex(value)) onChange(nextHex);
          }} />
          <TextField label="Hex" autoComplete="off" value={value} onChange={onChange} />
        </BlockStack>
      </Box>
    </Popover>
  );
}

// ── Color sections config ─────────────────────────────────────────────────────
const COLOR_SECTIONS: Array<{ title: string; group: ColorGroup; fields: Array<[string, string]> }> = [
  { title: "General", group: "general", fields: [["appBackground", "App background"], ["labelText", "Label text"], ["requiredCharacter", "Required character"]] },
  { title: "Single input", group: "singleInput", fields: [["inputText", "Input text"], ["inputBorder", "Input border"], ["inputBackground", "Input background"], ["switchBackground", "Switch background"], ["switchActiveBackground", "Switch active bg"]] },
  { title: "Choice list", group: "choiceList", fields: [["dropdownText", "Dropdown text"], ["dropdownBorder", "Dropdown border"], ["dropdownBackground", "Dropdown background"], ["checkboxRadioText", "Checkbox text"], ["checkboxRadioActive", "Checkbox active"]] },
  { title: "Swatch", group: "swatch", fields: [["buttonText", "Button text"], ["buttonTextHover", "Button text hover"], ["buttonTextActive", "Button text active"], ["buttonBackground", "Button bg"], ["buttonBackgroundHover", "Button hover bg"], ["buttonBackgroundActive", "Button active bg"], ["swatchBorder", "Swatch border"], ["swatchBorderHover", "Swatch border hover"], ["swatchBorderActive", "Swatch border active"]] },
];

// ── Preview groups ────────────────────────────────────────────────────────────
const ALL_WIDGET_PREVIEW_GROUPS = [
  {
    id: "preview-group-1", name: "All elements", hidden: false,
    elements: [
      { id: "el-text", type: "text", label: "Text", hidden: false },
      { id: "el-file", type: "file", label: "File Upload", hidden: false },
      { id: "el-switch", type: "switch", label: "Switch", hidden: false },
      {
        id: "el-select", type: "select", label: "Select", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false }]
      },
      {
        id: "el-radio", type: "radio", label: "Radio Button", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false }]
      },
      {
        id: "el-checkbox", type: "checkbox", label: "Checkbox", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false }]
      },
      {
        id: "el-button", type: "button", label: "Button", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false }]
      },
      {
        id: "el-color-swatch", type: "color-swatch", label: "Color Swatch", swatchStyle: "color", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false, swatchMode: "one", swatchValue: "#000000ff", swatchValue2: "#ffffffff" }]
      },
      {
        id: "el-image-swatch", type: "image-swatch", label: "Image Swatch", direction: "horizontal", swatchStyle: "image", hidden: false,
        optionValues: [{ id: "opt-1", value: "Option 1", price: 0, isDefault: false }, { id: "opt-2", value: "Option 2", price: 0, isDefault: false }]
      },
    ],
  },
];

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  let settings: Settings = DEFAULT_APP_SETTINGS;
  try {
    const record = await db.setting.findUnique({ where: { shop } });
    if (record?.settings) {
      const parsed = JSON.parse(record.settings as string);
      settings = {
        colors: {
          general: { ...DEFAULT_APP_SETTINGS.colors.general, ...parsed.colors?.general },
          singleInput: { ...DEFAULT_APP_SETTINGS.colors.singleInput, ...parsed.colors?.singleInput },
          choiceList: { ...DEFAULT_APP_SETTINGS.colors.choiceList, ...parsed.colors?.choiceList },
          swatch: { ...DEFAULT_APP_SETTINGS.colors.swatch, ...parsed.colors?.swatch },
          tabs: { ...DEFAULT_APP_SETTINGS.colors.tabs, ...parsed.colors?.tabs },
          group: { ...DEFAULT_APP_SETTINGS.colors.group, ...parsed.colors?.group },
        },
        borders: {
          input: { ...DEFAULT_APP_SETTINGS.borders.input, ...parsed.borders?.input },
          dropdown: { ...DEFAULT_APP_SETTINGS.borders.dropdown, ...parsed.borders?.dropdown },
          swatch: { ...DEFAULT_APP_SETTINGS.borders.swatch, ...parsed.borders?.swatch },
        },
        typography: {
          labelText: { ...DEFAULT_APP_SETTINGS.typography.labelText, ...parsed.typography?.labelText },
          mainText: { ...DEFAULT_APP_SETTINGS.typography.mainText, ...parsed.typography?.mainText },
        },
        additional: { ...DEFAULT_APP_SETTINGS.additional, ...parsed.additional },
      };
    }
  } catch (err) {
    console.error("Failed to load settings from DB:", err);
  }
  return { settings, shop };
};

// ── Action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  try {
    if (actionType === "save" || actionType === "import") {
      const settingsStr = formData.get("settings") as string;
      JSON.parse(settingsStr);
      await db.setting.upsert({
        where: { shop },
        create: { shop, settings: settingsStr },
        update: { settings: settingsStr },
      });
      return { success: true, message: actionType === "save" ? "Settings saved." : "Settings imported." };
    }
  } catch (err) {
    console.error("Action error:", err);
    return { error: true, message: "An error occurred while saving." };
  }
  return { error: true, message: "Action not supported." };
};

import { SkeletonSettingsGrid, SkeletonSettingsPage } from "../components/settings/SkeletonSettings";

// ── SettingsPage ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings: initialSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as
    | { success?: boolean; error?: boolean; message?: string }
    | undefined;
  const submit = useSubmit();
  const navigation = useNavigation();
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isMounted, setIsMounted] = useState(false);

  // Connect to global context so other screens (e.g. option-sets editor) update on save
  const { setSettings: setContextSettings } = useSettings();

  useEffect(() => { setIsMounted(true); }, []);

  // Sync local settings changes to the context in real-time for live preview
  useEffect(() => {
    setContextSettings(settings);
  }, [settings, setContextSettings]);

  // Load Google Fonts whenever selected fonts change
  useEffect(() => {
    const fonts = Array.from(new Set([
      settings.typography?.labelText?.font ?? "Inter",
      settings.typography?.mainText?.font ?? "Inter",
    ]));
    const linkId = "se-settings-google-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(/ /g, "+")).join("&family=")
      }&display=swap`;
  }, [settings.typography]);

  const isSaving = navigation.state === "submitting" &&
    navigation.formData?.get("actionType") === "save";

  // ── mutation helpers ───────────────────────────────────────────────────────
  const updateColor = (group: ColorGroup, key: string, value: string) =>
    setSettings(prev => ({
      ...prev,
      colors: {
        ...(prev?.colors ?? DEFAULT_APP_SETTINGS.colors),
        [group]: { ...(prev?.colors?.[group] ?? DEFAULT_APP_SETTINGS.colors[group]), [key]: value },
      },
    }));

  const updateBorder = (
    group: keyof Settings["borders"],
    key: "borderSize" | "borderRadius",
    value: number,
  ) =>
    setSettings(prev => ({
      ...prev,
      borders: {
        ...(prev?.borders ?? DEFAULT_APP_SETTINGS.borders),
        [group]: { ...(prev?.borders?.[group] ?? DEFAULT_APP_SETTINGS.borders[group]), [key]: value },
      },
    }));

  const updateTypography = (
    group: keyof Settings["typography"],
    key: "font" | "baseSize",
    value: string | number,
  ) =>
    setSettings(prev => ({
      ...prev,
      typography: {
        ...(prev?.typography ?? DEFAULT_APP_SETTINGS.typography),
        [group]: { ...(prev?.typography?.[group] ?? DEFAULT_APP_SETTINGS.typography[group]), [key]: value },
      },
    }));

  const handleSave = () => {
    // Update the global context so all other screens reflect the new styling immediately
    setContextSettings(settings);
    submit({ actionType: "save", settings: JSON.stringify(settings) }, { method: "post" });
  };

  // ── inline CSS for the settings UI itself (preview overrides etc.) ─────────
  const settingsPageCss = `
    .se-nav{display:flex;justify-content:space-between;align-items:center;border:1px solid #e1e3e5;border-radius:10px;padding:10px 14px;background:#fff;margin-bottom:16px;}
    .se-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:18px}
    @media (max-width:1020px){.se-grid{grid-template-columns:1fr}}
    .se-main-title{font-size:18px;font-weight:600;margin:0;line-height:1.2;color:#1a1a1a}
    .se-card{background:#fff;border:1px solid #e1e3e5;border-radius:10px;padding:10px 18px 18px;}
    .se-title{font-size:15px;font-weight:700;margin:8px 0 12px}
    .se-sub{font-size:13px;font-weight:600;color:#4a4a4a;margin:12px 0 9px}
    .se-colors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 14px}
    .se-color-item{display:flex;gap:10px;align-items:center}
    .se-swatch{position:relative;width:30px;height:30px;border-radius:50%;border:1px solid #cfd3d7;overflow:hidden;flex-shrink:0}
    .se-color-popover-trigger{width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;display:block}
    .se-color-label{font-size:12px;line-height:1.2;font-weight:600}
    .se-color-val{font-size:11px;color:#777;text-transform:uppercase;font-family:monospace}
    .se-divider{border-top:1px solid #eff1f3;margin:14px 0}
    .se-sliders{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .se-slider-box{border:1px solid #eceef0;border-radius:10px;padding:12px 12px 2px;background:#fafbfc}
    .se-slider-box-title{font-size:13px;font-weight:700;color:#1a1a1a;display:block;margin-bottom:12px;text-transform:capitalize}
    .se-typo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .se-typo-card{border:1px solid #eceef0;border-radius:10px;padding:12px;background:#fafbfc}
    .se-preview-head{font-size:12px;font-weight:700;text-transform:uppercase;color:#666666;padding:4px 4px 8px;border-bottom:1px solid #666666;}
    .se-preview-wrap-all{max-height:78vh;overflow:auto;border:1px solid ${settings.colors?.tabs?.tabBorder ?? "#e1e1e1"};border-radius:12px;padding:8px;background:${settings.colors?.general?.appBackground ?? "#ffffff"}}
    .se-preview-wrap-all::-webkit-scrollbar{width:8px}
    .se-preview-wrap-all::-webkit-scrollbar-thumb{background:#c7cbcf;border-radius:999px}
    .se-preview-wrap-all .se-preview-image-container{display:none !important}
    .se-preview-wrap-all .se-skeleton-title,.se-preview-wrap-all .se-skeleton-line{display:none !important}
    .se-preview-wrap-all .se-preview-grid{grid-template-columns:1fr !important}
    .se-preview-wrap-all .se-preview-sticky-wrapper{position:static !important;height:auto !important;overflow:visible !important;display:block !important;justify-content:stretch !important;background:transparent !important;padding:0 !important}
    .se-preview-wrap-all .se-preview-card{min-height:0 !important;box-shadow:none !important;background:transparent !important;padding:0 !important;border-radius:0 !important}
    .se-preview-wrap-all .se-preview-card.se-mobile{width:100% !important}
    .se-preview-wrap-all .se-preview-info-stack{width:100% !important}
    .se-preview-wrap-all .se-option-group-wrapper,.se-preview-wrap-all .se-group-wrapper-inner,.se-preview-wrap-all .se-preview-container{width:100% !important;max-width:none !important}
    .se-preview-wrap-all .se-group-wrapper-inner{margin:0 !important}
    .se-preview-wrap-all .se-preview-container{padding-left:4px !important;padding-right:4px !important;box-sizing:border-box !important}
    .se-preview-wrap-all .se-option-group{display:flex !important;flex-wrap:wrap !important}
    .se-preview-wrap-all .se-option-element{padding-left:0 !important;padding-right:0 !important;flex:0 0 100% !important;max-width:100% !important}
    .se-preview-wrap-all .se-option-element.se-col-25,.se-preview-wrap-all .se-option-element.se-col-33,
    .se-preview-wrap-all .se-option-element.se-col-50,.se-preview-wrap-all .se-option-element.se-col-66,
    .se-preview-wrap-all .se-option-element.se-col-75,.se-preview-wrap-all .se-option-element.se-col-100{flex:0 0 100% !important;max-width:100% !important}
  `;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {isMounted && <style dangerouslySetInnerHTML={{ __html: settingsPageCss }} />}

      {!isMounted ? (
        <SkeletonSettingsPage />
      ) : (
        <s-page heading="SE Product Options">
          {actionData?.success && (
            <div style={{
              background: "#e7f4e9", color: "#0c581c", border: "1px solid #bce1c5",
              borderRadius: 8, padding: "10px 12px", marginBottom: 12
            }}>
              ✓ {actionData.message}
            </div>
          )}
          {actionData?.error && (
            <div style={{
              background: "#fbeae5", color: "#8a1c14", border: "1px solid #f9d0c4",
              borderRadius: 8, padding: "10px 12px", marginBottom: 12
            }}>
              ⚠ {actionData.message}
            </div>
          )}

          {/* ── top bar ── */}
          <div className="se-nav">
            <h1 className="se-main-title">Settings</h1>
            <s-button variant="primary" onClick={handleSave} disabled={isSaving ? true : undefined}>
              {isSaving ? "Save settings" : "Save settings"}
            </s-button>
          </div>

          <div className="se-grid">
            {/* ══ LEFT COLUMN ══ */}
            <div className="se-card">
              {/* Color */}
              <div className="se-title">Color</div>
              {COLOR_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="se-sub">{section.title}</div>
                  <div className="se-colors">
                    {section.fields.map(([key, label]) => {
                      const value = (settings.colors[section.group] as Record<string, string>)[key];
                      return (
                        <div className="se-color-item" key={`${section.group}-${key}`}>
                          <div className="se-swatch">
                            <PolarisColorPopover
                              label={label}
                              value={value}
                              onChange={(next) => updateColor(section.group, key, next)}
                            />
                          </div>
                          <div>
                            <div className="se-color-label">{label}</div>
                            <div className="se-color-val">{value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="se-divider" />
                </div>
              ))}

              {/* Borders */}
              <div className="se-title">Borders</div>
              <div className="se-sliders">
                {(["input", "dropdown", "swatch"] as const).map((group) => (
                  <div className="se-slider-box" key={group}>
                    <div className="se-slider-box-title">{group}</div>
                    <RangeField label="Border Size" min={0} max={12}
                      value={settings?.borders?.[group]?.borderSize ?? 1}
                      onChange={(v) => updateBorder(group, "borderSize", v)} />
                    <RangeField label="Border Radius" min={0} max={60}
                      value={settings?.borders?.[group]?.borderRadius ?? 0}
                      onChange={(v) => updateBorder(group, "borderRadius", v)} />
                  </div>
                ))}
              </div>

              <div className="se-divider" />

              {/* Typography */}
              <div className="se-title">Typography</div>
              <div className="se-typo">
                {(Object.keys(settings.typography) as Array<keyof Settings["typography"]>).map((group) => (
                  <div className="se-typo-card" key={group}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                      {group === "labelText" ? "Label Text" : group === "mainText" ? "Main Text" : group}
                    </div>
                    <s-select
                      value={settings.typography[group].font}
                      onChange={(e: any) => updateTypography(group, "font", e.target.value)}
                    >
                      {FONT_OPTIONS.map(f => <s-option key={f} value={f}>{f}</s-option>)}
                    </s-select>
                    <div style={{ marginTop: "12px" }}>
                      <RangeField label="Base Size" min={10} max={32}
                        value={settings?.typography?.[group]?.baseSize ?? 13}
                        onChange={(v) => updateTypography(group, "baseSize", v)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="se-divider" />

              {/* Additional CSS */}
              <div className="se-title">Additional CSS</div>
              <CssEditor
                value={settings?.additional?.customCss ?? ""}
                onChange={(val) =>
                  setSettings(prev => ({
                    ...prev,
                    additional: { ...prev.additional, customCss: val },
                  }))
                }
              />
            </div>

            {/* ══ RIGHT COLUMN — PREVIEW ══ */}
            <div>
              <div className="se-preview-wrap-all">
                <div className="se-preview-head">Preview</div>
                <LivePreview groups={ALL_WIDGET_PREVIEW_GROUPS} previewMode="mobile" />
              </div>
            </div>
          </div>
        </s-page>
      )}
    </>
  );
}
