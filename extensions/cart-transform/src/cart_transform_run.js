// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

export function cartTransformRun(input) {
  console.log("SE Product Options: Running Cart Transform...");
  
  const operations = input.cart.lines
    .filter(line => {
      const hasAddons = !!line.attribute?.value;
      const isVariant = line.merchandise?.__typename === "ProductVariant";
      return hasAddons && isVariant;
    })
    .map(line => {
      try {
        if (!line.attribute?.value || !line.merchandise?.id) return null;
        
        const addonData = JSON.parse(line.attribute.value);
        if (!Array.isArray(addonData) || addonData.length === 0) return null;

        const parentQuantity = parseInt(line.quantity) || 1;
        const currencyCode = (line.cost?.amountPerQuantity?.currencyCode || "USD").toUpperCase();
        const parentPrice = parseFloat(line.cost?.amountPerQuantity?.amount || 0);
        
        let totalParentPrice = parentPrice;
        const addonsToExpand = [];

        addonData.forEach(addon => {
          let gid = "";
          let price = 0;
          
          if (typeof addon === "string") {
            gid = addon;
          } else {
            gid = addon.gid;
            price = parseFloat(addon.price || 0);
          }

          if (!gid || gid === "null") {
            // This is a direct price increase for the parent
            totalParentPrice += price;
          } else {
            // This is a product addon
            if (!gid.startsWith("gid://shopify/ProductVariant/")) {
              const numericId = gid.split('/').pop();
              gid = `gid://shopify/ProductVariant/${numericId}`;
            }
            addonsToExpand.push({ gid, price });
          }
        });
        
        const expandedCartItems = [
          {
            merchandiseId: line.merchandise.id,
            quantity: parentQuantity,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: totalParentPrice.toFixed(2)
                }
              }
            }
          }
        ];

        addonsToExpand.forEach(addon => {
          expandedCartItems.push({
            merchandiseId: addon.gid,
            quantity: parentQuantity,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: addon.price.toFixed(2)
                }
              }
            }
          });
        });

        return {
          lineExpand: {
            cartLineId: line.id,
            expandedCartItems: expandedCartItems
          }
        };
      } catch (e) {
        return null;
      }
    })
    .filter(op => op !== null);

  if (operations.length > 0) {
    console.log("SE Product Options: FINAL OPERATIONS:", JSON.stringify(operations));
  }

  return {
    operations: operations
  };
};