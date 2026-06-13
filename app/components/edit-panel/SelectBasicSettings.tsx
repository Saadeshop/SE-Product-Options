import React, { useState, useEffect } from 'react';
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
    Checkbox,
    Popover,
    ColorPicker,
    hsbToHex,
    rgbToHex,
    rgbToHsb,
    hsbToRgb
} from '@shopify/polaris';

interface OptionValue {
    id: string;
    value: string;
    helpText: string;
    price: number;
    isDefault: boolean;
    addonProduct?: any;
    swatchMode?: 'one' | 'two';
    swatchValue?: string;
    swatchValue2?: string;
    swatchImage?: string;
    _activeColorIndex?: number;
}

import { AddonModal } from './AddonModal';

interface SelectBasicSettingsProps {
    editingElement: any;
    handleUpdateElement: (data: any) => void;
    products?: any[];
    children?: React.ReactNode;
}

const DEFAULT_OPTION: OptionValue = {
    id: 'opt-default-1',
    value: 'option_1',
    helpText: '',
    price: 0,
    isDefault: false,
    addonProduct: null
};

const BULK_MODAL_ID = 'bulk-add-values-modal';
const BULK_TRIGGER_ID = 'bulk-add-values-trigger';

export const SelectBasicSettings: React.FC<SelectBasicSettingsProps> = ({
    editingElement,
    handleUpdateElement,
    products = [],
    children
}) => {
    const options: OptionValue[] = editingElement.element.optionValues?.length
        ? editingElement.element.optionValues
        : [DEFAULT_OPTION];

    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [bulkText, setBulkText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeOptionId, setActiveOptionId] = useState<string | null>(null);

    useEffect(() => {
        const updates: any = {};
        if (!editingElement.element.optionValues?.length) {
            updates.optionValues = [DEFAULT_OPTION];
        }
        if (editingElement.element.placeholder === undefined) {
            updates.placeholder = '-- Please select --';
        }
        // Auto-initialize swatchStyle for swatch element types
        if (editingElement.element.type === 'color-swatch' && !editingElement.element.swatchStyle) {
            updates.swatchStyle = 'color';
            const currentOpts = editingElement.element.optionValues || [DEFAULT_OPTION];
            updates.optionValues = currentOpts.map((o: any) => ({
                ...o,
                swatchMode: o.swatchMode || 'one',
                swatchValue: o.swatchValue || '#000000ff',
                swatchValue2: o.swatchValue2 || '#ffffffff',
            }));
        }
        if (editingElement.element.type === 'image-swatch' && !editingElement.element.swatchStyle) {
            updates.swatchStyle = 'image';
        }
        if (Object.keys(updates).length > 0) {
            handleUpdateElement(updates);
        }
    }, [editingElement.element.id]);

    const openBulkModal = () => {
        const trigger = document.getElementById(BULK_TRIGGER_ID);
        if (trigger) trigger.click();
    };

    const closeBulkModal = () => {
        const closeBtn = document.querySelector(
            `s-modal#${BULK_MODAL_ID} s-button[command="--hide"]`
        ) as HTMLElement | null;
        if (closeBtn) closeBtn.click();
    };

    const updateOptions = (newOptions: OptionValue[]) => {
        handleUpdateElement({ optionValues: newOptions });
    };

    const addValue = () => {
        const newOption: OptionValue = {
            id: `opt-${Date.now()}`,
            value: `option_${options.length + 1}`,
            helpText: '',
            price: 0,
            isDefault: false,
            addonProduct: null
        };
        updateOptions([...options, newOption]);
    };

    const updateOption = (id: string, changes: Partial<OptionValue>) => {
        updateOptions(options.map(o => o.id === id ? { ...o, ...changes } : o));
    };

    const removeOption = (id: string) => {
        updateOptions(options.filter(o => o.id !== id));
    };

    const clearAll = () => updateOptions([]);

    const handleBulkAdd = () => {
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) return;
        const newOpts: OptionValue[] = lines.map((line, i) => ({
            id: `opt-bulk-${Date.now()}-${i}`,
            value: line,
            helpText: '',
            price: 0,
            isDefault: false,
            addonProduct: null
        }));
        updateOptions([...options, ...newOpts]);
        setBulkText('');
        closeBulkModal();
    };

    const toggleDefault = (id: string) => {
        updateOptions(options.map(o => ({
            ...o,
            isDefault: o.id === id
        })));
    };

    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        setDragOverId(id);
    };
    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;
        const fromIdx = options.findIndex(o => o.id === draggedId);
        const toIdx = options.findIndex(o => o.id === targetId);
        const reordered = Array.from(options);
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        updateOptions(reordered);
        setDraggedId(null);
        setDragOverId(null);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const handleImageUpload = async (id: string, file: File) => {
        setUploadingId(id);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            console.log('Upload response data:', data);
            if (data.url) {
                updateOption(id, { swatchImage: data.url });
            } else if (data.error) {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image. check console.');
        } finally {
            setUploadingId(null);
        }
    };

    const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

    // Close picker on click outside
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (activePopoverId && !event.target.closest(`.se-color-picker-container-${activePopoverId}`)) {
                setActivePopoverId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePopoverId]);

    const hexToHsba = (hex: string) => {
        if (!hex) return { hue: 0, saturation: 0, brightness: 0, alpha: 1 };
        let cleanHex = hex.replace('#', '');
        
        // Handle 3-digit hex
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        
        const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
        const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
        const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
        const a = cleanHex.length === 8 ? parseInt(cleanHex.slice(6, 8), 16) / 255 : 1;
        
        const hsb = rgbToHsb({ red: r, green: g, blue: b });
        return { ...hsb, alpha: a };
    };

    const hsbaToHex = (hsba: any) => {
        const rgb = hsbToRgb(hsba);
        const alphaHex = Math.round(hsba.alpha * 255).toString(16).padStart(2, '0');
        return rgbToHex(rgb) + alphaHex;
    };

    const isSelect = editingElement.element.type === 'select';
    const swatchStyle = editingElement.element.swatchStyle || (editingElement.element.type === 'color-swatch' ? 'color' : editingElement.element.type === 'image-swatch' ? 'image' : 'default');
    const isColor = swatchStyle === 'color';
    const isImage = swatchStyle === 'image';

    const COLS = isSelect 
        ? '24px 2fr 90px 40px 56px 40px' 
        : `24px ${isColor || isImage ? '32px ' : ''}1fr 1fr 90px 40px 56px 40px`;

    return (
        <>
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
                <s-grid gridTemplateColumns="1fr 1fr" gap="small">
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
                </s-grid>

                {/* Swatch Style Selector */}
                {['radio', 'checkbox', 'checkbox-group', 'button'].includes(editingElement.element.type) && (
                    <div style={{ marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Swatch style</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            background: '#f1f2f4',
                            padding: '2px',
                            borderRadius: '10px',
                            gap: '2px',
                            border: '1px solid #ebebed'
                        }}>
                            {(['color-swatch', 'image-swatch'].includes(editingElement.element.type) ? ["Color", "Image"] : ["Default", "Color", "Image"]).map((val) => {
                                const valueKey = val.toLowerCase();
                                const currentStyle = editingElement.element.swatchStyle || (editingElement.element.type === 'color-swatch' ? 'color' : editingElement.element.type === 'image-swatch' ? 'image' : 'default');
                                const isActive = currentStyle === valueKey;
                                
                                return (
                                    <div
                                        key={val}
                                        onClick={() => {
                                            const updates: any = { swatchStyle: valueKey };
                                            if (valueKey === 'color') {
                                                updates.optionValues = options.map(o => ({
                                                    ...o,
                                                    swatchMode: o.swatchMode || 'one',
                                                    swatchValue: o.swatchValue || '#000000ff',
                                                    swatchValue2: o.swatchValue2 || '#ffffffff'
                                                }));
                                            }
                                            handleUpdateElement(updates);
                                        }}
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            padding: '3px 6px',
                                            background: isActive ? 'white' : 'transparent',
                                            borderRadius: '7px',
                                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? '#1a1a1a' : '#616161',
                                            transition: 'all 0.2s ease',
                                            border: isActive ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent'
                                        }}
                                    >
                                        {val}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Option Values Table */}
                <div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#303030', display: 'block', marginBottom: '8px' }}>
                        Option values
                    </span>

                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: COLS,
                        gap: '8px',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e1e3e5',
                        borderBottom: 'none',
                        borderRadius: '8px 8px 0 0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6d7175',
                    }}>
                        <div />
                        {isColor && <div>Color</div>}
                        {isImage && <div>Image</div>}
                        <div>Value</div>
                        {!isSelect && <div>Help text</div>}
                        <div>Price</div>
                        <div style={{ textAlign: 'center' }}>Default</div>
                        <div style={{ textAlign: 'center' }}>Product</div>
                        <div style={{ textAlign: 'center' }}>Action</div>
                    </div>

                    {/* Rows */}
                    <div style={{ border: '1px solid #e1e3e5', borderRadius: '0 0 8px 8px' }}>
                        {options.length === 0 && (
                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#6d7175' }}>
                                No option values yet. Click "+ Add value" to get started.
                            </div>
                        )}
                        {options.map((opt) => (
                            <div
                                key={opt.id}
                                draggable={!activePopoverId}
                                onDragStart={() => handleDragStart(opt.id)}
                                onDragOver={(e) => handleDragOver(e, opt.id)}
                                onDrop={(e) => handleDrop(e, opt.id)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: COLS,
                                    gap: '8px',
                                    alignItems: 'center',
                                    padding: '6px 12px',
                                    borderTop: dragOverId === opt.id
                                        ? '2px solid var(--p-color-border-interactive, #2c6ecb)'
                                        : '1px solid #e1e3e5',
                                    backgroundColor: draggedId === opt.id ? '#f1f2f4' : 'white',
                                    transition: 'background 0.15s ease',
                                }}
                            >
                                <div 
                                    style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#6d7175' }}
                                    onMouseDown={(e) => {
                                        // prevent drag if clicking input
                                    }}
                                >
                                    <s-icon type="drag-handle" size="small" tone="subdued"></s-icon>
                                </div>

                                {isColor && (
                                    <div className={`se-color-picker-container-${opt.id}`} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <div
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActivePopoverId(activePopoverId === opt.id ? null : opt.id);
                                            }}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                border: '1px solid #e1e3e5',
                                                background: opt.swatchMode === 'two' 
                                                    ? `linear-gradient(135deg, ${opt.swatchValue || '#000000'} 50%, ${opt.swatchValue2 || '#ffffff'} 50%)`
                                                    : (opt.swatchValue || '#000000'),
                                                cursor: 'pointer',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        />
                                        
                                        {activePopoverId === opt.id && (
                                            <div 
                                                onMouseDown={(e) => e.stopPropagation()}
                                                draggable="false"
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: 'calc(100% + 8px)', 
                                                    left: '0', 
                                                    zIndex: 1000, 
                                                    background: 'white', 
                                                    borderRadius: '12px', 
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                                    padding: '12px',
                                                    width: '240px'
                                                }}
                                            >
                                                <div style={{ marginBottom: '12px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        background: '#f1f2f4',
                                                        padding: '2px',
                                                        borderRadius: '8px',
                                                        gap: '2px',
                                                        border: '1px solid #ebebed'
                                                    }}>
                                                        {["One color", "Two color"].map((m) => {
                                                            const mode = m === "One color" ? "one" : "two";
                                                            const isModeActive = (opt.swatchMode || "one") === mode;
                                                            return (
                                                                <div
                                                                    key={m}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateOption(opt.id, { swatchMode: mode });
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        textAlign: 'center',
                                                                        padding: '4px 8px',
                                                                        background: isModeActive ? 'white' : 'transparent',
                                                                        borderRadius: '6px',
                                                                        boxShadow: isModeActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                                        cursor: 'pointer',
                                                                        fontSize: '11px',
                                                                        fontWeight: isModeActive ? 600 : 500,
                                                                        color: isModeActive ? '#1a1a1a' : '#616161'
                                                                    }}
                                                                >
                                                                    {m}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div onMouseDown={(e) => e.stopPropagation()}>
                                                    <s-color-picker
                                                        value={(opt.swatchMode === 'two' && opt._activeColorIndex === 2) ? (opt.swatchValue2 || '#ffffffff') : (opt.swatchValue || '#000000ff')}
                                                        alpha
                                                        onInput={(e: any) => {
                                                            const hex = e.target.value;
                                                            if (opt.swatchMode === 'two' && opt._activeColorIndex === 2) {
                                                                updateOption(opt.id, { swatchValue2: hex });
                                                            } else {
                                                                updateOption(opt.id, { swatchValue: hex });
                                                            }
                                                        }}
                                                    ></s-color-picker>
                                                </div>

                                                {opt.swatchMode === 'two' && (
                                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {[1, 2].map(idx => (
                                                            <div
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateOption(opt.id, { _activeColorIndex: idx });
                                                                }}
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    border: (opt._activeColorIndex || 1) === idx ? '2px solid #005bd3' : '1px solid #e1e3e5',
                                                                    background: idx === 1 ? (opt.swatchValue || '#000000') : (opt.swatchValue2 || '#ffffff'),
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        ))}
                                                        <span style={{ fontSize: '11px', color: '#6d7175' }}>Select color to edit</span>
                                                    </div>
                                                )}

                                                <div style={{ marginTop: '12px' }} onMouseDown={(e) => e.stopPropagation()}>
                                                    <TextField
                                                        label="Hex code"
                                                        labelHidden
                                                        prefix="#"
                                                        value={((opt.swatchMode === 'two' && opt._activeColorIndex === 2) ? (opt.swatchValue2 || '#ffffffff') : (opt.swatchValue || '#000000ff')).replace('#', '')}
                                                        onChange={(val) => {
                                                            const hex = `#${val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 8)}`;
                                                            if (opt.swatchMode === 'two' && opt._activeColorIndex === 2) {
                                                                updateOption(opt.id, { swatchValue2: hex });
                                                            } else {
                                                                updateOption(opt.id, { swatchValue: hex });
                                                            }
                                                        }}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isImage && (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            id={`file-${opt.id}`}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(opt.id, file);
                                            }}
                                        />
                                        <div
                                            onClick={() => document.getElementById(`file-${opt.id}`)?.click()}
                                            title={opt.swatchImage || 'No image'}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                border: '1px solid #e1e3e5',
                                                backgroundColor: '#f1f2f4',
                                                cursor: uploadingId === opt.id ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                opacity: uploadingId === opt.id ? 0.5 : 1,
                                                position: 'relative'
                                            }}
                                        >
                                            {uploadingId === opt.id ? (
                                                <div className="se-spinner-small" />
                                            ) : opt.swatchImage ? (
                                                <img 
                                                    src={opt.swatchImage} 
                                                    alt="" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    onLoad={() => console.log('Image loaded successfully:', opt.swatchImage)}
                                                    onError={() => console.error('Image failed to load:', opt.swatchImage)}
                                                />
                                            ) : (
                                                <s-icon type="image" size="small" tone="subdued"></s-icon>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Value */}
                                <s-text-field
                                    onMouseDown={(e: any) => e.stopPropagation()}
                                    value={opt.value}
                                    placeholder="Value"
                                    onInput={(e: any) => updateOption(opt.id, { value: e.target.value })}
                                ></s-text-field>

                                {/* Help text */}
                                {!isSelect && (
                                    <s-text-field
                                        onMouseDown={(e: any) => e.stopPropagation()}
                                        value={opt.helpText}
                                        placeholder="Help text"
                                        onInput={(e: any) => updateOption(opt.id, { helpText: e.target.value })}
                                    ></s-text-field>
                                )}

                                 {/* Price */}
                                <div 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveOptionId(opt.id);
                                        setIsModalOpen(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <s-text-field
                                        onMouseDown={(e: any) => e.stopPropagation()}
                                        type="number"
                                        value={opt.price === 0 ? '' : String(opt.price)}
                                        placeholder="0"
                                        prefix="$"
                                        autoComplete="off"
                                        onInput={(e: any) => updateOption(opt.id, { price: parseFloat(e.target.value) || 0 })}
                                    ></s-text-field>
                                </div>

                                {/* Default star */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => {
                                            const isAlreadyDefault = opt.isDefault;
                                            updateOptions(options.map(o => ({
                                                ...o,
                                                isDefault: o.id === opt.id ? !isAlreadyDefault : false,
                                            })));
                                        }}
                                        title="Set as default"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            fontSize: '16px',
                                            color: opt.isDefault ? '#f5a623' : '#d1d3d5',
                                            lineHeight: 1,
                                        }}
                                    >★</button>
                                </div>                                 {/* Product link */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (opt.addonProduct) {
                                                // Try to find the product ID
                                                let targetId = opt.addonProduct.productId || opt.addonProduct.id;
                                                
                                                // If it's a variant ID, try to find the parent product ID from the products list
                                                if (targetId.includes('ProductVariant')) {
                                                    const parentProduct = products.find(p => 
                                                        p.variants?.nodes?.some((v: any) => v.id === targetId) || 
                                                        p.variants?.edges?.some((e: any) => e.node.id === targetId)
                                                    );
                                                    if (parentProduct) targetId = parentProduct.id;
                                                }

                                                const numericId = targetId.split('/').pop();
                                                const shop = new URLSearchParams(window.location.search).get('shop');
                                                if (shop) {
                                                    const shopName = shop.split('.')[0];
                                                    const adminUrl = `https://admin.shopify.com/store/${shopName}/products/${numericId}`;
                                                    window.open(adminUrl, '_blank');
                                                } else {
                                                    // Fallback if shop is missing
                                                    window.open(`/admin/products/${numericId}`, '_blank');
                                                }
                                            } else {
                                                setActiveOptionId(opt.id);
                                                setIsModalOpen(true);
                                            }
                                        }}
                                        style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <s-button
                                            variant="tertiary"
                                            tone={opt.addonProduct ? "success" : "neutral"}
                                            icon="product"
                                            accessibilityLabel={opt.addonProduct ? "View product in Admin" : "Link to product"}
                                        />
                                    </div>
                                </div>

                                {/* Delete */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <s-button
                                        variant="tertiary"
                                        tone="critical"
                                        icon="delete"
                                        accessibilityLabel="Delete option value"
                                        disabled={options.length === 1 || undefined}
                                        onClick={() => removeOption(opt.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <s-button onClick={addValue}>+ Add value</s-button>
                            <s-button onClick={openBulkModal}>⊕ Bulk add</s-button>
                        </div>
                        {options.length > 0 && (
                            <s-button variant="tertiary" tone="critical" icon="delete" onClick={clearAll}>
                                Delete all option values
                            </s-button>
                        )}
                    </div>
                </div>

                {/* Min/Max Selections for checkbox */}
                {editingElement.element.type === 'checkbox' && (
                    <div style={{ marginBottom: '16px' }}>
                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <div>
                                <s-number-field
                                    label="Min selections"
                                    value={editingElement.element.minSelections !== undefined ? String(editingElement.element.minSelections) : ''}
                                    min="1"
                                    autoComplete="off"
                                    onInput={(e: any) => {
                                        const val = e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1);
                                        handleUpdateElement({ minSelections: val });
                                    }}
                                ></s-number-field>
                            </div>
                            <div>
                                <s-number-field
                                    label="Max selections"
                                    value={editingElement.element.maxSelections !== undefined ? String(editingElement.element.maxSelections) : ''}
                                    min="1"
                                    max={String(options.length)}
                                    autoComplete="off"
                                    onInput={(e: any) => {
                                        const maxPossible = options.length;
                                        const val = e.target.value === '' ? undefined : Math.min(maxPossible, Math.max(1, parseInt(e.target.value) || 1));
                                        handleUpdateElement({ maxSelections: val });
                                    }}
                                ></s-number-field>
                            </div>
                        </s-grid>
                    </div>
                )}

                {/* Allow multiple - only for select, not radio or checkbox anymore */}
                {editingElement.element.type === 'select' && (
                    <div style={{ marginBottom: '16px' }}>
                        <s-checkbox
                            label="Allow multiple"
                            checked={editingElement.element.allowMultiple || false}
                            onInput={(e: any) => handleUpdateElement({ allowMultiple: e.target.checked })}
                            style={{ fontSize: '11px' }}
                        ></s-checkbox>
                    </div>
                )}

                {/* Settings Grid */}
                <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                    {/* Column 1 */}
                    <div>
                        {editingElement.element.type === 'select' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Placeholder</span>
                                </div>
                                <s-text-field
                                    value={editingElement.element.placeholder || '-- Please select --'}
                                    onInput={(e: any) => handleUpdateElement({ placeholder: e.target.value })}
                                ></s-text-field>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Default value</span>
                                </div>
                                <s-select 
                                    value={options.find(o => o.isDefault)?.id || ''}
                                    onInput={(e: any) => toggleDefault(e.target.value)}
                                >
                                    <s-option value="">None</s-option>
                                    {options.map(opt => (
                                        <s-option key={opt.id} value={opt.id}>{opt.value || `Option ${options.indexOf(opt) + 1}`}</s-option>
                                    ))}
                                </s-select>
                            </>
                        )}
                    </div>

                    {/* Column 2 */}
                    <div>
                        {editingElement.element.type === 'select' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Default value</span>
                                </div>
                                <s-select 
                                    value={options.find(o => o.isDefault)?.id || ''}
                                    onInput={(e: any) => toggleDefault(e.target.value)}
                                >
                                    <s-option value="">None</s-option>
                                    {options.map(opt => (
                                        <s-option key={opt.id} value={opt.id}>{opt.value || `Option ${options.indexOf(opt) + 1}`}</s-option>
                                    ))}
                                </s-select>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Help text</span>
                                </div>
                                <s-text-field
                                    value={editingElement.element.helpText || ''}
                                    onInput={(e: any) => handleUpdateElement({ helpText: e.target.value })}
                                ></s-text-field>
                            </>
                        )}
                    </div>
                </s-grid>

                <div style={{ borderTop: '1px solid #e1e3e5', paddingBlockStart: '8px', marginBlockStart: '8px' }}>
                    {children}
                </div>

            </s-stack>

            {/* Hidden trigger for the bulk add modal */}
            <div style={{ display: 'none' }}>
                <s-button id={BULK_TRIGGER_ID} commandFor={BULK_MODAL_ID}>Open Bulk Add</s-button>
            </div>

            {/* Bulk Add Values — s-modal */}
            <s-modal id={BULK_MODAL_ID} heading="Bulk Add Values">
                <s-stack direction="vertical" gap="base">
                    <s-paragraph>
                        Paste values on their own individual lines separated by an enter/return in the field below. This will add values to the existing field.
                    </s-paragraph>
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={'Small\nMedium\nLarge'}
                        rows={12}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '12px',
                            border: '1px solid #c9cccf',
                            borderRadius: '8px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            outline: 'none',
                            backgroundColor: '#f9fafb',
                            lineHeight: 1.6,
                        }}
                    />
                </s-stack>

                <s-button
                    slot="primary-action"
                    variant="primary"
                    disabled={!bulkText.trim() || undefined}
                    onClick={handleBulkAdd}
                >Select</s-button>

                <s-button
                    slot="secondary-actions"
                    commandFor={BULK_MODAL_ID}
                    command="--hide"
                    onClick={() => setBulkText('')}
                >Cancel</s-button>
            </s-modal>

            {isModalOpen && activeOptionId && (
                <AddonModal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setActiveOptionId(null);
                    }}
                    products={products}
                    label={options.find(o => o.id === activeOptionId)?.value || 'Add-on Product'}
                    initialPrice={String(options.find(o => o.id === activeOptionId)?.price || '0')}
                    initialTabIndex={(() => {
                        const opt = options.find(o => o.id === activeOptionId);
                        if (opt?.addonProduct) return 0;
                        if (opt && opt.price > 0) return 2;
                        return 0;
                    })()}
                    onSelect={(data) => {
                        if (activeOptionId) {
                            updateOption(activeOptionId, { 
                                price: data.price,
                                addonProduct: data.addonProduct
                            });
                        }
                    }}
                />
            )}

            <style>{`
                .Polaris-Modal-Dialog__Container {
                    z-index: 9999 !important;
                }
                .Polaris-Backdrop {
                    z-index: 9998 !important;
                }
            `}</style>
        </>
    );
};
