import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    try {
        // 1. Create staged upload
        const stagedResponse = await admin.graphql(
            `#graphql
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                stagedUploadsCreate(input: $input) {
                    stagedTargets {
                        url
                        resourceUrl
                        parameters {
                            name
                            value
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
                    input: [
                        {
                            filename: file.name,
                            mimeType: file.type,
                            resource: "FILE",
                            httpMethod: "POST"
                        }
                    ]
                }
            }
        );

        const stagedData = await stagedResponse.json();
        if (stagedData.data.stagedUploadsCreate.userErrors?.length) {
            return Response.json({ error: stagedData.data.stagedUploadsCreate.userErrors[0].message }, { status: 400 });
        }
        
        const target = stagedData.data.stagedUploadsCreate.stagedTargets?.[0];
        if (!target) {
            return Response.json({ error: "Failed to create staged upload target" }, { status: 500 });
        }

        // 2. Upload to the staged target
        const uploadFormData = new FormData();
        target.parameters.forEach(({ name, value }: { name: string; value: string }) => {
            uploadFormData.append(name, value);
        });
        uploadFormData.append("file", file);

        const uploadResponse = await fetch(target.url, {
            method: "POST",
            body: uploadFormData
        });

        if (!uploadResponse.ok) {
            return Response.json({ error: "Failed to upload to Google Cloud Storage" }, { status: 500 });
        }

        // 3. Create file in Shopify
        const createFileResponse = await admin.graphql(
            `#graphql
            mutation fileCreate($files: [FileCreateInput!]!) {
                fileCreate(files: $files) {
                    files {
                        id
                        alt
                        ... on GenericFile {
                            url
                        }
                        ... on MediaImage {
                            image {
                                url
                            }
                            preview {
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
                    files: [
                        {
                            originalSource: target.resourceUrl,
                            contentType: "IMAGE",
                            alt: file.name
                        }
                    ]
                }
            }
        );

        const createFileData = await createFileResponse.json();
        console.log("File Create Response:", JSON.stringify(createFileData, null, 2));

        if (createFileData.data.fileCreate.userErrors?.length) {
            return Response.json({ error: createFileData.data.fileCreate.userErrors[0].message }, { status: 400 });
        }

        const initialFile = createFileData.data.fileCreate.files[0];
        if (!initialFile) {
            return Response.json({ error: "File creation failed - no file returned" }, { status: 500 });
        }

        const fileId = initialFile.id;
        let url = null;
        let attempts = 0;
        const maxAttempts = 5;

        // Poll for the URL as Shopify processes the image
        while (!url && attempts < maxAttempts) {
            if (attempts > 0) await new Promise(resolve => setTimeout(resolve, 1000));
            
            const pollResponse = await admin.graphql(
                `#graphql
                query getFile($id: ID!) {
                    node(id: $id) {
                        ... on MediaImage {
                            image { url }
                            preview { image { url } }
                        }
                    }
                }`,
                { variables: { id: fileId } }
            );
            
            const pollData = await pollResponse.json();
            const file = pollData.data.node;
            url = file?.image?.url || file?.preview?.image?.url;
            attempts++;
            console.log(`Polling attempt ${attempts} for ${fileId}: ${url ? 'Success' : 'Still processing'}`);
        }

        if (!url) {
            console.error("No URL found after polling for file:", fileId);
            return Response.json({ error: "Image processing taking too long. Please refresh in a moment." }, { status: 500 });
        }

        return Response.json({ url, fileId });
    } catch (error) {
        console.error("Upload error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
};
