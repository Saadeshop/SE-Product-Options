import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const sessions = await prisma.session.findMany({
    where: { shop: { contains: 'myshopify.com' } }
  });
  
  console.log("Found sessions:", sessions.map(s => s.shop));
  
  for (const session of sessions) {
    if (!session.accessToken) continue;
    
    console.log(`Checking shop: ${session.shop}`);
    try {
      const functionId = process.env.SHOPIFY_CART_TRANSFORM_ID || "723515e5-bc2e-45c6-6942-564c29099db8e998c0bc"; 
      const response = await fetch(`https://${session.shop}/admin/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken
        },
        body: JSON.stringify({
          query: `
            mutation {
              cartTransformCreate(functionId: "019e0de0-3601-7572-a822-4d6af0d21ec9") {
                cartTransform {
                  id
                  functionId
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `
        })
      });
      const data = await response.json();
      console.log(`Result for ${session.shop}:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
