import React, { useState } from 'react';
import { BasicSettings } from './BasicSettings';
import { AdvancedSettings } from './AdvancedSettings';
import { ConditionalLogic } from './ConditionalLogic';
import { SelectBasicSettings } from './SelectBasicSettings';
import { TextFieldBasicSettings } from './TextFieldBasicSettings';

interface EditPanelProps {
    editingElement: any;
    setEditingElement: (el: any) => void;
    handleUpdateElement: (data: any) => void;
    handleAddCondition: () => void;
    handleRemoveCondition: (index: number) => void;
    handleUpdateCondition: (index: number, data: any) => void;
    products?: any[];
    availableElements?: any[];
}

export const EditPanel: React.FC<EditPanelProps> = ({
    editingElement,
    setEditingElement,
    handleUpdateElement,
    handleAddCondition,
    handleRemoveCondition,
    handleUpdateCondition,
    products,
    availableElements
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

    return (
        <s-stack direction="vertical">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', paddingInline: 'base', borderBottom: '1px solid #e1e3e5', marginBlockEnd: '16px' }}>
                <s-stack direction="inline" gap="small-500" alignItems="center">
                    <button
                        onClick={() => setEditingElement(null)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                        <s-icon type="chevron-left" size="medium" tone="base"></s-icon>
                    </button>
                    <s-heading>{editingElement.element.label}</s-heading>
                </s-stack>
                <s-stack direction="inline" gap="small" alignItems="center">
                    <s-box background="strong" borderRadius="small" padding="small-400" paddingInline="small">
                        <s-stack direction="inline" gap="small-200" alignItems="center">
                            <s-icon type={editingElement.element.icon} size="small"></s-icon>
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                                {editingElement.element.type.replace('_', ' ')}
                            </span>
                        </s-stack>
                    </s-box>
                </s-stack>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBlockEnd: '16px', borderBlockColor: '#e1e3e5', borderBlockEndWidth: '1px', borderBlockEndStyle: 'solid', paddingBlockEnd: '16px', paddingInline: '16px' }}>
                <button
                    onClick={() => setActiveTab('basic')}
                    style={{
                        padding: '7px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        backgroundColor: activeTab === 'basic' ? '#005bd3' : '#f1f2f4',
                        color: activeTab === 'basic' ? 'white' : '#303030'
                    }}
                >
                    Basic Settings
                </button>
                <button
                    onClick={() => setActiveTab('advanced')}
                    style={{
                        padding: '7px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        backgroundColor: activeTab === 'advanced' ? '#005bd3' : '#f1f2f4',
                        color: activeTab === 'advanced' ? 'white' : '#303030'
                    }}
                >
                    Advanced Settings
                </button>
            </div>

            {activeTab === 'basic' ? (
                ['select', 'radio', 'checkbox', 'checkbox-group', 'color-swatch', 'image-swatch', 'button'].includes(editingElement.element.type) ? (
                    <SelectBasicSettings
                        editingElement={editingElement}
                        handleUpdateElement={handleUpdateElement}
                        products={products}
                    >
                        <ConditionalLogic
                            editingElement={editingElement}
                            handleUpdateElement={handleUpdateElement}
                            handleAddCondition={handleAddCondition}
                            handleRemoveCondition={handleRemoveCondition}
                            availableElements={availableElements}
                            handleUpdateCondition={handleUpdateCondition}
                        />
                    </SelectBasicSettings>
                ) : ['text', 'textarea', 'email', 'phone', 'number', 'color-picker', 'switch'].includes(editingElement.element.type) ? (
                    <TextFieldBasicSettings
                        editingElement={editingElement}
                        handleUpdateElement={handleUpdateElement}
                        products={products}
                    >
                        <ConditionalLogic
                            editingElement={editingElement}
                            handleUpdateElement={handleUpdateElement}
                            handleAddCondition={handleAddCondition}
                            handleRemoveCondition={handleRemoveCondition}
                            availableElements={availableElements}
                            handleUpdateCondition={handleUpdateCondition}
                        />
                    </TextFieldBasicSettings>
                ) : (
                    <BasicSettings
                        editingElement={editingElement}
                        handleUpdateElement={handleUpdateElement}
                    >
                        <ConditionalLogic
                            editingElement={editingElement}
                            handleUpdateElement={handleUpdateElement}
                            handleAddCondition={handleAddCondition}
                            handleRemoveCondition={handleRemoveCondition}
                            availableElements={availableElements}
                            handleUpdateCondition={handleUpdateCondition}
                        />
                    </BasicSettings>
                )
            ) : (
                <AdvancedSettings
                    editingElement={editingElement}
                    handleUpdateElement={handleUpdateElement}
                />
            )}
        </s-stack>
    );
};
