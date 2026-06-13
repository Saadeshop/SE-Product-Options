import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import db from "../db.server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

// Handle preflight OPTIONS request
export const loader = async ({ request }: LoaderFunctionArgs) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
};

// Handle actual POST payload from storefront
export const action = async ({ request }: ActionFunctionArgs) => {
    console.log("SE Product Options: API Request received from", request.url);
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { shop, product, collections } = body;

        if (!shop || !product) {
            return Response.json({ error: "Missing shop or product data" }, { status: 400, headers: corsHeaders });
        }

        const optionSets = await db.optionSet.findMany({
            where: { shop, status: "active" }
        });

        let settings = null;
        try {
            const record = await db.setting.findUnique({ where: { shop } });
            if (record?.settings) {
                settings = JSON.parse(record.settings as string);
                console.log("SE: Returning settings for shop", shop, "- appBackground:", settings?.colors?.general?.appBackground);
            } else {
                console.log("SE: No settings record found for shop", shop);
            }
        } catch (e) {
            console.error("Failed to fetch settings for storefront API:", e);
        }

        const filteredSets = optionSets.filter(set => {
            // Rule 1: All products
            if (set.selectionMode === "all") return true;

            // Rule 2: Manual selection
            if (set.selectionMode === "manual") {
                const selectedProducts = JSON.parse(set.selectedProducts || "[]");
                return selectedProducts.some((p: any) =>
                    p.id === product.id ||
                    p.id === `gid://shopify/Product/${product.id}` ||
                    p.id.toString().split('/').pop() === product.id.toString()
                );
            }

            // Rule 3: Automatic (Rule based)
            if (set.selectionMode === "automatic") {
                try {
                    const conditions = JSON.parse(set.conditions || "[]");
                    if (conditions.length === 0) return false;

                    const evaluateCondition = (cond: any) => {
                        const { type, operator, value } = cond;
                        let productValue: any = null;

                        switch (type) {
                            case "tag": productValue = product.tags; break;
                            case "title": productValue = product.title; break;
                            case "type": productValue = product.type; break;
                            case "vendor": productValue = product.vendor; break;
                            case "price": productValue = (product.price / 100).toString(); break;
                            case "collection": productValue = (collections || []).map((c: any) => c.title); break;
                        }

                        const targetValue = (value || "").toString().toLowerCase().trim();
                        const isEquals = operator === "equals";

                        if (Array.isArray(productValue)) {
                            // Arrays like tags or collections
                            const hasMatch = productValue.some((v: string) => v.toLowerCase().trim() === targetValue);
                            return isEquals ? hasMatch : !hasMatch;
                        } else if (typeof productValue === "string") {
                            // Liquid tags might be a comma separated string
                            if (type === "tag") {
                                const tags = productValue.split(",").map(t => t.toLowerCase().trim());
                                const hasMatch = tags.includes(targetValue);
                                return isEquals ? hasMatch : !hasMatch;
                            } else {
                                const match = productValue.toLowerCase().trim() === targetValue;
                                return isEquals ? match : !match;
                            }
                        } else if (typeof productValue === "number") {
                            const match = productValue.toString() === targetValue;
                            return isEquals ? match : !match;
                        }

                        return false;
                    };

                    // For now we enforce ALL conditions must match.
                    return conditions.every(evaluateCondition);
                } catch (e) {
                    console.error("Failed to evaluate conditions for set", set.id, e);
                    return false;
                }
            }

            return false;
        });

        return Response.json(
            {
                optionSets: filteredSets,
                settings: settings
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
    }
};
