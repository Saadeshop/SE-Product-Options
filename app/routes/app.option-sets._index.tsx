import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLoaderData, type LoaderFunctionArgs, useSubmit, useNavigation } from "react-router";
import { Button, Box, Pagination, Divider, InlineStack, ButtonGroup, IndexTable, Text, Badge, Link, useIndexResourceState, Modal, Icon } from "@shopify/polaris";
import { EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, DuplicateIcon, SearchIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const optionSets = await db.optionSet.findMany({
        where: { shop: session.shop },
        orderBy: { createdAt: "desc" }
    });
    return { optionSets };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType");
    const selectedIds = JSON.parse(formData.get("selectedIds") as string);

    if (actionType === "active") {
        await db.optionSet.updateMany({
            where: { id: { in: selectedIds }, shop: session.shop },
            data: { status: "active" }
        });
    } else if (actionType === "draft") {
        await db.optionSet.updateMany({
            where: { id: { in: selectedIds }, shop: session.shop },
            data: { status: "draft" }
        });
    } else if (actionType === "duplicate") {
        const setsToDuplicate = await db.optionSet.findMany({
            where: { id: { in: selectedIds }, shop: session.shop }
        });

        for (const set of setsToDuplicate) {
            const shortId = Math.floor(10000000 + Math.random() * 90000000).toString();
            await db.optionSet.create({
                data: {
                    id: shortId,
                    shop: session.shop,
                    title: `${set.title} (Copy)`,
                    status: "draft",
                    groups: set.groups,
                    selectionMode: set.selectionMode,
                    selectedProducts: set.selectedProducts || "[]",
                    conditions: set.conditions || "[]",
                }
            });
        }
    } else if (actionType === "delete") {
        await db.optionSet.deleteMany({
            where: { id: { in: selectedIds }, shop: session.shop }
        });
    }

    return { success: true };
};

export default function OptionSetsPage() {
    const navigate = useNavigate();
    const submit = useSubmit();
    const { optionSets } = useLoaderData<typeof loader>();
    const [selectedTab, setSelectedTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("created");
    const [sortOrder, setSortOrder] = useState("desc");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Debounce search query
    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setIsFiltering(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const pageSize = 10;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTab, searchQuery, sortBy, sortOrder]);

    // Derived Data: Filtered and Sorted
    const filteredOptionSets = useMemo(() => {
        return optionSets
            .filter((set: any) => {
                const matchesTab = selectedTab === "all" || set.status === selectedTab;
                const title = set.title || "";
                const matchesSearch = title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
                return matchesTab && matchesSearch;
            })
            .sort((a: any, b: any) => {
                let comparison = 0;
                if (sortBy === "name") comparison = a.title.localeCompare(b.title);
                if (sortBy === "created") comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (sortBy === "status") comparison = a.status.localeCompare(b.status);

                return sortOrder === "asc" ? comparison : -comparison;
            });
    }, [optionSets, selectedTab, debouncedSearchQuery, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredOptionSets.length / pageSize);

    // Derived Data: Paginated
    const paginatedOptionSets = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredOptionSets.slice(startIndex, startIndex + pageSize);
    }, [filteredOptionSets, currentPage, pageSize]);

    const resourceName = {
        singular: 'option set',
        plural: 'option sets',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(paginatedOptionSets);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [idsToProcess, setIdsToProcess] = useState<string[]>([]);
    const [pendingAction, setPendingAction] = useState<string>("");

    const handleBulkAction = (actionType: string) => {
        setIdsToProcess(selectedResources);
        setPendingAction(actionType);
        setIsConfirmModalOpen(true);
    };

    const confirmAction = () => {
        submit(
            { actionType: pendingAction, selectedIds: JSON.stringify(idsToProcess) },
            { method: "post" }
        );
        setIsConfirmModalOpen(false);
        setIdsToProcess([]);
        setPendingAction("");
    };

    const getModalConfig = () => {
        const count = idsToProcess.length;
        const plural = count === 1 ? 'option set' : 'option sets';

        switch (pendingAction) {
            case 'active':
                return {
                    title: `Set ${plural} as active?`,
                    content: `Are you sure you want to set ${count === 1 ? 'this' : count} ${plural} to active?`,
                    primaryContent: 'Set as active',
                    destructive: false,
                };
            case 'draft':
                return {
                    title: `Set ${plural} as draft?`,
                    content: `Are you sure you want to set ${count === 1 ? 'this' : count} ${plural} to draft?`,
                    primaryContent: 'Set as draft',
                    destructive: false,
                };
            case 'duplicate':
                return {
                    title: `Duplicate ${plural}?`,
                    content: `Are you sure you want to duplicate ${count === 1 ? 'this' : count} ${plural}?`,
                    primaryContent: 'Duplicate',
                    destructive: false,
                };
            case 'delete':
                return {
                    title: `Delete ${plural}?`,
                    content: `Are you sure you want to delete ${count === 1 ? 'this' : count} ${plural}? This action cannot be undone.`,
                    primaryContent: 'Delete',
                    destructive: true,
                };
            default:
                return { title: '', content: '', primaryContent: '', destructive: false };
        }
    };

    const modalConfig = getModalConfig();


    return (
        <s-page heading="SE Product Options">
            {optionSets.length === 0 ? (
                <s-section>
                    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
                        <s-box maxInlineSize="200px" maxBlockSize="200px">
                            <s-image
                                aspectRatio="1/0.5"
                                src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                                alt="A stylized graphic of four characters, each holding a puzzle piece"
                            />
                        </s-box>
                        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                            <s-stack alignItems="center">
                                <s-heading>No option sets found</s-heading>
                                <s-paragraph>
                                    Create your first option set to start customizing your products.
                                </s-paragraph>
                            </s-stack>
                            <s-button variant="primary" onClick={() => navigate("/app/option-sets/new")}>
                                Create option set
                            </s-button>
                        </s-grid>
                    </s-grid>
                </s-section>
            ) : (
                <s-box>
                    <s-stack gap="base">
                        <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                            <h1 style={{ fontSize: '1rem', fontWeight: '600' }}>Option Sets</h1>
                            <s-button variant="primary" onClick={() => navigate("/app/option-sets/new")}>
                                Create option set
                            </s-button>
                        </s-stack>

                        <div style={{
                            backgroundColor: 'white',
                            border: '1px solid #e1e3e5',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            {/* Tabs and Search Header */}
                            <s-box paddingBlock="small-200" paddingInline="small" borderBottom="base">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: '32px' }}>
                                    {!isSearchExpanded ? (
                                        <>
                                            <div style={{ display: 'flex', gap: '0' }}>
                                                <s-button
                                                    variant={selectedTab === "all" ? "primary" : "tertiary"}
                                                    onClick={() => setSelectedTab("all")}
                                                >All</s-button>
                                                <s-button
                                                    variant={selectedTab === "active" ? "primary" : "tertiary"}
                                                    onClick={() => setSelectedTab("active")}
                                                >Active</s-button>
                                                <s-button
                                                    variant={selectedTab === "draft" ? "primary" : "tertiary"}
                                                    onClick={() => setSelectedTab("draft")}
                                                >Draft</s-button>
                                            </div>
                                            <div style={{ flex: 1 }} />

                                            <s-button
                                                icon="search"
                                                variant="secondary"
                                                onClick={() => setIsSearchExpanded(true)}
                                                accessibilityLabel="Search"
                                            />
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <s-text-field
                                                    label="Search option sets"
                                                    labelAccessibilityVisibility="exclusive"
                                                    icon="search"
                                                    placeholder="Filter option sets"
                                                    value={searchQuery}
                                                    onInput={(e: any) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                    style={{ fontSize: '12px', width: '100%' }}
                                                />
                                                {isFiltering && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 10,
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        <s-spinner accessibilityLabel="Loading" size="base"></s-spinner>
                                                    </div>
                                                )}
                                            </div>
                                            <s-button
                                                variant="tertiary"
                                                onClick={() => {
                                                    setIsSearchExpanded(false);
                                                    setSearchQuery("");
                                                }}
                                            >Cancel</s-button>
                                        </div>
                                    )}
                                </div>
                            </s-box>

                            <s-section padding="none">
                                <div style={{ position: 'relative' }}>
                                    {filteredOptionSets.length === 0 ? (
                                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                            <s-stack gap="small-400" alignItems="center">
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Icon source={SearchIcon} size="large" />
                                                </div>
                                                <Text variant="headingMd" as="h2">No option sets found</Text>
                                                <Text variant="bodyMd" as="p" color="subdued">
                                                    Try changing the filters or search term
                                                </Text>
                                            </s-stack>
                                        </div>
                                    ) : (
                                        <Box width="100%">
                                            {selectedResources.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    left: '43px',
                                                    zIndex: 500,
                                                    pointerEvents: 'none'
                                                }}>
                                                    <Text as="span" variant="bodySm" style={{ color: '#202223' }}>
                                                        {selectedResources.length} selected
                                                    </Text>
                                                </div>
                                            )}
                                            <IndexTable
                                                resourceName={resourceName}
                                                itemCount={paginatedOptionSets.length}
                                                selectedItemsCount={
                                                    allResourcesSelected ? 'All' : selectedResources.length
                                                }
                                                onSelectionChange={handleSelectionChange}
                                                headings={[
                                                    { title: 'Name' },
                                                    { title: 'Status' },
                                                    { title: 'Groups' },
                                                    { title: 'Elements' },
                                                    { title: 'Rule' },
                                                    { title: 'Date created' },
                                                    { title: 'Actions', alignment: 'end' },
                                                ]}
                                                promotedBulkActions={[
                                                    {
                                                        content: 'Set as active',
                                                        onAction: () => handleBulkAction("active"),
                                                    },
                                                    {
                                                        content: 'Set as draft',
                                                        onAction: () => handleBulkAction("draft"),
                                                    },
                                                    {
                                                        content: 'Duplicate option sets',
                                                        onAction: () => handleBulkAction("duplicate"),
                                                    },
                                                    {
                                                        content: 'Delete',
                                                        onAction: () => handleBulkAction("delete"),
                                                        destructive: true,
                                                    },
                                                ]}
                                            >
                                                {paginatedOptionSets.map((set: any, index: number) => {
                                                    let groupCount = 0;
                                                    let elementCount = 0;
                                                    try {
                                                        const groups = JSON.parse(set.groups || "[]");
                                                        groupCount = Array.isArray(groups) ? groups.length : 0;
                                                        if (Array.isArray(groups)) {
                                                            groups.forEach((group: any) => {
                                                                if (group.elements && Array.isArray(group.elements)) {
                                                                    elementCount += group.elements.length;
                                                                }
                                                            });
                                                        }
                                                    } catch (e) {
                                                        groupCount = 0;
                                                        elementCount = 0;
                                                    }

                                                    return (
                                                        <IndexTable.Row
                                                            id={set.id}
                                                            key={set.id}
                                                            selected={selectedResources.includes(set.id)}
                                                            position={index}
                                                        >
                                                            <IndexTable.Cell>
                                                                <Text as="span" variant="bodySm">
                                                                    {set.title}
                                                                </Text>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <Badge tone={set.status === 'active' ? 'success' : 'neutral'}>
                                                                    {set.status.charAt(0).toUpperCase() + set.status.slice(1)}
                                                                </Badge>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <Text color="subdued" as="span">{groupCount}</Text>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <Text color="subdued" as="span">{elementCount}</Text>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <Text color="subdued" as="span">
                                                                    {set.selectionMode === 'all' ? 'All products' :
                                                                        set.selectionMode === 'manual' ? 'Manual selection' :
                                                                            'Rule based'}
                                                                </Text>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <Text color="subdued" as="span">
                                                                    {new Date(set.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                </Text>
                                                            </IndexTable.Cell>
                                                            <IndexTable.Cell>
                                                                <InlineStack align="end" gap="200">
                                                                    <Button
                                                                        icon={EditIcon}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/app/option-sets/${set.id}`);
                                                                        }}
                                                                        accessibilityLabel="Edit option set"
                                                                    />
                                                                    <Button
                                                                        icon={DuplicateIcon}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIdsToProcess([set.id]);
                                                                            setPendingAction("duplicate");
                                                                            setIsConfirmModalOpen(true);
                                                                        }}
                                                                        accessibilityLabel="Duplicate option set"
                                                                    />
                                                                    <Button
                                                                        icon={DeleteIcon}
                                                                        tone="critical"
                                                                        accessibilityLabel="Delete option set"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIdsToProcess([set.id]);
                                                                            setPendingAction("delete");
                                                                            setIsConfirmModalOpen(true);
                                                                        }}
                                                                    />
                                                                </InlineStack>
                                                            </IndexTable.Cell>
                                                        </IndexTable.Row>
                                                    );
                                                })}
                                            </IndexTable>

                                            {totalPages > 1 && (
                                                <>
                                                    <Divider />
                                                    <Box padding="300">
                                                        <InlineStack gap="300" align="start" blockAlign="center">
                                                            <ButtonGroup variant="segmented">
                                                                <Button
                                                                    icon={ChevronLeftIcon}
                                                                    disabled={currentPage === 1}
                                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                />
                                                                <Button
                                                                    icon={ChevronRightIcon}
                                                                    disabled={currentPage === totalPages}
                                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                                />
                                                            </ButtonGroup>
                                                            <Text variant="bodySm" as="p" color="subdued">
                                                                Page {currentPage} of {totalPages}
                                                            </Text>
                                                        </InlineStack>
                                                    </Box>
                                                </>
                                            )}
                                        </Box>
                                    )}
                                </div>
                            </s-section>
                        </div>
                    </s-stack>
                </s-box>
            )}

            <Modal
                open={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title={modalConfig.title}
                primaryAction={{
                    content: modalConfig.primaryContent,
                    onAction: confirmAction,
                    destructive: modalConfig.destructive,
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsConfirmModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    <p>{modalConfig.content}</p>
                </Modal.Section>
            </Modal>
        </s-page>
    );
}
