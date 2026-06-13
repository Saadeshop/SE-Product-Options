import { type ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const price = formData.get("price") as string;

    // 1. Create the base product as ACTIVE
    const createResponse = await admin.graphql(
        `#graphql
        mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                }
                userErrors {
                    field
                    message
                }
            }
        }`,
        {
            variables: {
                input: {
                    title: title,
                    vendor: "SE Product Options",
                    status: "ACTIVE"
                }
            }
        }
    );

    const createData = await createResponse.json();
    if (createData.data?.productCreate?.userErrors?.length > 0) {
        return Response.json(createData);
    }

    const productId = createData.data.productCreate.product.id;

    // 2. Create the Product Media (Image)
    try {
        await admin.graphql(
            `#graphql
            mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
                productCreateMedia(media: $media, productId: $productId) {
                    media {
                        status
                    }
                    mediaUserErrors {
                        field
                        message
                    }
                }
            }`,
            {
                variables: {
                    productId: productId,
                    media: [
                        {
                            alt: title,
                            mediaContentType: "IMAGE",
                            originalSource: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                        }
                    ]
                }
            }
        );
        console.log("SE Product Options: Media created for product.");
    } catch (e) {
        console.error("SE Product Options: Failed to create media:", e);
    }

    // 3. Get the default variant ID and update price
    const productInfoResponse = await admin.graphql(
        `#graphql
        query product($id: ID!) {
            product(id: $id) {
                variants(first: 1) {
                    nodes {
                        id
                    }
                }
            }
        }`,
        { variables: { id: productId } }
    );
    const productInfo = await productInfoResponse.json();
    const defaultVariantId = productInfo.data.product.variants.nodes[0].id;

    const updateResponse = await admin.graphql(
        `#graphql
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                product {
                    id
                    title
                    featuredImage {
                        url
                    }
                    variants(first: 1) {
                        nodes {
                            id
                            title
                            price
                            image {
                                url
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }`,
        {
            variables: {
                productId: productId,
                variants: [
                    {
                        id: defaultVariantId,
                        price: price
                    }
                ]
            }
        }
    );

    const updateData = await updateResponse.json();
    if (updateData.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
        return Response.json(updateData);
    }

    const finalProduct = updateData.data.productVariantsBulkUpdate.product;

    // 4. Brute-force publish to ALL available channels
    try {
        const pubResponse = await admin.graphql(
            `#graphql
            query {
                publications(first: 50) {
                    nodes {
                        id
                        name
                    }
                }
            }`
        );
        const pubData = await pubResponse.json();
        const publications = pubData.data?.publications?.nodes || [];
        
        for (const pub of publications) {
            await admin.graphql(
                `#graphql
                mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
                    publishablePublish(id: $id, input: $input) {
                        userErrors {
                            field
                            message
                        }
                    }
                }`,
                {
                    variables: {
                        id: finalProduct.id,
                        input: [{ publicationId: pub.id }]
                    }
                }
            );
        }
        console.log("SE Product Options: Published to all channels.");
    } catch (e) {
        console.error("SE Product Options: Publishing error:", e);
    }

    // 5. Finally, set status to UNLISTED
    try {
        await admin.graphql(
            `#graphql
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product {
                        id
                        status
                    }
                }
            }`,
            {
                variables: {
                    input: {
                        id: finalProduct.id,
                        status: "UNLISTED"
                    }
                }
            }
        );
        console.log("SE Product Options: Product status set to UNLISTED.");
    } catch (e) {
        console.error("SE Product Options: Error setting status to UNLISTED:", e);
    }

    return Response.json({
        data: {
            productCreate: {
                product: finalProduct
            }
        }
    });
};
