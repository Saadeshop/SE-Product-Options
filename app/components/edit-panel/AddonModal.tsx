import React, { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { 
    Modal, 
    Text, 
    BlockStack, 
    TextField, 
    Thumbnail,
    Icon,
    Badge,
    Checkbox,
    InlineStack
} from '@shopify/polaris';
import { 
    SearchIcon, 
    InfoIcon, 
    ProductIcon
} from '@shopify/polaris-icons';

interface AddonModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (data: { price: number; addonProduct?: any }) => void;
    products: any[];
    initialPrice?: string;
    label?: string;
    initialTabIndex?: number;
}

export const AddonModal: React.FC<AddonModalProps> = ({
    open,
    onClose,
    onSelect,
    products = [],
    initialPrice = '0',
    label = 'Add-on',
    initialTabIndex = 0
}) => {
    const [tabIndex, setTabIndex] = useState(initialTabIndex);
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedVariantId, setTempSelectedVariantId] = useState<string | null>(null);
    const [tempSelectedProductId, setTempSelectedProductId] = useState<string | null>(null);
    const [generatedPrice, setGeneratedPrice] = useState(initialPrice);
    const generateFetcher = useFetcher();
    const isGenerating = generateFetcher.state === 'submitting';

    useEffect(() => {
        if (open) {
            setTabIndex(initialTabIndex);
            setGeneratedPrice(initialPrice);
            setSearchQuery('');
            setTempSelectedVariantId(null);
            setTempSelectedProductId(null);
        }
    }, [open, initialTabIndex, initialPrice]);

    useEffect(() => {
        if (generateFetcher.data?.data?.productCreate?.product) {
            const product = generateFetcher.data.data.productCreate.product;
            const variant = product.variants?.nodes?.[0];

            let finalId = variant ? variant.id : product.id;
            let finalTitle = product.title;
            let finalPrice = variant ? variant.price : 0;

            onSelect({
                price: parseFloat(finalPrice) || 0,
                addonProduct: {
                    id: finalId,
                    productId: product.id,
                    variantId: variant?.id || null,
                    title: finalTitle,
                    featuredImage: product.featuredImage || null
                }
            });
            onClose();
        }
    }, [generateFetcher.data, onSelect, onClose]);

    const handleSaveCustomSelection = () => {
        if (!tempSelectedVariantId && !tempSelectedProductId) return;

        let selectedProduct = null;
        let selectedVariant = null;

        if (tempSelectedVariantId) {
            for (const p of products) {
                const variant = p.variants?.nodes?.find((v: any) => v.id === tempSelectedVariantId);
                if (variant) {
                    selectedProduct = p;
                    selectedVariant = variant;
                    break;
                }
            }
        } else if (tempSelectedProductId) {
            selectedProduct = products.find((p: any) => p.id === tempSelectedProductId);
            selectedVariant = selectedProduct?.variants?.nodes?.[0];
        }

        if (selectedProduct) {
            let finalId = selectedVariant ? selectedVariant.id : selectedProduct.id;
            let finalTitle = selectedVariant && selectedVariant.title !== 'Default Title' ? `${selectedProduct.title} - ${selectedVariant.title}` : selectedProduct.title;
            let finalPrice = selectedVariant ? selectedVariant.price : 0;
            let finalImageUrl = selectedVariant?.image?.url || selectedProduct.featuredImage?.url || null;

            onSelect({
                price: parseFloat(finalPrice) || 0,
                addonProduct: {
                    id: finalId,
                    productId: selectedProduct.id,
                    variantId: selectedVariant?.id || null,
                    title: finalTitle,
                    featuredImage: finalImageUrl ? { url: finalImageUrl } : null
                }
            });
        }
        onClose();
    };

    const filteredProducts = Array.isArray(products) 
        ? products.filter(p => (p?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
        : [];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add-on Configuration"
            primaryAction={{
                content: tabIndex === 0 ? 'Select' : (tabIndex === 1 ? 'Generate product' : 'Save'),
                onAction: () => {
                    if (tabIndex === 0) {
                        handleSaveCustomSelection();
                    } else if (tabIndex === 1) {
                        generateFetcher.submit(
                            { title: label, price: generatedPrice },
                            { method: 'POST', action: '/app/create-product' }
                        );
                    } else if (tabIndex === 2) {
                        onSelect({
                            price: parseFloat(generatedPrice) || 0,
                            addonProduct: null
                        });
                        onClose();
                    }
                },
                disabled: tabIndex === 0 ? (!tempSelectedVariantId && !tempSelectedProductId) : (!generatedPrice),
                loading: isGenerating
            }}
            secondaryActions={[
                {
                    content: 'Cancel',
                    onAction: onClose,
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="200">
                    <div style={{ 
                        display: 'flex', 
                        background: '#f6f6f7', 
                        padding: '3px', 
                        borderRadius: '10px', 
                        gap: '2px', 
                        border: '1px solid #ebebed',
                        marginBottom: '8px'
                    }}>
                        <div 
                            onClick={() => setTabIndex(0)}
                            style={{ 
                                flex: 1, 
                                textAlign: 'center', 
                                padding: '6px 10px', 
                                background: tabIndex === 0 ? 'white' : 'transparent', 
                                borderRadius: '8px', 
                                boxShadow: tabIndex === 0 ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: tabIndex === 0 ? 600 : 500,
                                color: tabIndex === 0 ? '#1a1a1a' : '#616161',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: tabIndex === 0 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Use existing product
                        </div>
                        <div 
                            onClick={() => setTabIndex(1)}
                            style={{ 
                                flex: 1, 
                                textAlign: 'center', 
                                padding: '6px 10px', 
                                background: tabIndex === 1 ? 'white' : 'transparent', 
                                borderRadius: '8px', 
                                boxShadow: tabIndex === 1 ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: tabIndex === 1 ? 600 : 500,
                                color: tabIndex === 1 ? '#1a1a1a' : '#616161',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: tabIndex === 1 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Automatically generate product
                        </div>
                        <div 
                            onClick={() => setTabIndex(2)}
                            style={{ 
                                flex: 1, 
                                textAlign: 'center', 
                                padding: '6px 10px', 
                                background: tabIndex === 2 ? 'white' : 'transparent', 
                                borderRadius: '8px', 
                                boxShadow: tabIndex === 2 ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: tabIndex === 2 ? 600 : 500,
                                color: tabIndex === 2 ? '#1a1a1a' : '#616161',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                border: tabIndex === 2 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Add price
                            <Badge tone="success">New</Badge>
                        </div>
                    </div>

                    {tabIndex === 0 ? (
                        <>
                            <TextField
                                label="Search products"
                                labelHidden
                                placeholder="Search products"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                prefix={<Icon source={SearchIcon} />}
                                autoComplete="off"
                            />

                            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e1e3e5', borderRadius: '8px' }}>
                                {filteredProducts.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <Text variant="bodyMd" as="span" tone="subdued">No products found</Text>
                                    </div>
                                ) : (
                                    filteredProducts.map((p: any) => {
                                        let variants = [];
                                        if (p.variants?.nodes) variants = p.variants.nodes;
                                        else if (p.variants?.edges) variants = p.variants.edges.map((e: any) => e.node);
                                        else if (Array.isArray(p.variants)) variants = p.variants;
                                        
                                        const hasMultipleVariants = variants.length > 0;
                                        const isSelected = tempSelectedProductId === p.id;

                                        return (
                                            <div key={p.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                                                <div 
                                                    style={{ 
                                                        padding: '12px 16px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? '#f9fafb' : 'white'
                                                    }}
                                                    onClick={() => {
                                                        if (variants.length > 0) {
                                                            setTempSelectedVariantId(variants[0].id);
                                                            setTempSelectedProductId(null);
                                                        } else {
                                                            setTempSelectedProductId(p.id);
                                                            setTempSelectedVariantId(null);
                                                        }
                                                    }}
                                                >
                                                    <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                                                        <Checkbox
                                                            label=""
                                                            labelHidden
                                                            checked={isSelected || variants.some((v: any) => v.id === tempSelectedVariantId) ? (variants.length > 1 ? 'indeterminate' : true) : false}
                                                            onChange={() => {
                                                                if (variants.length > 0) {
                                                                    setTempSelectedVariantId(variants[0].id);
                                                                    setTempSelectedProductId(null);
                                                                } else {
                                                                    setTempSelectedProductId(p.id);
                                                                    setTempSelectedVariantId(null);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <Thumbnail
                                                        source={p.featuredImage?.url || ProductIcon}
                                                        alt={p.title}
                                                        size="small"
                                                    />
                                                    <div style={{ marginLeft: '12px', flex: 1 }}>
                                                        <Text variant="bodyMd" as="span" fontWeight="semibold">{p.title}</Text>
                                                        {hasMultipleVariants && (
                                                            <Text variant="bodySm" as="p" tone="subdued">{variants.length} variants</Text>
                                                        )}
                                                    </div>
                                                </div>

                                                {hasMultipleVariants && (
                                                    <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #f1f2f4' }}>
                                                        {variants.map((v: any, index: number) => (
                                                            <div 
                                                                key={v.id} 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTempSelectedVariantId(v.id);
                                                                    setTempSelectedProductId(null);
                                                                }}
                                                                style={{ 
                                                                    padding: '12px 16px 12px 48px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer',
                                                                    borderBottom: index < variants.length - 1 ? '1px solid #f1f2f4' : 'none',
                                                                    backgroundColor: tempSelectedVariantId === v.id ? '#f1f8f5' : 'transparent'
                                                                }}
                                                            >
                                                                <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                                                                    <Checkbox
                                                                        label=""
                                                                        labelHidden
                                                                        checked={tempSelectedVariantId === v.id}
                                                                        onChange={() => {
                                                                            setTempSelectedVariantId(v.id);
                                                                            setTempSelectedProductId(null);
                                                                        }}
                                                                    />
                                                                </div>
                                                                {v.image?.url && (
                                                                    <div style={{ marginRight: '12px' }}>
                                                                        <Thumbnail
                                                                            source={v.image.url}
                                                                            alt={v.title}
                                                                            size="small"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div style={{ flex: 1 }}>
                                                                    <Text variant="bodyMd" as="span">{v.title}</Text>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <Text variant="bodyMd" as="span">${parseFloat(v.price).toFixed(2)}</Text>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : tabIndex === 1 ? (
                        <BlockStack gap="400">
                            <TextField
                                label="Product title"
                                value={label}
                                onChange={() => {}}
                                disabled
                                autoComplete="off"
                            />
                            <TextField
                                label="Variant title"
                                value="Default Title"
                                onChange={() => {}}
                                disabled
                                autoComplete="off"
                            />
                            <TextField
                                label="Price"
                                value={generatedPrice}
                                onChange={setGeneratedPrice}
                                type="number"
                                prefix="$"
                                autoComplete="off"
                            />
                        </BlockStack>
                    ) : (
                        <BlockStack gap="200">
                            <div style={{
                                backgroundColor: '#ebf5fe',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                marginBottom: '5px'
                            }}>
                                <div style={{ color: '#004c8f', display: 'flex' }}>
                                    <Icon source={InfoIcon} />
                                </div>
                                <div style={{ color: '#004c8f', fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>
                                    Increase the product price without creating an add-on.
                                </div>
                            </div>
                            <TextField
                                label="Price"
                                value={generatedPrice}
                                onChange={setGeneratedPrice}
                                type="number"
                                prefix="$"
                                autoComplete="off"
                            />
                        </BlockStack>
                    )}
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
};
