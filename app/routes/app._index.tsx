import type {
  HeadersFunction,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useNavigate, useLoaderData } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Box,
  Text,
  Badge,
  Button,
  Icon,
  Collapsible
} from "@shopify/polaris";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  XIcon
} from "@shopify/polaris-icons";

export const loader = async ({ request }: any) => {
  const { session, admin } = await authenticate.admin(request);
  const clientId = process.env.SHOPIFY_API_KEY || "f97c5bebfd0ca3b8d6c7793888f09ef3";
  let isEmbedActive = false;
  let isBlockActive = false;
  let hasOptionSets = false;

  try {
    const count = await db.optionSet.count({ where: { shop: session.shop } });
    hasOptionSets = count > 0;
  } catch (e) { }

  try {
    const themeRes = await fetch(`https://${session.shop}/admin/api/2024-01/themes.json`, {
      headers: { "X-Shopify-Access-Token": session.accessToken as string }
    });

    if (themeRes.ok) {
      const themeData = await themeRes.json();
      const mainTheme = themeData.themes?.find((t: any) => t.role === "main");

      if (mainTheme) {
        // 1. Check Embed Status
        const settingsRes = await fetch(`https://${session.shop}/admin/api/2024-01/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json&_t=${Date.now()}`, {
          headers: { "X-Shopify-Access-Token": session.accessToken as string }
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.asset?.value) {
            const settingsValue = settingsData.asset.value;
            if (settingsValue.includes('product-options')) {
              try {
                const parsed = JSON.parse(settingsValue);
                const blocks = parsed?.current?.blocks || {};
                for (const key in blocks) {
                  const b = blocks[key];
                  if (b.type?.includes('se-product-options') && b.type?.includes('product-options') && !b.type?.includes('product-options-block')) {
                    if (b.disabled === false || b.disabled === "false") isEmbedActive = true;
                  }
                }
              } catch (e) { }
            }
          }
        }

        // 2. Check Block Status
        const productRes = await fetch(`https://${session.shop}/admin/api/2024-01/themes/${mainTheme.id}/assets.json?asset[key]=templates/product.json&_t=${Date.now()}`, {
          headers: { "X-Shopify-Access-Token": session.accessToken as string }
        });
        if (productRes.ok) {
          const productData = await productRes.json();
          if (productData.asset?.value && productData.asset.value.includes('se-product-options') && productData.asset.value.includes('product-options-block')) {
            isBlockActive = true;
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to check theme status:", error);
  }

  return { shop: session.shop, clientId, isEmbedActive, isBlockActive, hasOptionSets };
};

export default function Index() {
  const navigate = useNavigate();
  const { shop, clientId, isEmbedActive, isBlockActive, hasOptionSets } = useLoaderData<typeof loader>();

  const completedCount = (hasOptionSets ? 1 : 0) + (isEmbedActive ? 1 : 0);
  const progressPercent = (completedCount / 2) * 100;

  const [expanded, setExpanded] = useState({
    guide: true,
    step1: true,
    step2: false,
  });

  const PendingIcon = () => (
    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px dashed #ababab', flexShrink: 0 }} />
  );

  const CompletedIcon = () => (
    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#2b2b2b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg viewBox="0 0 20 20" style={{ width: '12px', height: '12px', fill: 'currentColor' }}>
        <path d="M8.28 13.22a.75.75 0 0 0 1.06 0l7.5-7.5a.75.75 0 0 0-1.06-1.06l-6.97 6.97-2.97-2.97a.75.75 0 0 0-1.06 1.06l3.5 3.5Z" />
      </svg>
    </div>
  );

  return (
    <Page>
      <BlockStack gap="600">
        {/* Header Section */}
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="headingLg" as="h1">
              👋 Welcome to <span style={{
                background: 'linear-gradient(135deg, #1ea7ff 0%, #2f6dff 25%, #7a3cff 50%, #ff3ea5 75%, #ffb300 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}>SE Product Options</span>
            </Text>
            <Badge tone="info">Free plan</Badge>
          </InlineStack>
        </InlineStack>

        {/* Status Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignItems: 'stretch' }}>
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="headingSm" as="h2">App embed status</Text>
                {isEmbedActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="attention">Deactivated</Badge>
                )}
              </InlineStack>
              <Text tone="subdued" as="p">
                To display options on your Online Store, you must enable app embed in your theme.
              </Text>
              <InlineStack>
                <Button
                  variant={isEmbedActive ? undefined : "primary"}
                  onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${clientId}/product-options`, '_blank')}
                >
                  {isEmbedActive ? "Deactivate App Embed" : "Activate App Embed"}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text variant="headingSm" as="h2">App blocks status</Text>
              <Text tone="subdued" as="p">
                You have <Text fontWeight="bold" as="span">{isBlockActive ? '1 active' : '0 active'}</Text> app block(s) on your store.
              </Text>
              <InlineStack>
                <Button variant="primary" onClick={() => window.open(`https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${clientId}/product-options-block&target=mainSection`, '_blank')}>
                  Add App Block
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </div>

        {/* Setup Guide Section */}
        <Card padding="500">
          <BlockStack gap="500">
            <InlineStack align="space-between" blockAlign="start">
              <BlockStack gap="100">
                <Text variant="headingMd" as="h2">Setup guide</Text>
                <Text tone="subdued" as="p">Let's get started by following this guide</Text>
              </BlockStack>
              <InlineStack gap="400">
                <Button
                  variant="tertiary"
                  tone="neutral"
                  onClick={() => setExpanded({ ...expanded, guide: !expanded.guide })}
                  icon={expanded.guide ? ChevronUpIcon : ChevronDownIcon}
                  accessibilityLabel="Toggle setup guide"
                />
                <Icon source={XIcon} tone="subdued" />
              </InlineStack>
            </InlineStack>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <Text variant="bodyMd" fontWeight="bold" as="span">{completedCount} / 2 completed</Text>
              </div>
              <div style={{ flex: 1, height: '10px', backgroundColor: '#ebebeb', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#2b2b2b', transition: 'width 0.3s ease-in-out' }}></div>
              </div>
            </div>

            <Collapsible
              open={expanded.guide}
              id="guide-collapsible"
              transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
            >
              <BlockStack gap="200">
                {/* Step 1 */}
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <BlockStack gap="0">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {hasOptionSets ? <CompletedIcon /> : <PendingIcon />}
                        <Text variant="bodyMd" fontWeight="bold" tone={hasOptionSets ? "subdued" : undefined} as="h3">
                          <span style={{ textDecoration: hasOptionSets ? 'line-through' : 'none' }}>Step 1: Create your first option set</span>
                        </Text>
                      </div>
                      <Button
                        variant="tertiary"
                        tone="neutral"
                        onClick={() => setExpanded({ ...expanded, step1: !expanded.step1 })}
                        icon={expanded.step1 ? ChevronUpIcon : ChevronDownIcon}
                        accessibilityLabel="Toggle step 1 details"
                      />
                    </div>
                    <Collapsible
                      open={expanded.step1}
                      id="step1-collapsible"
                      transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                    >
                      <div style={{ paddingLeft: '30px', paddingTop: '4px' }}>
                        <BlockStack gap="200">
                          <Text tone="subdued" as="p">
                            Start by creating a new set of product options or editing an existing one.
                          </Text>
                          <InlineStack>
                            <Button onClick={() => navigate("/app/option-sets/new")}>
                              Create option set
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </div>
                    </Collapsible>
                  </BlockStack>
                </Box>

                {/* Step 2 */}
                <Box
                  background={expanded.step2 ? "bg-surface-secondary" : "transparent"}
                  padding={expanded.step2 ? "400" : "0"}
                  paddingInline={!expanded.step2 ? "400" : undefined}
                  borderRadius="200"
                >
                  <BlockStack gap="0">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {isEmbedActive ? <CompletedIcon /> : <PendingIcon />}
                        <Text variant="bodyMd" fontWeight="bold" tone={isEmbedActive ? "subdued" : (expanded.step2 ? undefined : "subdued")} as="h3">
                          <span style={{ textDecoration: isEmbedActive ? 'line-through' : 'none' }}>Step 2: Make options visible on your storefront</span>
                        </Text>
                      </div>
                      <Button
                        variant="tertiary"
                        tone="neutral"
                        onClick={() => setExpanded({ ...expanded, step2: !expanded.step2 })}
                        icon={expanded.step2 ? ChevronUpIcon : ChevronDownIcon}
                        accessibilityLabel="Toggle step 2 details"
                      />
                    </div>
                    <Collapsible
                      open={expanded.step2}
                      id="step2-collapsible"
                      transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                    >
                      <div style={{ paddingLeft: '30px', paddingTop: '4px' }}>
                        <BlockStack gap="200">
                          <Text tone="subdued" as="p">
                            Enable the app from Shopify's Theme Editor to display your options on the storefront.
                          </Text>
                          <InlineStack>
                            <Button
                              variant={isEmbedActive ? undefined : "primary"}
                              onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${clientId}/product-options`, '_blank')}
                            >
                              {isEmbedActive ? "Deactivate App Embed" : "Enable App Embed"}
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </div>
                    </Collapsible>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Collapsible>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
