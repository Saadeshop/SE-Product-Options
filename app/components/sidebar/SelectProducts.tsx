import React from 'react';
import { useAppBridge } from "@shopify/app-bridge-react";
import {
    BlockStack,
    InlineStack,
    Box,
    Text,
    Select,
    TextField,
    Button,
    RadioButton,
    Icon,
    Thumbnail
} from "@shopify/polaris";
import {
    PlusIcon,
    DeleteIcon,
    QuestionCircleIcon,
    ProductIcon
} from "@shopify/polaris-icons";

interface SelectProductsProps {
    allProducts?: any[];
    selectionMode: 'manual' | 'automatic' | 'all';
    setSelectionMode: (mode: 'manual' | 'automatic' | 'all') => void;
    selectedProducts: any[];
    setSelectedProducts: (products: any[]) => void;
    conditions: any[];
    setConditions: (conditions: any[]) => void;
    matchType: 'all' | 'any';
    setMatchType: (type: 'all' | 'any') => void;
}

export const SelectProducts: React.FC<SelectProductsProps> = ({
    allProducts = [],
    selectionMode,
    setSelectionMode,
    selectedProducts,
    setSelectedProducts,
    conditions,
    setConditions,
    matchType,
    setMatchType
}) => {
    const shopify = useAppBridge();
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleOpenPicker = async () => {
        const selection = await shopify.resourcePicker({
            type: 'product',
            multiple: true,
            filter: {
                variants: false,
            },
            selectionIds: selectedProducts.map(p => ({ id: p.id }))
        });

        if (selection) {
            setSelectedProducts(selection.map((p: any) => ({
                id: p.id,
                title: p.title,
                handle: p.handle,
                featuredImage: p.images?.[0] ? { url: p.images[0].originalSrc } : null
            })));
        }
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const handleAddCondition = () => {
        setConditions([...conditions, { id: Date.now(), type: 'tag', operator: 'equals', value: '' }]);
    };

    const handleRemoveCondition = (id: number) => {
        if (conditions.length > 1) {
            setConditions(conditions.filter(c => c.id !== id));
        }
    };

    const updateCondition = (id: number, field: string, value: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    return (
        <BlockStack>
            <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                        <Text as="h2" variant="headingSm">Select products</Text>
                        <Icon source={QuestionCircleIcon} tone="subdued" />
                    </InlineStack>
                </InlineStack>
            </Box>

            <BlockStack gap="0">
                {/* Manual Selection */}
                <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="medium">Manual Selection</Text>
                            <Text as="span" variant="bodySm" tone="subdued">Choose specific products to apply this option set.</Text>
                        </BlockStack>
                        <div
                            onClick={() => setSelectionMode('manual')}
                            style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}
                        >
                            <input type="checkbox" checked={selectionMode === 'manual'} readOnly style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selectionMode === 'manual' ? 'black' : '#ccc', transition: '.4s', borderRadius: '34px' }}></span>
                            <span style={{ position: 'absolute', height: '14px', width: '14px', left: selectionMode === 'manual' ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                        </div>
                    </InlineStack>

                    <div style={{
                        maxHeight: selectionMode === 'manual' ? '1000px' : '0',
                        opacity: selectionMode === 'manual' ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        marginTop: selectionMode === 'manual' ? '16px' : '0',
                        visibility: selectionMode === 'manual' ? 'visible' : 'hidden',
                        padding: '2px'
                    }}>
                        <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
                            <s-grid-item>
                                <s-search-field
                                    label="Search products"
                                    labelAccessibilityVisibility="exclusive"
                                    placeholder="Search products"
                                    value={searchQuery}
                                    onInput={(e: any) => setSearchQuery(e.target.value)}
                                />
                            </s-grid-item>
                            <s-grid-item>
                                <s-button onClick={handleOpenPicker}>Browse</s-button>
                            </s-grid-item>
                        </s-grid>

                        <div style={{ marginTop: '16px' }}>
                            {selectedProducts.length > 0 ? (
                                <s-box
                                    background="strong"
                                    border="base"
                                    borderRadius="base"
                                    borderStyle="solid"
                                    overflow="hidden"
                                >
                                    <s-table>
                                        <s-table-header-row>
                                            <s-table-header listSlot="primary">Product</s-table-header>
                                            <s-table-header listSlot="secondary">
                                                <s-stack direction="inline" alignItems="end" />
                                            </s-table-header>
                                        </s-table-header-row>
                                        <s-table-body>
                                            {selectedProducts.map((product) => (
                                                <s-table-row key={product.id}>
                                                    <s-table-cell>
                                                        <s-stack direction="inline" gap="base" alignItems="center">
                                                            <s-box border="base" borderRadius="base" overflow="hidden" maxInlineSize="40px" maxBlockSize="40px">
                                                                <s-image alt={product.title} src={product.featuredImage?.url || "https://cdn.shopify.com/s/files/1/0070/7032/files/trending-products_87095493-27e5-408a-b8f2-51034d60ef4f.png"} />
                                                            </s-box>
                                                            {product.title}
                                                        </s-stack>
                                                    </s-table-cell>
                                                    <s-table-cell>
                                                        <s-stack alignItems="end">
                                                            <s-button
                                                                tone="neutral"
                                                                variant="tertiary"
                                                                onClick={() => handleRemoveProduct(product.id)}
                                                            >
                                                                <s-icon type="delete" size="medium" tone="base"></s-icon>
                                                            </s-button>
                                                        </s-stack>
                                                    </s-table-cell>
                                                </s-table-row>
                                            ))}
                                        </s-table-body>
                                    </s-table>
                                </s-box>
                            ) : (
                                <div style={{
                                    padding: '24px',
                                    background: 'var(--p-color-bg-surface-secondary)',
                                    borderRadius: 'var(--p-border-radius-200)',
                                    border: '1px dashed var(--p-color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BlockStack gap="200" align="center" inlineAlign="center">
                                        <div style={{ width: '40px', height: '40px', background: 'var(--p-color-bg-surface-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon source={ProductIcon} tone="subdued" />
                                        </div>
                                        <Text variant="bodySm" fontWeight="semibold" tone="subdued" as="span">No products found</Text>
                                    </BlockStack>
                                </div>
                            )}
                        </div>
                    </div>
                </Box>

                {/* Automatic Rules */}
                <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="medium">Automatic Rules</Text>
                            <Text as="span" variant="bodySm" tone="subdued">Apply options based on product conditions (e.g. tags, collections).</Text>
                        </BlockStack>
                        <div
                            onClick={() => setSelectionMode('automatic')}
                            style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}
                        >
                            <input type="checkbox" checked={selectionMode === 'automatic'} readOnly style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selectionMode === 'automatic' ? 'black' : '#ccc', transition: '.4s', borderRadius: '34px' }}></span>
                            <span style={{ position: 'absolute', height: '14px', width: '14px', left: selectionMode === 'automatic' ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                        </div>
                    </InlineStack>

                    <div style={{
                        maxHeight: selectionMode === 'automatic' ? '1000px' : '0',
                        opacity: selectionMode === 'automatic' ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        marginTop: selectionMode === 'automatic' ? '16px' : '0',
                        visibility: selectionMode === 'automatic' ? 'visible' : 'hidden',
                        padding: '2px'
                    }}>
                        <BlockStack gap="400">
                            <Text as="h3" variant="headingSm">Conditions</Text>

                            <InlineStack gap="400" blockAlign="center">
                                <Text as="span" variant="bodyMd" tone="subdued">Products must match:</Text>
                                <InlineStack gap="400">
                                    <RadioButton
                                        label="all conditions"
                                        checked={matchType === 'all'}
                                        onChange={() => setMatchType('all')}
                                    />
                                    <RadioButton
                                        label="any condition"
                                        checked={matchType === 'any'}
                                        onChange={() => setMatchType('any')}
                                    />
                                </InlineStack>
                            </InlineStack>

                            <BlockStack gap="200">
                                {conditions.map((condition) => (
                                    <div key={condition.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                                        <Select
                                            label="Condition type"
                                            labelHidden
                                            value={condition.type}
                                            onChange={(val) => updateCondition(condition.id, 'type', val)}
                                            options={[
                                                { label: 'Product tag', value: 'tag' },
                                                { label: 'Product title', value: 'title' },
                                                { label: 'Product type', value: 'type' },
                                                { label: 'Product vendor', value: 'vendor' },
                                                { label: 'Product price', value: 'price' },
                                                { label: 'Collection', value: 'collection' }
                                            ]}
                                        />
                                        <Select
                                            label="Operator"
                                            labelHidden
                                            value={condition.operator}
                                            onChange={(val) => updateCondition(condition.id, 'operator', val)}
                                            options={[
                                                { label: 'is equal to', value: 'equals' },
                                                { label: 'is not equal to', value: 'not_equals' }
                                            ]}
                                        />
                                        <TextField
                                            label="Value"
                                            labelHidden
                                            value={condition.value}
                                            onChange={(val) => updateCondition(condition.id, 'value', val)}
                                            placeholder="Value"
                                            autoComplete="off"
                                        />
                                        <s-button
                                            icon="delete"
                                            variant="plain"
                                            onClick={() => handleRemoveCondition(condition.id)}
                                            disabled={conditions.length === 1}
                                        />
                                    </div>
                                ))}
                            </BlockStack>

                            <InlineStack>
                                <Button icon={PlusIcon} onClick={handleAddCondition}>
                                    Add another condition
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </div>
                </Box>

                {/* Apply to All Products */}
                <Box padding="400" borderBlockEndWidth="025" borderColor="border">
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="medium">Apply to All Products</Text>
                            <Text as="span" variant="bodySm" tone="subdued">Automatically apply this option set to all store products.</Text>
                        </BlockStack>
                        <div
                            onClick={() => setSelectionMode('all')}
                            style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}
                        >
                            <input type="checkbox" checked={selectionMode === 'all'} readOnly style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selectionMode === 'all' ? 'black' : '#ccc', transition: '.4s', borderRadius: '34px' }}></span>
                            <span style={{ position: 'absolute', height: '14px', width: '14px', left: selectionMode === 'all' ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                        </div>
                    </InlineStack>
                </Box>
            </BlockStack>
        </BlockStack>
    );
};
