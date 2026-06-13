import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisProvider, SkeletonBodyText, IndexTable, Box } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useEffect } from "react";
import {
  SettingsProvider,
  DEFAULT_APP_SETTINGS,
  buildGlobalCss,
  useSettings,
} from "../context/SettingsContext";
import type { AppSettings } from "../context/SettingsContext";

// ── Loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings: AppSettings = DEFAULT_APP_SETTINGS;
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
    console.error("app.tsx loader – failed to load settings:", err);
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "", settings };
};

// ── Global style injector (reads from context) ────────────────────────────────
function GlobalSettingsStyle() {
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <style
      id="se-global-settings-style"
      dangerouslySetInnerHTML={{ __html: buildGlobalCss(settings) }}
    />
  );
}

import { SkeletonSettingsPage } from "../components/settings/SkeletonSettings";

// ── Skeleton for option-sets page (existing behaviour, kept as-is) ────────────
function SkeletonOptionSetsPage() {
  return (
    <s-page heading="SE Product Options">
      <s-box>
        <s-stack gap="base">
          <s-stack direction="inline" alignItems="center" justifyContent="space-between">
            <h1 style={{ fontSize: "1rem", fontWeight: "600" }}>Option Sets</h1>
            <s-button variant="primary">Create option set</s-button>
          </s-stack>
          <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
            <s-section padding="none">
              <Box width="100%">
                <IndexTable
                  resourceName={{ singular: "option set", plural: "option sets" }}
                  itemCount={5}
                  headings={[
                    { title: "Title" }, { title: "Status" }, { title: "Groups" },
                    { title: "Elements" }, { title: "Selection" }, { title: "Created" },
                    { title: "", alignment: "end" },
                  ]}
                  selectable={false}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IndexTable.Row id={`skeleton-${i}`} key={`skeleton-${i}`} position={i}>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell><SkeletonBodyText lines={1} /></IndexTable.Cell>
                      <IndexTable.Cell>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", background: "#f1f1f1", borderRadius: "4px" }} />
                        </div>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </Box>
            </s-section>
          </div>
        </s-stack>
      </s-box>
    </s-page>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function App() {
  const { apiKey, settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const nextPath = navigation.location?.pathname ?? "";
  const isLoadingSettings = navigation.state === "loading" && nextPath.includes("/settings");
  const isLoadingOptionSets = navigation.state === "loading" &&
    nextPath === "/app/option-sets" &&
    navigation.formAction === undefined;

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={{}}>
        <SettingsProvider initialSettings={settings}>
          <GlobalSettingsStyle />

          <s-app-nav>
            <s-link href="/app/option-sets">Option Sets</s-link>
            <s-link href="/app/settings">Settings</s-link>
          </s-app-nav>

          {isLoadingSettings ? <SkeletonSettingsPage /> :
            isLoadingOptionSets ? <SkeletonOptionSetsPage /> :
              <Outlet />}
        </SettingsProvider>
      </PolarisProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
