import React, { createContext, useContext, useState, useEffect } from "react";

export interface AppSettings {
  colors: {
    general: {
      appBackground: string;
      labelText: string;
      requiredCharacter: string;
    };
    singleInput: {
      inputText: string;
      inputBorder: string;
      inputBackground: string;
      switchBackground: string;
      switchActiveBackground: string;
    };
    choiceList: {
      dropdownText: string;
      dropdownBorder: string;
      dropdownBackground: string;
      checkboxRadioText: string;
      checkboxRadioActive: string;
    };
    swatch: {
      buttonText: string;
      buttonTextHover: string;
      buttonTextActive: string;
      buttonBackground: string;
      buttonBackgroundHover: string;
      buttonBackgroundActive: string;
      swatchBorder: string;
      swatchBorderHover: string;
      swatchBorderActive: string;
    };
    tabs: {
      tabTitle: string;
      tabTitleActive: string;
      tabTitleHover: string;
      tabContent: string;
      tabBorder: string;
    };
    group: {
      groupLabel: string;
      groupIcon: string;
      groupChevron: string;
    };
  };
  borders: {
    input: { borderSize: number; borderRadius: number };
    dropdown: { borderSize: number; borderRadius: number };
    swatch: { borderSize: number; borderRadius: number };
  };
  typography: {
    labelText: { font: string; baseSize: number };
    mainText: { font: string; baseSize: number };
  };
  additional: {
    customCss: string;
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  colors: {
    general: {
      appBackground: "#ffffff",
      labelText: "#000000",
      requiredCharacter: "#ff0000",
    },
    singleInput: {
      inputText: "#000000",
      inputBorder: "#121212",
      inputBackground: "#ffffff",
      switchBackground: "#dddddd",
      switchActiveBackground: "#121212",
    },
    choiceList: {
      dropdownText: "#121212",
      dropdownBorder: "#121212",
      dropdownBackground: "#ffffff",
      checkboxRadioText: "#000000",
      checkboxRadioActive: "#121212",
    },
    swatch: {
      buttonText: "#000000",
      buttonTextHover: "#121212",
      buttonTextActive: "#ffffff",
      buttonBackground: "#ffffff",
      buttonBackgroundHover: "#ffffff",
      buttonBackgroundActive: "#121212",
      swatchBorder: "#dddddd",
      swatchBorderHover: "#dddddd",
      swatchBorderActive: "#121212",
    },
    tabs: {
      tabTitle: "#717171",
      tabTitleActive: "#212121",
      tabTitleHover: "#212121",
      tabContent: "#212020",
      tabBorder: "#e1e1e1",
    },
    group: {
      groupLabel: "#121212",
      groupIcon: "#121212",
      groupChevron: "#121212",
    },
  },
  borders: {
    input: { borderSize: 1, borderRadius: 8 },
    dropdown: { borderSize: 1, borderRadius: 8 },
    swatch: { borderSize: 1, borderRadius: 6 },
  },
  typography: {
    labelText: { font: "Inter", baseSize: 13 },
    mainText: { font: "Inter", baseSize: 13 },
  },
  additional: {
    customCss: "",
  },
};

interface SettingsContextType {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_APP_SETTINGS,
  setSettings: () => {},
});

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: AppSettings;
}) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  // Load Google Fonts whenever typography changes
  useEffect(() => {
    const fonts = Array.from(
      new Set([
        settings.typography?.labelText?.font ?? "Inter",
        settings.typography?.mainText?.font ?? "Inter",
      ])
    );
    const linkId = "se-global-google-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fonts
      .map((f) => f.replace(/ /g, "+"))
      .join("&family=")}&display=swap`;
  }, [settings.typography]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/**
 * Generates a CSS string from the settings object that can be injected as a
 * <style> tag to apply design settings across ALL screens (admin UI) as well
 * as the storefront widget.
 *
 * Targets four scopes:
 *   #se-product-options-root        — storefront fallback root
 *   .se-product-options-container   — storefront theme block container
 *   .se-preview-container           — LivePreview inner container (option-sets editor & settings)
 *   .se-preview-wrap-all            — outer preview wrapper on settings page
 */
export function buildGlobalCss(settings: AppSettings): string {
  const s = settings;

  // Expand N child selectors into comma-joined list scoped to all four containers
  const SCOPES = [
    "#se-product-options-root",
    ".se-product-options-container",
    ".se-preview-container",
    ".se-preview-wrap-all",
  ];
  const sel = (...suffixes: string[]) =>
    SCOPES.map(scope =>
      suffixes.length === 0 ? scope : suffixes.map(suf => `${scope} ${suf}`).join(", ")
    ).join(", ");

  // Convenience aliases
  const gen   = s.colors?.general     ?? ({} as any);
  const inp   = s.colors?.singleInput ?? ({} as any);
  const ch    = s.colors?.choiceList  ?? ({} as any);
  const sw    = s.colors?.swatch      ?? ({} as any);
  const bIn   = s.borders?.input      ?? ({} as any);
  const bDr   = s.borders?.dropdown   ?? ({} as any);
  const bSw   = s.borders?.swatch     ?? ({} as any);
  const tLbl  = s.typography?.labelText ?? ({} as any);
  const tMain = s.typography?.mainText  ?? ({} as any);

  return `
/* ── SE Product Options – Global Design Settings ── */

/* ── Root / App background + font ── */
${sel()} {
  font-family: '${tMain.font ?? "Inter"}', sans-serif !important;
  background-color: ${gen.appBackground ?? "#ffffff"} !important;
}

/* ── Label text ── */
${sel(".se-option-element label", ".se-label-price", ".se-switch-label-text")} {
  color: ${gen.labelText ?? "#000000"} !important;
  font-size: ${tLbl.baseSize ?? 13}px !important;
  font-family: '${tLbl.font ?? "Inter"}', sans-serif !important;
}

/* ── Required asterisk ── */
${sel(".se-option-element label .se-required")} {
  color: ${gen.requiredCharacter ?? "#ff0000"} !important;
}

/* ── Text inputs / Textarea ── */
${sel(".se-input")} {
  color: ${inp.inputText ?? "#000000"} !important;
  background-color: ${inp.inputBackground ?? "#ffffff"} !important;
  border: ${bIn.borderSize ?? 1}px solid ${inp.inputBorder ?? "#121212"} !important;
  border-radius: ${bIn.borderRadius ?? 8}px !important;
  font-size: ${tMain.baseSize ?? 13}px !important;
  font-family: '${tMain.font ?? "Inter"}', sans-serif !important;
}
${sel(".se-input:focus")} {
  border-color: ${inp.inputBorder ?? "#121212"} !important;
  box-shadow: 0 0 0 1px ${inp.inputBorder ?? "#121212"} !important;
}

/* ── File Upload Box ── */
${sel(".se-file-upload-box")} {
  border: ${bIn.borderSize ?? 2}px dashed ${inp.inputBorder ?? "#121212"} !important;
  border-radius: ${bIn.borderRadius ?? 8}px !important;
}

/* ── Color Picker Trigger & Hex Input ── */
${sel(".se-color-picker-trigger", ".se-cp-hex-input")} {
  border: ${bIn.borderSize ?? 1}px solid ${inp.inputBorder ?? "#121212"} !important;
  border-radius: ${bIn.borderRadius ?? 8}px !important;
}

/* ── Dropdown / Select ── */
${sel("select.se-input")} {
  color: ${ch.dropdownText ?? "#121212"} !important;
  background-color: ${ch.dropdownBackground ?? "#ffffff"} !important;
  border: ${bDr.borderSize ?? 1}px solid ${ch.dropdownBorder ?? "#121212"} !important;
  border-radius: ${bDr.borderRadius ?? 8}px !important;
  font-family: '${tMain.font ?? "Inter"}', sans-serif !important;
}
${sel("select.se-input[multiple] option:checked")} {
  background-color: ${ch.dropdownBackground ?? "#ffffff"} !important;
  color: ${ch.dropdownText ?? "#121212"} !important;
  box-shadow: 0 0 0 1px ${ch.dropdownBorder ?? "#121212"} !important;
}

/* ── Toggle Switch track ── */
${sel(".se-slider")} {
  background-color: ${inp.switchBackground ?? "#dddddd"} !important;
  border-color: ${inp.switchBackground ?? "#dddddd"} !important;
  border-radius: 24px !important;
}
${sel(".se-switch input:checked + .se-slider")} {
  background-color: ${inp.switchActiveBackground ?? "#121212"} !important;
  border-color: ${inp.switchActiveBackground ?? "#121212"} !important;
}

/* ── Radio / Checkbox — unchecked indicator border ── */
${sel(".se-radio-custom")} {
  border-width: ${bIn.borderSize ?? 1}px !important;
  border-style: solid !important;
  border-color: ${inp.inputBorder ?? "#121212"} !important;
}
${sel(".se-radio-item:hover .se-radio-custom")} {
  border-color: ${inp.inputBorder ?? "#121212"} !important;
}

/* ── Radio / Checkbox — option text ── */
${sel(".se-radio-label", ".se-radio-option-row")} {
  color: ${ch.checkboxRadioText ?? "#000000"} !important;
  font-size: ${tMain.baseSize ?? 13}px !important;
  font-family: '${tMain.font ?? "Inter"}', sans-serif !important;
}

/* ── Radio — checked indicator ── */
${sel('.se-radio-item input[type="radio"]:checked + .se-radio-custom-radio')} {
  border-width: ${bIn.borderSize ?? 1}px !important;
  border-color: ${ch.checkboxRadioActive ?? "#121212"} !important;
  background-color: ${gen.appBackground ?? "#ffffff"} !important;
}
${sel('.se-radio-item input[type="radio"]:checked + .se-radio-custom-radio::after')} {
  background-color: ${ch.checkboxRadioActive ?? "#121212"} !important;
}

/* ── Checkbox — checked indicator ── */
${sel('.se-radio-item input[type="checkbox"]:checked + .se-radio-custom-checkbox')} {
  border-width: ${bIn.borderSize ?? 1}px !important;
  border-color: ${ch.checkboxRadioActive ?? "#121212"} !important;
  background-color: ${ch.checkboxRadioActive ?? "#121212"} !important;
}

/* ── Button swatch ── */
${sel(".se-btn-option")} {
  color: ${sw.buttonText ?? "#000000"} !important;
  background: ${sw.buttonBackground ?? "#ffffff"} !important;
  border-color: ${sw.swatchBorder ?? "#dddddd"} !important;
  border-width: ${bSw.borderSize ?? 1}px !important;
  border-radius: ${bSw.borderRadius ?? 6}px !important;
  font-size: ${tMain.baseSize ?? 13}px !important;
  font-family: '${tMain.font ?? "Inter"}', sans-serif !important;
}
${sel(".se-btn-option:hover")} {
  color: ${sw.buttonTextHover ?? "#121212"} !important;
  background: ${sw.buttonBackgroundHover ?? "#ffffff"} !important;
  border-color: ${sw.swatchBorderHover ?? "#dddddd"} !important;
}
${sel(".se-btn-option--active")} {
  color: ${sw.buttonTextActive ?? "#ffffff"} !important;
  background: ${sw.buttonBackgroundActive ?? "#121212"} !important;
  border-color: ${sw.swatchBorderActive ?? "#121212"} !important;
}

/* ── Color / Image Swatch ── */
${sel(".se-swatch", ".se-radio-item--swatch .se-swatch")} {
  border-color: ${sw.swatchBorder ?? "#dddddd"} !important;
  border-width: ${bSw.borderSize ?? 1}px !important;
  border-radius: ${bSw.borderRadius ?? 6}px !important;
}
${sel(".se-radio-item--swatch:hover .se-swatch")} {
  border-color: ${sw.swatchBorderHover ?? "#aaa"} !important;
}
${sel(".se-radio-item--swatch input:checked ~ .se-radio-label .se-swatch")} {
  border-color: transparent !important;
  outline: 2px solid ${sw.swatchBorderActive ?? "#121212"} !important;
  outline-offset: 3px;
}

/* ── Custom CSS ── */
${s.additional?.customCss ?? ""}
  `;
}
