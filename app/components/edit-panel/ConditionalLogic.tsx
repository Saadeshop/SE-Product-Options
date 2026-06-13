import React from 'react';

interface ConditionalLogicProps {
    editingElement: any;
    handleUpdateElement: (data: any) => void;
    handleAddCondition: () => void;
    handleRemoveCondition: (index: number) => void;
    handleUpdateCondition: (index: number, data: any) => void;
    availableElements?: any[];
}

export const ConditionalLogic: React.FC<ConditionalLogicProps> = ({
    editingElement,
    handleUpdateElement,
    handleAddCondition,
    availableElements,
    handleRemoveCondition,
    handleUpdateCondition
}) => {
    return (
        <s-stack direction="vertical" gap="small-400">
            <s-stack direction="inline" gap="small-400" alignItems="center" justifyContent="space-between">
                <s-checkbox
                    label="Conditional logic"
                    checked={editingElement.element.logicEnabled}
                    onInput={(e: any) => handleUpdateElement({ logicEnabled: e.target.checked })}
                    style={{ '--s-checkbox-label-font-size': '12px' } as any}
                ></s-checkbox>
            </s-stack>

            {editingElement.element.logicEnabled && (
                <s-box background="strong" padding="base" borderRadius="base">
                    <s-stack gap="small">
                        <s-stack direction="inline" gap="small-200" alignItems="center">
                            <div style={{ width: '90px' }}>
                                <s-select
                                    value={editingElement.element.logicType || "Show"}
                                    onInput={(e: any) => handleUpdateElement({ logicType: e.target.value })}
                                >
                                    <s-option value="Show">Show</s-option>
                                    <s-option value="Hide">Hide</s-option>
                                </s-select>
                            </div>
                            <span style={{ fontSize: '12px' }}>this field if</span>
                            <div style={{ width: '80px' }}>
                                <s-select
                                    value={editingElement.element.logicOperator || "All"}
                                    onInput={(e: any) => handleUpdateElement({ logicOperator: e.target.value })}
                                >
                                    <s-option value="All">All</s-option>
                                    <s-option value="Any">Any</s-option>
                                </s-select>
                            </div>
                            <span style={{ fontSize: '12px' }}>of the following match:</span>
                        </s-stack>

                        <s-stack gap="small">
                            {(editingElement.element.conditions || [{ field: "", operator: "EQUALS", value: "" }]).map((condition: any, condIndex: number) => (
                                <s-grid key={condIndex} gridTemplateColumns="1fr 1fr 1fr auto" gap="small-200" alignItems="center">
                                    <s-select
                                        value={condition.field}
                                        onInput={(e: any) => handleUpdateCondition(condIndex, { field: e.target.value })}
                                    >
                                        <s-option value="">-- Please select --</s-option>
                                        <s-option value="shopify_variant">Shopify variant</s-option>
                                        {availableElements?.map((el: any) => (
                                            <s-option key={el.id} value={el.id}>{el.label || el.type}</s-option>
                                        ))}
                                    </s-select>
                                    <s-select
                                        value={condition.operator}
                                        onInput={(e: any) => handleUpdateCondition(condIndex, { operator: e.target.value })}
                                    >
                                        <s-option value="EQUALS">is equal to</s-option>
                                        <s-option value="NOT_EQUALS">is not equal to</s-option>
                                        <s-option value="GREATER_THAN">is greater than</s-option>
                                        <s-option value="LESS_THAN">is less than</s-option>
                                        <s-option value="STARTS_WITH">starts with</s-option>
                                        <s-option value="ENDS_WITH">ends with</s-option>
                                        <s-option value="CONTAINS">contains</s-option>
                                        <s-option value="NOT_CONTAINS">does not contain</s-option>
                                    </s-select>
                                    <s-text-field
                                        placeholder="Value"
                                        value={condition.value}
                                        onInput={(e: any) => handleUpdateCondition(condIndex, { value: e.target.value })}
                                    ></s-text-field>
                                    <s-button
                                        variant="secondary"
                                        style={{ height: '36px' }}
                                        onClick={() => handleRemoveCondition(condIndex)}
                                    >
                                        <s-icon type="delete" size="medium" tone="base"></s-icon>
                                    </s-button>
                                </s-grid>
                            ))}
                        </s-stack>

                        <div style={{ marginTop: '12px' }}>
                            <s-button variant="secondary" onClick={handleAddCondition}>
                                <s-stack direction="inline" gap="small-500" alignItems="center">
                                    <s-icon type="plus" size="medium" tone="interactive"></s-icon>
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Add another condition</span>
                                </s-stack>
                            </s-button>
                        </div>
                    </s-stack>
                </s-box>
            )}
        </s-stack>
    );
};
