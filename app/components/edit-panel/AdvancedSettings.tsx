import React from 'react';

interface AdvancedSettingsProps {
    editingElement: any;
    handleUpdateElement: (data: any) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    editingElement,
    handleUpdateElement
}) => {
    return (
        <div style={{ paddingBlockStart: '0', paddingBlockEnd: '16px', paddingInline: '16px' }}>
            <s-stack gap="small">
                {!['select', 'number', 'phone', 'email', 'date', 'file', 'color-picker', 'switch', 'radio', 'checkbox', 'checkbox-group', 'button', 'color-swatch', 'image-swatch', 'font-picker', 'heading', 'divider', 'spacing', 'paragraph', 'html'].includes(editingElement.element.type) && (
                    <>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Allowed value</span>
                            <div style={{
                                display: 'flex',
                                background: '#f6f6f7',
                                padding: '2px',
                                borderRadius: '10px',
                                gap: '2px',
                                border: '1px solid #ebebed'
                            }}>
                                {["Default", "Letters", "Numbers", "Letters & numbers"].map((val) => {
                                    const valueKey = val === "Letters & numbers" ? "alphanumeric" : val.toLowerCase();
                                    const isActive = (editingElement.element.allowedValue || "default") === valueKey;
                                    return (
                                        <div
                                            key={val}
                                            onClick={() => handleUpdateElement({ allowedValue: valueKey })}
                                            style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                padding: '4px 10px',
                                                background: isActive ? 'white' : 'transparent',
                                                borderRadius: '8px',
                                                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? '#1a1a1a' : '#616161',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: isActive ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Text transform</span>
                            <s-select
                                value={editingElement.element.textTransform || "default"}
                                onInput={(e: any) => handleUpdateElement({ textTransform: e.target.value })}
                            >
                                <s-option value="default">Default</s-option>
                                <s-option value="none">None</s-option>
                                <s-option value="uppercase">Uppercase</s-option>
                                <s-option value="lowercase">Lowercase</s-option>
                                <s-option value="capitalize">Capitalize</s-option>
                            </s-select>
                        </div>
                    </>
                )}

                {['button', 'color-swatch', 'image-swatch'].includes(editingElement.element.type) && (
                    <div style={{ marginBottom: '4px' }}>
                        <s-checkbox
                            label="Not allow deselect"
                            checked={editingElement.element.notAllowDeselect || false}
                            onInput={(e: any) => handleUpdateElement({ notAllowDeselect: e.target.checked })}
                            style={{ fontSize: '11px' }}
                        ></s-checkbox>
                    </div>
                )}

                {['radio', 'checkbox', 'checkbox-group', 'button', 'color-swatch', 'image-swatch'].includes(editingElement.element.type) && (
                    <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Direction style</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['vertical', 'horizontal'].map((dir) => {
                                const isVertical = dir === 'vertical';
                                const isActive = (editingElement.element.direction || 'vertical') === dir;
                                const isSwatch = ['color-swatch', 'image-swatch'].includes(editingElement.element.type);
                                const isSquare = ['checkbox', 'checkbox-group'].includes(editingElement.element.type);
                                const radius = isSwatch ? '50%' : isSquare ? '2px' : '50%';

                                return (
                                    <div
                                        key={dir}
                                        onClick={() => handleUpdateElement({ direction: dir })}
                                        style={{
                                            flex: 1,
                                            aspectRatio: '2/1',
                                            border: isActive ? '1.5px solid #000' : '1px solid #e1e1e1',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            padding: '12px',
                                            display: 'flex',
                                            flexDirection: isVertical ? 'column' : 'row',
                                            gap: '8px',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            background: '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: isVertical ? '6px' : '8px' }}>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: isVertical ? '6px' : '4px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: radius, border: i === 1 ? '1px solid #1a1a1a' : '1px solid #d1d3d5', position: 'relative' }}>
                                                        {i === 1 && (
                                                            isSquare ? (
                                                                <div style={{ position: 'absolute', inset: '1px', background: '#1a1a1a', borderRadius: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div style={{ position: 'absolute', inset: '2px', background: '#1a1a1a', borderRadius: '50%' }} />
                                                            )
                                                        )}
                                                    </div>
                                                    <div style={{ width: isVertical ? '40px' : '20px', height: '4px', background: '#f4f4f5', borderRadius: '2px' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {editingElement.element.type === 'date' && (
                    <>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Format</span>
                            <div style={{
                                display: 'flex',
                                background: '#f6f6f7',
                                padding: '2px',
                                borderRadius: '10px',
                                gap: '2px',
                                border: '1px solid #ebebed'
                            }}>
                                {["Date", "Time", "Date & time"].map((val) => {
                                    const valueKey = val.toLowerCase().replace(' & ', '_');
                                    const isActive = (editingElement.element.dateFormat || "date") === valueKey;
                                    return (
                                        <div
                                            key={val}
                                            onClick={() => handleUpdateElement({ dateFormat: valueKey })}
                                            style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                padding: '4px 10px',
                                                background: isActive ? 'white' : 'transparent',
                                                borderRadius: '8px',
                                                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? '#1a1a1a' : '#616161',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: isActive ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Mode</span>
                            <div style={{
                                display: 'flex',
                                background: '#f6f6f7',
                                padding: '2px',
                                borderRadius: '10px',
                                gap: '2px',
                                border: '1px solid #ebebed'
                            }}>
                                {["Single", "Range"].map((val) => {
                                    const valueKey = val.toLowerCase();
                                    const isActive = (editingElement.element.dateMode || "single") === valueKey;
                                    return (
                                        <div
                                            key={val}
                                            onClick={() => handleUpdateElement({ dateMode: valueKey })}
                                            style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                padding: '4px 10px',
                                                background: isActive ? 'white' : 'transparent',
                                                borderRadius: '8px',
                                                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? '#1a1a1a' : '#616161',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: isActive ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Date format</span>
                            <s-select
                                value={editingElement.element.dateDisplayFormat || "Y-m-d"}
                                onInput={(e: any) => handleUpdateElement({ dateDisplayFormat: e.target.value })}
                            >
                                <s-option value="Y-m-d">Y-m-d</s-option>
                                <s-option value="d-m-Y">d-m-Y</s-option>
                                <s-option value="m-d-Y">m-d-Y</s-option>
                                <s-option value="Y/m/d">Y/m/d</s-option>
                                <s-option value="d/m/Y">d/m/Y</s-option>
                                <s-option value="m/d/Y">m/d/Y</s-option>
                            </s-select>
                        </div>
                    </>
                )}

                {!['select', 'heading', 'divider', 'spacing', 'paragraph', 'html'].includes(editingElement.element.type) && (
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Help text position</span>
                        <s-select
                            value={editingElement.element.helpTextPosition || "below"}
                            onInput={(e: any) => handleUpdateElement({ helpTextPosition: e.target.value })}
                        >
                            <s-option value="below">Below option element</s-option>
                            <s-option value="above">Above option element</s-option>
                            <s-option value="tooltip">As a tooltip</s-option>
                        </s-select>
                    </div>
                )}

                <s-grid gridTemplateColumns="1fr 1.5fr" gap="small" alignItems="start">
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>HTML class</span>
                        <s-text-field
                            placeholder="e.g. custom-selector"
                            value={editingElement.element.htmlClass || ""}
                            onInput={(e: any) => handleUpdateElement({ htmlClass: e.target.value })}
                        >
                            <s-icon slot="prefix" type="info" size="small" tone="subdued"></s-icon>
                        </s-text-field>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#303030' }}>Column width</span>
                            <s-icon type="info" size="medium" tone="subdued"></s-icon>
                        </div>
                        <div style={{
                            display: 'flex',
                            background: '#f1f1f1',
                            padding: '2px',
                            borderRadius: '8px',
                            border: '0',
                            height: '32px',
                            boxSizing: 'border-box',
                            alignItems: 'stretch'
                        }}>
                            {["25%", "33%", "50%", "66%", "75%", "100%"].map((width) => (
                                <button
                                    key={width}
                                    onClick={() => handleUpdateElement({ columnWidth: width })}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 4px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        background: (editingElement.element.columnWidth || "100%") === width ? '#fff' : 'transparent',
                                        boxShadow: (editingElement.element.columnWidth || "100%") === width ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        color: (editingElement.element.columnWidth || "100%") === width ? '#303030' : '#616161',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {width}
                                </button>
                            ))}
                        </div>
                    </div>
                </s-grid>
            </s-stack>
        </div>
    );
};
