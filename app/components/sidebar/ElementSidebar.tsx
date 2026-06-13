import React, { useState } from 'react';

interface ElementSidebarProps {
    groups: any[];
    editingElement: any;
    handleToggleGroupExpansion: (groupId: string) => void;
    handleDeleteGroup: (groupId: string) => void;
    handleOpenEditModal: (group: any) => void;
    handleElementClick: (group: any, el: any, index: number) => void;
    handleDuplicate: (groupId: string, index: number) => void;
    handleToggleVisibility: (groupId: string, index: number) => void;
    handleDelete: (groupId: string, index: number) => void;
    handleReorderElement: (groupId: string, oldIndex: number, newIndex: number) => void;
    handleOpenModal: (groupId: string, index?: number) => void;
    handleAddGroup: () => void;
    handleToggleGroupVisibility: (groupId: string) => void;
}

const TYPE_LABELS: any = {
    'text': 'Text',
    'textarea': 'Textarea',
    'select': 'Dropdown',
    'checkbox': 'Checkbox',
    'radio': 'Radio',
    'image-swatch': 'Image Swatch',
    'color-swatch': 'Color Swatch',
    'checkbox-group': 'Checkbox',
    'date': 'Datetime'
};

export const ElementSidebar: React.FC<ElementSidebarProps> = ({
    groups,
    editingElement,
    handleToggleGroupExpansion,
    handleDeleteGroup,
    handleOpenEditModal,
    handleElementClick,
    handleDuplicate,
    handleToggleVisibility,
    handleDelete,
    handleReorderElement,
    handleOpenModal,
    handleAddGroup,
    handleToggleGroupVisibility
}) => {
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
    const [draggedElement, setDraggedElement] = useState<{ groupId: string, index: number } | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<{ groupId: string, index: number } | null>(null);
    const [hoveredGapIndex, setHoveredGapIndex] = useState<{ groupId: string, index: number } | null>(null);

    return (
        <s-box padding="none">
            <s-stack direction="vertical" gap="small-200">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: '12px', paddingInline: '16px', borderBottom: '1px solid #e1e3e5', marginBlockEnd: '4px' }}>
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#303030' }}>Elements</span>
                        <s-icon type="question-circle" size="medium" tone="subdued"></s-icon>
                    </s-stack>
                </div>
                {groups.map((group) => (
                    <s-box key={group.id} paddingInline='small'>
                        <div
                            onMouseEnter={() => setHoveredGroupId(group.id)}
                            onMouseLeave={() => setHoveredGroupId(null)}
                            style={{
                                background: '#f1f2f3',
                                border: '1px solid #e1e3e5',
                                borderRadius: group.expanded ? '8px 8px 0 0' : '8px',
                                padding: '4px 6px',
                                opacity: group.hidden ? 0.5 : 1
                            }} className="group-header-row">
                            <s-grid gridTemplateColumns="auto auto 1fr auto" alignItems="center" gap="small-400">
                                <button
                                    onClick={() => handleToggleGroupExpansion(group.id)}
                                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                                >
                                    <s-icon type={group.expanded ? "chevron-down" : "chevron-right"} size="small" tone="base"></s-icon>
                                </button>
                                <s-icon type="drag-handle" size="small" tone="base"></s-icon>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#454f5b' }}>{group.name}</span>

                                <div className="group-actions" style={{ display: 'flex', gap: '8px' }}>
                                    <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); /* duplicate logic for group if needed */ }}>
                                        <s-icon type="duplicate" size="medium" tone="base"></s-icon>
                                    </div>
                                    <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); handleToggleGroupVisibility(group.id); }}>
                                        <s-icon type={group.hidden ? "hide" : "view"} size="medium" tone="base"></s-icon>
                                    </div>
                                    {groups.indexOf(group) !== 0 && (
                                        <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                                            <s-icon type="delete" size="medium" tone="critical"></s-icon>
                                        </div>
                                    )}
                                </div>
                            </s-grid>
                        </div>
                        <div
                            style={{
                                border: '1px solid #e1e3e5',
                                borderTop: 'none',
                                borderRadius: group.expanded ? '0 0 8px 8px' : '0',
                                overflow: 'visible',
                                display: group.expanded ? "block" : "none",
                                position: 'relative'
                            }}
                        >
                            {group.elements.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {group.elements.map((el: any, index: number) => (
                                        <React.Fragment key={el.id || index}>
                                            {/* Insertion point before element */}
                                            <div
                                                onMouseEnter={() => !draggedElement && setHoveredGapIndex({ groupId: group.id, index })}
                                                onMouseLeave={() => setHoveredGapIndex(null)}
                                                onClick={(e) => { e.stopPropagation(); !draggedElement && handleOpenModal(group.id, index); }}
                                                style={{
                                                    height: '16px',
                                                    margin: '-8px 0',
                                                    position: 'relative',
                                                    zIndex: 1000,
                                                    cursor: draggedElement ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: draggedElement ? 0 : 1,
                                                    pointerEvents: draggedElement ? 'none' : 'auto'
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    top: '50%',
                                                    height: '2px',
                                                    backgroundColor: '#005bd3',
                                                    transform: `translateY(-50%) scaleX(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 1 : 0})`,
                                                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                                                    opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 1 : 0,
                                                    pointerEvents: 'none'
                                                }} />
                                                
                                                <div style={{
                                                    backgroundColor: '#005bd3',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    lineHeight: '1',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(0,91,211,0.4)',
                                                    zIndex: 1001,
                                                    transform: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 'scale(1)' : 'scale(0)',
                                                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.1s',
                                                    opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 1 : 0,
                                                    pointerEvents: 'none'
                                                }}>
                                                    <span style={{ marginTop: '-1px' }}>+</span>
                                                </div>

                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '100%',
                                                    left: '50%',
                                                    transform: `translateX(-50%) translateY(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? '-8px' : '0px'}) scale(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 1 : 0.8})`,
                                                    backgroundColor: 'white',
                                                    color: '#303030',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '500',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    border: '1px solid #e1e3e5',
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none',
                                                    opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === index) ? 1 : 0,
                                                    transition: 'all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                                                    zIndex: 1002
                                                }}>
                                                    Add element
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        borderLeft: '5px solid transparent',
                                                        borderRight: '5px solid transparent',
                                                        borderTop: '5px solid #e1e3e5'
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '98%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        borderLeft: '4px solid transparent',
                                                        borderRight: '4px solid transparent',
                                                        borderTop: '4px solid white',
                                                        zIndex: 1
                                                    }} />
                                                </div>
                                            </div>

                                            <div
                                                key={el.id || index}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    if (draggedElement && draggedElement.groupId === group.id) {
                                                        setDragOverIndex({ groupId: group.id, index });
                                                    }
                                                }}
                                                onDragLeave={() => setDragOverIndex(null)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (draggedElement && draggedElement.groupId === group.id && draggedElement.index !== index) {
                                                        handleReorderElement(group.id, draggedElement.index, index);
                                                    }
                                                    setDraggedElement(null);
                                                    setDragOverIndex(null);
                                                }}
                                                style={{ position: 'relative' }}
                                            >
                                                {/* Visual insertion line that doesn't affect layout flow of the drag target */}
                                                <div style={{
                                                    height: '2px',
                                                    backgroundColor: '#005bd3',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 10,
                                                    opacity: (dragOverIndex?.groupId === group.id && dragOverIndex?.index === index && draggedElement?.index !== index) ? 1 : 0,
                                                    transform: (dragOverIndex?.groupId === group.id && dragOverIndex?.index === index && draggedElement?.index !== index) ? 'scaleY(1)' : 'scaleY(0)',
                                                    transition: 'all 0.2s ease',
                                                    pointerEvents: 'none'
                                                }} />

                                                <div
                                                    className="element-option"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setDraggedElement({ groupId: group.id, index });
                                                        // Use a slight timeout to ensure the drag image is captured before opacity changes
                                                        setTimeout(() => {
                                                            setHoveredElementId(null);
                                                        }, 0);
                                                    }}
                                                    onMouseEnter={() => setHoveredElementId(el.id)}
                                                    onMouseLeave={() => setHoveredElementId(null)}
                                                    onClick={() => handleElementClick(group, el, index)}
                                                    style={{
                                                        background: '#ffffff',
                                                        borderBottom: index === group.elements.length - 1 ? 'none' : '1px solid #e1e3e5',
                                                        padding: '6px 6px',
                                                        cursor: 'pointer',
                                                        opacity: (draggedElement?.groupId === group.id && draggedElement?.index === index) ? 0.3 : (el.hidden ? 0.5 : 1),
                                                        marginTop: (dragOverIndex?.groupId === group.id && dragOverIndex?.index === index && draggedElement?.index !== index) ? '32px' : '0px',
                                                        transition: 'margin-top 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s',
                                                        position: 'relative',
                                                        zIndex: 1
                                                    }}
                                                >
                                                    <s-grid gridTemplateColumns="auto 1.5fr 1fr 1fr auto" alignItems="center" gap="small-200">
                                                        <s-icon type="drag-handle" size="small" tone="subdued"></s-icon>

                                                        <s-stack direction="vertical" gap="none">
                                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{el.label}</span>
                                                            <span style={{ fontSize: '11px', color: '#6d7175' }}>Option name: {el.name || (el.type + '-1')}</span>
                                                        </s-stack>

                                                        <span style={{ fontSize: '12px', color: '#303030' }}>
                                                            {TYPE_LABELS[el.type] || el.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>

                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                                            {['select', 'radio', 'checkbox', 'checkbox-group', 'color-swatch', 'image-swatch', 'button'].includes(el.type) && (
                                                                <s-badge tone="neutral">
                                                                    <span style={{ fontSize: '11px' }}>
                                                                        {(el.optionValues?.length || 0)} {['checkbox', 'checkbox-group', 'button'].includes(el.type) ? 'choices' : 'values'}
                                                                    </span>
                                                                </s-badge>
                                                            )}
                                                            {el.price > 0 && (
                                                                <s-badge tone="success">
                                                                    <span style={{ fontSize: '11px' }}>
                                                                        + ${parseFloat(el.price || 0).toFixed(2)}
                                                                    </span>
                                                                </s-badge>
                                                            )}
                                                        </div>

                                                        <div className="element-actions" style={{ display: 'flex', gap: '8px' }}>
                                                            <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); handleDuplicate(group.id, index); }}>
                                                                <s-icon type="duplicate" size="medium" tone="base"></s-icon>
                                                            </div>
                                                            <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); handleToggleVisibility(group.id, index); }}>
                                                                <s-icon type={el.hidden ? "hide" : "view"} size="medium" tone="base"></s-icon>
                                                            </div>
                                                            <div className="action-icon-wrapper" onClick={(e) => { e.stopPropagation(); handleDelete(group.id, index); }}>
                                                                <s-icon type="delete" size="medium" tone="critical"></s-icon>
                                                            </div>
                                                        </div>
                                                    </s-grid>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}

                                    {/* Insertion point after the last element */}
                                    <div
                                        onMouseEnter={() => !draggedElement && setHoveredGapIndex({ groupId: group.id, index: group.elements.length })}
                                        onMouseLeave={() => setHoveredGapIndex(null)}
                                        onClick={(e) => { e.stopPropagation(); !draggedElement && handleOpenModal(group.id, group.elements.length); }}
                                        style={{
                                            height: '16px',
                                            margin: '-8px 0',
                                            position: 'relative',
                                            zIndex: 1000,
                                            cursor: draggedElement ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: draggedElement ? 0 : 1,
                                            pointerEvents: draggedElement ? 'none' : 'auto'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            top: '50%',
                                            height: '2px',
                                            backgroundColor: '#005bd3',
                                            transform: `translateY(-50%) scaleX(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 1 : 0})`,
                                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                                            opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 1 : 0,
                                            pointerEvents: 'none'
                                        }} />
                                        
                                        <div style={{
                                            backgroundColor: '#005bd3',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '14px',
                                            lineHeight: '1',
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(0,91,211,0.4)',
                                            zIndex: 1001,
                                            transform: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 'scale(1)' : 'scale(0)',
                                            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.1s',
                                            opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 1 : 0,
                                            pointerEvents: 'none'
                                        }}>
                                            <span style={{ marginTop: '-1px' }}>+</span>
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: `translateX(-50%) translateY(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? '-8px' : '0px'}) scale(${(hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 1 : 0.8})`,
                                            backgroundColor: 'white',
                                            color: '#303030',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            border: '1px solid #e1e3e5',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                            opacity: (hoveredGapIndex?.groupId === group.id && hoveredGapIndex?.index === group.elements.length) ? 1 : 0,
                                            transition: 'all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                                            zIndex: 1002
                                        }}>
                                            Add element
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                borderLeft: '5px solid transparent',
                                                borderRight: '5px solid transparent',
                                                borderTop: '5px solid #e1e3e5'
                                            }} />
                                            <div style={{
                                                position: 'absolute',
                                                top: '98%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                borderLeft: '4px solid transparent',
                                                borderRight: '4px solid transparent',
                                                borderTop: '4px solid white',
                                                zIndex: 1
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ padding: '2px 6px', borderTop: '1px solid #e1e3e5' }}>
                                <button
                                    className="add-item-button"
                                    onClick={() => handleOpenModal(group.id)}
                                    style={{ padding: '6px' }}
                                >
                                    <s-icon type="plus-circle" tone="interactive"></s-icon>
                                    <span style={{ fontSize: "12px", fontWeight: 500 }}>Add element</span>
                                </button>
                            </div>
                        </div>
                    </s-box>
                ))}
                <s-box paddingBlockStart="small-500" paddingInline='base'>
                    <button
                        className="add-item-button"
                        onClick={handleAddGroup}
                    >
                        <s-icon type="plus-circle" tone="interactive"></s-icon>
                        <span style={{ fontSize: "12px", fontWeight: 500 }}>Add group</span>
                    </button>
                </s-box>
            </s-stack>
        </s-box>
    );
};
