import React, { useState, useCallback, useEffect } from 'react';
import { AddonModal } from './AddonModal';
import {
    Modal,
    Text,
    Box,
    BlockStack,
    InlineStack,
    TextField,
    Thumbnail,
    Icon,
    Button,
    Badge,
    Checkbox
} from '@shopify/polaris';
import {
    SearchIcon,
    InfoIcon,
    DeleteIcon,
    ProductIcon
} from '@shopify/polaris-icons';

interface TextFieldBasicSettingsProps {
    editingElement: any;
    handleUpdateElement: (data: any) => void;
    children?: React.ReactNode;
    products?: any[];
}

export const TextFieldBasicSettings: React.FC<TextFieldBasicSettingsProps> = ({
    editingElement,
    handleUpdateElement,
    children,
    products = []
}) => {
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

    const handleRemoveAddon = () => {
        handleUpdateElement({
            price: 0,
            addonProduct: null
        });
    };

    return (
        <s-stack direction="vertical" gap="small-400" paddingInline="base">
            {/* Label + Name */}
            <s-grid gridTemplateColumns="1fr 1fr" gap="small">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>Label</span>
                    </div>
                    <s-text-field
                        required
                        value={editingElement.element.label}
                        onInput={(e: any) => {
                            const newLabel = e.target.value;
                            const currentName = editingElement.element.name || "";
                            const oldLabelSlug = (editingElement.element.label || "").toLowerCase().replace(/[^a-z0-9]/g, '_');

                            const updates: any = { label: newLabel };

                            // Only auto-update name if it was empty or matched the old label's slug
                            if (!currentName || currentName === oldLabelSlug) {
                                updates.name = newLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            }

                            handleUpdateElement(updates);
                        }}
                    ></s-text-field>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>Name</span>
                    </div>
                    <s-text-field
                        required
                        value={editingElement.element.name || editingElement.element.type + '-1'}
                        onInput={(e: any) => handleUpdateElement({ name: e.target.value })}
                    ></s-text-field>
                </div>
            </s-grid>

            {/* Required + Hidden label */}
            <s-grid gridTemplateColumns="1fr 1fr" gap="extra-small" paddingBlockEnd="small-200">
                <s-checkbox
                    label="Required field"
                    checked={editingElement.element.required || false}
                    onInput={(e: any) => handleUpdateElement({ required: e.target.checked })}
                    style={{ fontSize: '11px' }}
                ></s-checkbox>
                <s-checkbox
                    label="Hidden label"
                    checked={editingElement.element.hiddenLabel || false}
                    onInput={(e: any) => handleUpdateElement({ hiddenLabel: e.target.checked })}
                    style={{ fontSize: '11px' }}
                ></s-checkbox>
                {editingElement.element.type === 'switch' && (
                    <s-checkbox
                        label="Selected by default"
                        checked={editingElement.element.selectedByDefault || false}
                        onInput={(e: any) => handleUpdateElement({ selectedByDefault: e.target.checked })}
                        style={{ fontSize: '11px' }}
                    ></s-checkbox>
                )}
            </s-grid>

            {/* Min + Max Characters */}
            {!['phone', 'email', 'color-picker', 'switch'].includes(editingElement.element.type) && (
                <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Min character</span>
                            <s-icon type="info" size="small" tone="subdued"></s-icon>
                        </div>
                        <s-text-field
                            value={editingElement.element.minCharacter || ""}
                            onInput={(e: any) => handleUpdateElement({ minCharacter: e.target.value })}
                            type="number"
                        ></s-text-field>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Max character</span>
                            <s-icon type="info" size="small" tone="subdued"></s-icon>
                        </div>
                        <s-text-field
                            value={editingElement.element.maxCharacter || ""}
                            onInput={(e: any) => handleUpdateElement({ maxCharacter: e.target.value })}
                            type="number"
                        ></s-text-field>
                    </div>
                </s-grid>
            )}

            {editingElement.element.type === 'color-picker' ? (
                <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Default value</span>
                            <s-icon type="info" size="small" tone="subdued"></s-icon>
                        </div>
                        <s-color-field
                            value={editingElement.element.defaultValue || "#000000"}
                            onInput={(e: any) => handleUpdateElement({ defaultValue: e.target.value })}
                        ></s-color-field>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Help text</span>
                        </div>
                        <s-text-field
                            value={editingElement.element.helpText || ""}
                            onInput={(e: any) => handleUpdateElement({ helpText: e.target.value })}
                            suffix="en"
                        ></s-text-field>
                    </div>
                </s-grid>
            ) : (
                <>
                    {/* Placeholder + Help text */}
                    <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                    {editingElement.element.type === 'switch' ? 'Switch label' : 'Placeholder'}
                                </span>
                            </div>
                            <s-text-field
                                value={editingElement.element.placeholder || ""}
                                onInput={(e: any) => handleUpdateElement({ placeholder: e.target.value })}
                                suffix="en"
                            ></s-text-field>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>Help text</span>
                            </div>
                            <s-text-field
                                value={editingElement.element.helpText || ""}
                                onInput={(e: any) => handleUpdateElement({ helpText: e.target.value })}
                                suffix="en"
                            ></s-text-field>
                        </div>
                    </s-grid>

                    {/* Default Value + Character Counter */}
                    {editingElement.element.type !== 'switch' && (
                        <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Default value</span>
                                    <s-icon type="info" size="small" tone="subdued"></s-icon>
                                </div>
                                <s-text-field
                                    value={editingElement.element.defaultValue || ""}
                                    onInput={(e: any) => handleUpdateElement({ defaultValue: e.target.value })}
                                ></s-text-field>
                            </div>
                            {!['phone', 'email', 'color-picker'].includes(editingElement.element.type) && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 500 }}>Character counter</span>
                                    </div>
                                    <div style={{ display: 'flex', backgroundColor: '#f1f2f4', borderRadius: '8px', padding: '2px', height: '32px', boxSizing: 'border-box', alignItems: 'stretch' }}>
                                        <button
                                            onClick={() => handleUpdateElement({ showCharacterCounter: true })}
                                            style={{
                                                flex: 1,
                                                padding: '0 12px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: editingElement.element.showCharacterCounter ? 'white' : 'transparent',
                                                boxShadow: editingElement.element.showCharacterCounter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                color: '#303030',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Show
                                        </button>
                                        <button
                                            onClick={() => handleUpdateElement({ showCharacterCounter: false })}
                                            style={{
                                                flex: 1,
                                                padding: '0 12px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: !editingElement.element.showCharacterCounter ? 'white' : 'transparent',
                                                boxShadow: !editingElement.element.showCharacterCounter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                color: '#303030',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Hide
                                        </button>
                                    </div>
                                </div>
                            )}
                        </s-grid>
                    )}
                </>
            )}

            {/* Add-on Settings */}
            {editingElement.element.type !== 'email' && (
                <>
                    <div style={{ borderTop: '1px solid #e1e3e5', marginBlock: '8px' }}></div>
                    <div>
                        <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '12px' }}>Add-on Settings</span>
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <TextField
                                        label="Add-on"
                                        labelHidden
                                        placeholder="Select add-on"
                                        value={editingElement.element.addonProduct?.title || ""}
                                        prefix={<Icon source={SearchIcon} />}
                                        readOnly
                                        autoComplete="off"
                                    />
                                </div>
                                <Button
                                    onClick={() => setIsCustomModalOpen(true)}
                                >
                                    Browse
                                </Button>
                            </div>
                            <div
                                onClick={() => setIsCustomModalOpen(true)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: '90px',
                                    bottom: 0,
                                    cursor: 'pointer',
                                    zIndex: 1
                                }}
                            />
                        </div>

                        {editingElement.element.price > 0 && !editingElement.element.addonProduct && (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{
                                    padding: '8px 12px',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f2f4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <InlineStack gap="300" blockAlign="center">
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            backgroundColor: '#f1f2f4',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#5c5f62'
                                        }}>
                                            <Text variant="headingMd" as="span">$</Text>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#303030', lineHeight: '1.2' }}>
                                                Price Increase
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#6d7175', lineHeight: '1.2' }}>
                                                Amount: ${editingElement.element.price || "0.00"}
                                            </span>
                                        </div>
                                    </InlineStack>
                                    <Button
                                        icon={DeleteIcon}
                                        variant="tertiary"
                                        tone="critical"
                                        onClick={handleRemoveAddon}
                                        accessibilityLabel="Remove price"
                                    />
                                </div>
                            </div>
                        )}

                        {editingElement.element.addonProduct && (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{
                                    padding: '8px 12px',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f2f4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <InlineStack gap="300" blockAlign="center">
                                        <div
                                            onClick={() => {
                                                const addon = editingElement.element.addonProduct;
                                                const targetId = addon.productId || addon.id;
                                                const numericId = targetId.split('/').pop();
                                                const shop = new URLSearchParams(window.location.search).get('shop');
                                                if (shop) {
                                                    const shopName = shop.split('.')[0];
                                                    const adminUrl = `https://admin.shopify.com/store/${shopName}/products/${numericId}`;
                                                    window.open(adminUrl, '_blank');
                                                } else {
                                                    window.open(`/admin/products/${numericId}`, '_blank');
                                                }
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        >
                                            <Thumbnail
                                                source={editingElement.element.addonProduct.featuredImage?.url || ProductIcon}
                                                alt={editingElement.element.addonProduct.title}
                                                size="small"
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#303030', lineHeight: '1.2' }}>
                                                    {editingElement.element.addonProduct.title}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#6d7175', lineHeight: '1.2' }}>
                                                    Price: ${editingElement.element.price || "0.00"}
                                                </span>
                                            </div>
                                        </div>
                                    </InlineStack>
                                    <Button
                                        icon={DeleteIcon}
                                        variant="tertiary"
                                        tone="critical"
                                        onClick={handleRemoveAddon}
                                        accessibilityLabel="Remove product"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <AddonModal
                open={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                products={products}
                label={editingElement?.element?.label || 'Add-on Product'}
                initialPrice={String(editingElement?.element?.price || '0')}
                onSelect={(data) => {
                    handleUpdateElement({
                        price: data.price,
                        addonProduct: data.addonProduct
                    });
                }}
            />

            <style>{`
                .addon-product-item:hover {
                    background-color: var(--p-color-bg-surface-secondary);
                }
                .Polaris-Modal-Dialog__Container {
                    z-index: 9999 !important;
                }
                .Polaris-Backdrop {
                    z-index: 9998 !important;
                }
            `}</style>

            <div style={{ borderTop: '1px solid #e1e3e5', paddingBlockStart: '8px', marginBlockStart: '8px' }}>
                {children}
            </div>
        </s-stack>
    );
};
