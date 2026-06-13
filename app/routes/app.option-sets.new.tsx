import React, { useState, useEffect } from "react";

import { useNavigate, useLoaderData, useFetcher, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { EditPanel } from "../components/edit-panel/EditPanel";
import { LivePreview } from "../components/preview/LivePreview";
import { ElementSidebar } from "../components/sidebar/ElementSidebar";
import { SelectProducts } from "../components/sidebar/SelectProducts";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);

    const response = await admin.graphql(
        `#graphql
        query fetchProducts {
            products(first: 50) {
                nodes {
                    id
                    title
                    handle
                    featuredImage {
                        url
                    }
                    variants(first: 50) {
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
            }
        }`
    );

    const data = await response.json();
    return { products: data.data.products.nodes };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    console.log("Action hit for shop:", shop);

    try {
        const formData = await request.formData();
        const dataStr = formData.get("data") as string;
        console.log("New Option Set Action hit. Data:", dataStr);

        if (!dataStr) {
            console.error("No data found in form submission");
            return { error: "No data submitted" };
        }

        const data = JSON.parse(dataStr);
        console.log("Parsed data:", data);

        const shortId = Math.floor(10000000 + Math.random() * 90000000).toString();
        const newRecord = await db.optionSet.create({
            data: {
                id: shortId,
                shop,
                title: data.title || "Untitled Option Set",
                status: data.status || "active",
                groups: JSON.stringify(data.groups || []),
                selectionMode: data.selectionMode || "all",
                selectedProducts: JSON.stringify(data.selectedProducts || []),
                conditions: JSON.stringify(data.conditions || []),
            }
        });

        return { success: true, id: newRecord.id };
    } catch (error) {
        console.error("Error creating option set:", error);
        return { error: "Failed to save option set" };
    }
};

export const headers = (headersArgs: any) => {
    return boundary.headers(headersArgs);
};

const ELEMENT_OPTIONS = [
    {
        title: "Input",
        items: [
            { type: "text", label: "Text", icon: "text", premium: false },
            { type: "textarea", label: "Textarea", icon: "text-block", premium: false },
            { type: "number", label: "Number", icon: "hashtag", premium: false },
            { type: "phone", label: "Phone", icon: "phone", premium: true },
            { type: "email", label: "Email", icon: "email", premium: true },
            { type: "date", label: "Datetime", icon: "calendar", premium: true },
            { type: "file", label: "File Upload", icon: "attachment", premium: true },
            { type: "color-picker", label: "Color Picker", icon: "color", premium: true },
            { type: "switch", label: "Switch", icon: "toggle-on", premium: false },
        ]
    },
    {
        title: "Selection",
        items: [
            {
                type: "select",
                label: "Select",
                icon: "select",
                premium: false,
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false }
                ]
            },
            {
                type: "radio",
                label: "Radio Button",
                icon: "target",
                premium: false,
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false }
                ]
            },
            {
                type: "checkbox",
                label: "Checkbox",
                icon: "checkbox",
                premium: false,
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false }
                ]
            },
            {
                type: "button",
                label: "Button",
                icon: "button",
                premium: false,
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false }
                ]
            },
            {
                type: "color-swatch",
                label: "Color Swatch",
                icon: "color",
                premium: false,
                swatchStyle: "color",
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false, swatchMode: 'one', swatchValue: '#000000ff', swatchValue2: '#ffffffff' }
                ]
            },
            {
                type: "image-swatch",
                label: "Image Swatch",
                icon: "image",
                premium: false,
                swatchStyle: "image",
                optionValues: [
                    { id: 'opt-1', value: 'Option 1', price: 0, isDefault: false }
                ]
            },
            { type: "font-picker", label: "Font Picker", icon: "text-color", premium: true },
        ]
    },
    {
        title: "Static",
        items: [
            { type: "heading", label: "Heading", icon: "text-font", premium: false },
            { type: "divider", label: "Divider", icon: "minus", premium: false, dividerThickness: 1, dividerColor: "#e1e3e5", dividerStyle: "solid" },
            { type: "spacing", label: "Spacing", icon: "viewport-tall", premium: false, spacingHeight: 20 },
            { type: "paragraph", label: "Paragraph", icon: "text", premium: false, content: "" },
            { type: "html", label: "HTML", icon: "code", premium: true, htmlContent: "" },
        ]
    }
];

export default function NewOptionSetPage() {
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const { products } = useLoaderData<typeof loader>();
    const hasSubmitted = React.useRef(false);
    const prevFetcherState = React.useRef(fetcher.state);


    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";

    const [groups, setGroups] = useState<any[]>([
        { id: 'group-1', name: 'Group', expanded: true, elements: [] }
    ]);
    const [activeGroupId, setActiveGroupId] = useState<string>('group-1');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState("");

    const [optionSetName, setOptionSetName] = useState("New Option Set");
    const [optionSetStatus, setOptionSetStatus] = useState("active");
    const [tempOptionSetName, setTempOptionSetName] = useState("");
    const [tempOptionSetStatus, setTempOptionSetStatus] = useState("");
    const [previewMode, setPreviewMode] = useState("desktop");
    const [editingElement, setEditingElement] = useState<any | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'elements' | 'products'>('elements');
    const [isClosing, setIsClosing] = useState(false);
    const [insertionIndex, setInsertionIndex] = useState<number | null>(null);

    const availableElements = React.useMemo(() => {
        if (!editingElement) return [];
        const list: any[] = [];
        for (const group of groups) {
            if (group.id === editingElement.groupId) {
                list.push(...group.elements.slice(0, editingElement.index));
                break;
            }
            list.push(...group.elements);
        }
        return list.filter(el => !['heading', 'divider', 'spacing', 'paragraph', 'html'].includes(el.type));
    }, [groups, editingElement]);

    const handleClose = () => {
        console.log("--- handleClose() called (New) ---");
        setIsClosing(true);
        setTimeout(() => {
            navigate("/app/option-sets");
        }, 350);
    };

    useEffect(() => {
        const wasSubmitting = prevFetcherState.current === "submitting" || prevFetcherState.current === "loading";
        const isNowIdle = fetcher.state === "idle";
        const isSuccess = (fetcher.data as any)?.success;

        console.log("--- SUCCESS WATCHER check (New) ---", {
            state: fetcher.state,
            wasSubmitting,
            isNowIdle,
            isSuccess,
            hasSubmitted: hasSubmitted.current
        });

        if (hasSubmitted.current && wasSubmitting && isNowIdle && isSuccess) {
            console.log("Save successful (New)! Closing builder...");
            hasSubmitted.current = false;
            setIsClosing(true);
            setTimeout(() => {
                navigate("/app/option-sets");
            }, 350);
        }

        prevFetcherState.current = fetcher.state;
    }, [fetcher.state, fetcher.data]);

    // Product Selection State
    const [selectionMode, setSelectionMode] = useState<'manual' | 'automatic' | 'all'>('all');
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [conditions, setConditions] = useState([{ id: Date.now(), type: 'tag', operator: 'equals', value: '' }]);
    const [matchType, setMatchType] = useState<'all' | 'any'>('all');

    const handleOpenSettingsModal = () => {
        setTempOptionSetName(optionSetName);
        setTempOptionSetStatus(optionSetStatus);
        setTimeout(() => {
            const trigger = document.getElementById('hidden-settings-modal-trigger');
            if (trigger) trigger.click();
        }, 10);
    };

    const handleSaveSettings = () => {
        setOptionSetName(tempOptionSetName);
        setOptionSetStatus(tempOptionSetStatus);
    };

    // Always-fresh payload for the native form submission
    const savePayload = JSON.stringify({
        title: optionSetName,
        status: optionSetStatus,
        groups: groups,
        selectionMode,
        selectedProducts,
        conditions,
        matchType
    });



    const handleOpenEditModal = (group: any) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
        setTimeout(() => {
            const trigger = document.getElementById('hidden-edit-modal-trigger');
            if (trigger) trigger.click();
        }, 10);
    };

    const handleSaveGroupName = () => {
        setGroups(groups.map(g => {
            if (g.id === editingGroupId) {
                return { ...g, name: editingGroupName };
            }
            return g;
        }));
        setTimeout(() => {
            const closeBtn = document.querySelector('s-modal#edit-group-modal s-button[command="--hide"]') as HTMLElement;
            if (closeBtn) closeBtn.click();
        }, 10);
    };

    const handleOpenModal = (groupId: string, index?: number) => {
        setActiveGroupId(groupId);
        setInsertionIndex(index !== undefined ? index : null);
        setTimeout(() => {
            const trigger = document.getElementById('hidden-modal-trigger');
            if (trigger) trigger.click();
        }, 10);
    };

    const handleAddElement = (item: any) => {
        setGroups(groups.map(g => {
            if (g.id === activeGroupId) {
                const newElement = {
                    ...item,
                    id: `${item.type}-${Date.now()}`,
                    hidden: false,
                    placeholder: "",
                    helpText: "",
                    required: false,
                    hiddenLabel: false,
                    logicEnabled: false,
                    conditions: [{ field: "", operator: "EQUALS", value: "" }]
                };

                const newElements = [...g.elements];
                if (insertionIndex !== null) {
                    newElements.splice(insertionIndex, 0, newElement);
                } else {
                    newElements.push(newElement);
                }

                return { ...g, elements: newElements };
            }
            return g;
        }));

        setTimeout(() => {
            const closeBtn = document.querySelector('s-modal#modal s-button[command="--hide"]') as HTMLElement;
            if (closeBtn) closeBtn.click();
        }, 10);
    };

    const handleElementClick = (group: any, element: any, index: number) => {
        setEditingElement({ groupId: group.id, element, index });
    };

    const handleUpdateElement = (updatedData: any) => {
        if (!editingElement) return;

        const updatedElement = { ...editingElement.element, ...updatedData };
        setEditingElement({ ...editingElement, element: updatedElement });

        setGroups(prevGroups => prevGroups.map(g => {
            if (g.id === editingElement.groupId) {
                const newElements = [...g.elements];
                newElements[editingElement.index] = updatedElement;
                return { ...g, elements: newElements };
            }
            return g;
        }));
    };

    const handleAddCondition = () => {
        if (!editingElement) return;
        const currentConditions = editingElement.element.conditions || [];
        handleUpdateElement({
            conditions: [...currentConditions, { field: "", operator: "EQUALS", value: "" }]
        });
    };

    const handleRemoveCondition = (conditionIndex: number) => {
        if (!editingElement) return;
        const currentConditions = editingElement.element.conditions || [];
        handleUpdateElement({
            conditions: currentConditions.filter((_: any, i: number) => i !== conditionIndex)
        });
    };

    const handleUpdateCondition = (conditionIndex: number, updatedCondition: any) => {
        if (!editingElement) return;
        const currentConditions = [...(editingElement.element.conditions || [])];
        currentConditions[conditionIndex] = { ...currentConditions[conditionIndex], ...updatedCondition };
        handleUpdateElement({ conditions: currentConditions });
    };

    const handleDuplicate = (groupId: string, index: number) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const newElements = [...g.elements];
                const original = newElements[index];
                const duplicate = { ...original, id: `${original.type}-${Date.now()}` };
                newElements.splice(index + 1, 0, duplicate);
                return { ...g, elements: newElements };
            }
            return g;
        }));
    };

    const handleToggleVisibility = (groupId: string, index: number) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const newElements = [...g.elements];
                newElements[index] = { ...newElements[index], hidden: !newElements[index].hidden };
                return { ...g, elements: newElements };
            }
            return g;
        }));
    };

    const handleDelete = (groupId: string, index: number) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return { ...g, elements: g.elements.filter((_: any, i: number) => i !== index) };
            }
            return g;
        }));
    };

    const handleReorderElement = (groupId: string, oldIndex: number, newIndex: number) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const newElements = Array.from(g.elements);
                const [movedElement] = newElements.splice(oldIndex, 1);
                newElements.splice(newIndex, 0, movedElement);
                return { ...g, elements: newElements };
            }
            return g;
        }));
    };

    const handleDeleteGroup = (groupId: string) => {
        setGroups(groups.filter(g => g.id !== groupId));
    };

    const handleAddGroup = () => {
        const newId = `group-${Date.now()}`;
        setGroups([...groups, { id: newId, name: 'Group', expanded: true, elements: [] }]);
    };

    const handleToggleGroupExpansion = (groupId: string) => {
        setGroups(groups.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g));
    };

    const handleToggleGroupVisibility = (groupId: string) => {
        setGroups(groups.map(g => g.id === groupId ? { ...g, hidden: !g.hidden } : g));
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999,
                display: 'flex',
                alignItems: 'flex-end',
                padding: '.5rem .5rem 0 .5rem',
            }}
        >
            {/* Background Overlay */}
            <div
                onClick={() => {
                    console.log("--- OVERLAY CLICKED (CLOSE) (New) ---");
                    handleClose();
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: isClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.5)',
                    transition: 'background-color 0.3s ease',
                    zIndex: 1
                }}
            />
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); }
                    to { transform: translateY(100%); }
                }
                .bottom-sheet {
                    width: 100%;
                    height: 99vh;
                    background: white;
                    border-top-left-radius: 16px;
                    border-top-right-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 -8px 30px rgba(0,0,0,0.15);
                    position: relative;
                }
                .bottom-sheet.closing {
                    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .element-option {
                    transition: background-color 0.2s ease;
                }
                .element-option:hover {
                    background-color: var(--p-color-bg-surface-secondary-hover, #f1f2f4);
                }
                .action-icon-wrapper {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .action-icon-wrapper:hover {
                    opacity: 0.7;
                }
                .add-item-button {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: 0;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--p-color-text-link, #2c6ecb);
                    transition: all 0.2s ease;
                    outline: none;
                    font-family: inherit;
                    font-size: 13px;
                }
                .add-item-button:hover {
                    background-color: var(--p-color-bg-surface-secondary-hover, #f1f2f4);
                    border-color: var(--p-color-border-interactive, #2c6ecb);
                    border-style: solid;
                }
            `}</style>



            <div className={`bottom-sheet ${isClosing ? 'closing' : ''}`} style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '0' }}>
                            <div style={{ borderBottom: '1px solid #e1e3e5', padding: '10px 16px' }}>
                                <s-grid gridTemplateColumns="1fr auto" alignItems="center">
                                    <s-stack direction="inline" gap="small" alignItems="center">
                                        <s-heading>{optionSetName}</s-heading>
                                        <s-badge tone={optionSetStatus === 'active' ? 'success' : 'neutral'}>
                                            {optionSetStatus === 'active' ? 'Active' : 'Draft'}
                                        </s-badge>
                                        <button
                                            onClick={handleOpenSettingsModal}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', outline: 'none' }}
                                        >
                                            <s-icon type="menu-horizontal" size="medium" tone="base"></s-icon>
                                        </button>
                                    </s-stack>

                                    <s-stack direction="inline" gap="small" alignItems="center">
                                        <s-box background="strong" borderRadius="small" padding="small-500">
                                            <s-stack direction="inline" gap="small-400">
                                                <button
                                                    onClick={() => setPreviewMode("desktop")}
                                                    style={{
                                                        background: previewMode === "desktop" ? "#fff" : "transparent",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        padding: "6px 12px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        outline: "none",
                                                        boxShadow: previewMode === "desktop" ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
                                                    }}
                                                >
                                                    <s-icon type="desktop" size="medium" tone={previewMode === "desktop" ? "base" : "subdued"}></s-icon>
                                                </button>
                                                <button
                                                    onClick={() => setPreviewMode("mobile")}
                                                    style={{
                                                        background: previewMode === "mobile" ? "#fff" : "transparent",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        padding: "6px 12px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        outline: "none",
                                                        boxShadow: previewMode === "mobile" ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
                                                    }}
                                                >
                                                    <s-icon type="mobile" size="medium" tone={previewMode === "mobile" ? "base" : "subdued"}></s-icon>
                                                </button>
                                            </s-stack>
                                        </s-box>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                console.log("--- DISCARD BUTTON CLICKED (New) ---");
                                                handleClose();
                                            }}
                                            style={{
                                                background: 'white',
                                                border: '1px solid #d1d1d1',
                                                padding: '7px 16px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Discard
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={(e) => {
                                                console.log("--- SAVE BUTTON HANDLER START (New) ---");
                                                e.stopPropagation();
                                                hasSubmitted.current = true;
                                                fetcher.submit({ data: savePayload }, { method: "post" });
                                            }}
                                            style={{
                                                backgroundColor: isSaving ? '#616161' : '#303030',
                                                color: 'white',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '8px',
                                                padding: '7px 16px',
                                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '64px',
                                                height: '32px'
                                            }}
                                        >
                                            {isSaving ? <s-spinner size="small" tone="inherit"></s-spinner> : "Save"}
                                        </button>
                                    </s-stack>
                                </s-grid>
                            </div>

                            <s-grid gridTemplateColumns="1fr 1fr" gap="medium" alignItems="start">
                                <div style={{
                                    height: 'calc(100vh - 66px)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    background: 'white'
                                }}>
                                    {/* Left Navigation Sidebar */}
                                    <div style={{
                                        width: '54px',
                                        borderRight: '1px solid #e1e3e5',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        paddingBlock: '10px',
                                        gap: '10px',
                                        background: '#ffffff'
                                    }}>
                                        <div
                                            onClick={() => setActiveSidebarTab('elements')}
                                            style={{
                                                background: activeSidebarTab === 'elements' ? '#f1f2f4' : 'transparent',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <s-icon type="layout-buy-button" size="medium" tone={activeSidebarTab === 'elements' ? "base" : "subdued"}></s-icon>
                                        </div>
                                        <div
                                            onClick={() => setActiveSidebarTab('products')}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                background: activeSidebarTab === 'products' ? '#f1f2f4' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <s-icon type="product" size="medium" tone={activeSidebarTab === 'products' ? "base" : "subdued"}></s-icon>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                                        {activeSidebarTab === 'products' ? (
                                            <SelectProducts
                                                allProducts={products}
                                                selectionMode={selectionMode}
                                                setSelectionMode={setSelectionMode}
                                                selectedProducts={selectedProducts}
                                                setSelectedProducts={setSelectedProducts}
                                                conditions={conditions}
                                                setConditions={setConditions}
                                                matchType={matchType}
                                                setMatchType={setMatchType}
                                            />
                                        ) : editingElement ? (
                                            <EditPanel
                                                editingElement={editingElement}
                                                setEditingElement={setEditingElement}
                                                handleUpdateElement={handleUpdateElement}
                                                handleAddCondition={handleAddCondition}
                                                handleRemoveCondition={handleRemoveCondition}
                                                handleUpdateCondition={handleUpdateCondition}
                                                products={products}
                                                availableElements={availableElements}
                                            />
                                        ) : (
                                            <ElementSidebar
                                                groups={groups}
                                                editingElement={editingElement}
                                                handleToggleGroupExpansion={handleToggleGroupExpansion}
                                                handleDeleteGroup={handleDeleteGroup}
                                                handleOpenEditModal={handleOpenEditModal}
                                                handleElementClick={handleElementClick}
                                                handleDuplicate={handleDuplicate}
                                                handleToggleVisibility={handleToggleVisibility}
                                                handleDelete={handleDelete}
                                                handleReorderElement={handleReorderElement}
                                                handleOpenModal={handleOpenModal}
                                                handleAddGroup={handleAddGroup}
                                                handleToggleGroupVisibility={handleToggleGroupVisibility}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Product Preview Section */}
                                <div className="preview-column">
                                    <LivePreview
                                        groups={groups}
                                        previewMode={previewMode}
                                    />
                                </div>
                            </s-grid>
                        </div>

                        {/* Modals */}
                        <div style={{ display: 'none' }}>
                            <s-button id="hidden-modal-trigger" commandFor="modal">Open</s-button>
                        </div>
                        <s-modal id="modal" heading="Select an element">
                            <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="large" padding="base">
                                {ELEMENT_OPTIONS.map((category) => (
                                    <s-box key={category.title}>
                                        <s-heading>{category.title}</s-heading>
                                        <s-box paddingBlockStart="base">
                                            <s-stack direction="vertical" gap="small-200">
                                                {category.items.map((item) => (
                                                    <div key={item.label} className="element-option" onClick={() => handleAddElement(item)} style={{ cursor: "pointer", padding: "6px 8px", marginInlineStart: "-8px" }}>
                                                        <s-stack direction="inline" alignItems="center" gap="small-200">
                                                            <s-icon type={item.icon} size="medium" tone="subdued"></s-icon>
                                                            <s-paragraph>{item.label}</s-paragraph>
                                                        </s-stack>
                                                    </div>
                                                ))}
                                            </s-stack>
                                        </s-box>
                                    </s-box>
                                ))}
                            </s-grid>
                            <s-button slot="secondary-actions" commandFor="modal" command="--hide">Cancel</s-button>
                        </s-modal>

                        <div style={{ display: 'none' }}>
                            <s-button id="hidden-edit-modal-trigger" commandFor="edit-group-modal">Open Edit</s-button>
                        </div>
                        <s-modal id="edit-group-modal" heading="Edit group name">
                            <s-box>
                                <s-stack gap="base" direction="vertical">
                                    <s-text-field label="Group name" name="groupName" value={editingGroupName} onInput={(e: any) => setEditingGroupName(e.target.value)}></s-text-field>
                                </s-stack>
                            </s-box>
                            <s-button slot="primary-action" variant="primary" onClick={handleSaveGroupName}>Save changes</s-button>
                            <s-button slot="secondary-actions" variant="secondary" commandFor="edit-group-modal" command="--hide">Cancel</s-button>
                        </s-modal>

                        <div style={{ display: 'none' }}>
                            <s-button id="hidden-settings-modal-trigger" commandFor="settings-modal">Open Settings</s-button>
                        </div>
                        <s-modal id="settings-modal" heading="Manage option set">
                            <s-box>
                                <s-stack gap="base" direction="vertical">
                                    <s-text-field label="Name" value={tempOptionSetName} onInput={(e: any) => setTempOptionSetName(e.target.value)}></s-text-field>
                                    <s-select label="Status" value={tempOptionSetStatus} onChange={(e: any) => setTempOptionSetStatus(e.target.value)}>
                                        <s-option value="active">Active</s-option>
                                        <s-option value="draft">Draft</s-option>
                                    </s-select>
                                </s-stack>
                            </s-box>
                            <s-button slot="primary-action" variant="primary" onClick={handleSaveSettings} commandFor="settings-modal" command="--hide">Done</s-button>
                        </s-modal>
                    </div>
                </div>
            </div>
        </div>
    );
}
