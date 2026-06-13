import React from 'react';
import '../../styles/product-options.css';

import { RichTextEditor } from './RichTextEditor';
const FONT_OPTIONS = [
    // Standard / Safe Web Fonts
    "Arial",
    "Helvetica",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Trebuchet MS",
    "Impact",
    "Comic Sans MS",
    "Tahoma",
    "Garamond",
    // Regular Use & Modern Sans-Serif Fonts (Highly popular)
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Poppins",
    "Outfit",
    "DM Sans",
    "Ubuntu",
    "Cabin",
    "Raleway",
    "Nunito",
    "Rubik",
    "Quicksand",
    "Josefin Sans",
    // Regular Use Serif Fonts
    "Playfair Display",
    "Lora",
    "Merriweather",
    // Trendy & Display Fonts
    "Bebas Neue",
    "Syne",
    "Abril Fatface",
    "Comfortaa",
    "Righteous",
    "Cinzel",
    "Oswald",
    // Premium Cursive, Script, & Handwritten Fonts
    "Pacifico",
    "Dancing Script",
    "Lobster",
    "Great Vibes",
    "Caveat",
    "Satisfy",
    "Sacramento",
    "Cookie",
    "Alex Brush",
    "Allura",
    "Pinyon Script",
    "Playball",
    "Parisienne",
    "Shadows Into Light",
    "Amatic SC"
];

interface BasicSettingsProps {
    editingElement: any;
    handleUpdateElement: (data: any) => void;
    children?: React.ReactNode;
}

export const BasicSettings: React.FC<BasicSettingsProps> = ({
    editingElement,
    handleUpdateElement,
    children
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isFontDropdownOpen, setIsFontDropdownOpen] = React.useState(false);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: any) => {
            const isInsideExt = event.target.closest(`.se-ext-container-${editingElement.element.id}`);
            const isInsidePicker = event.target.closest(`.se-color-picker-container-${editingElement.element.id}`);
            if (!isInsideExt && !isInsidePicker) {
                setIsDropdownOpen(false);
            }
            if (!event.target.closest('.se-font-dropdown-container')) {
                setIsFontDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [editingElement.element.id]);

    React.useEffect(() => {
        if (editingElement.element.type === 'font-picker' && !document.getElementById('google-fonts-font-picker')) {
            const link = document.createElement('link');
            link.id = 'google-fonts-font-picker';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alex+Brush&family=Allura&family=Amatic+SC:wght@400;700&family=Bebas+Neue&family=Cabin:wght@400;700&family=Caveat:wght@400;700&family=Cinzel:wght@400;700&family=Comfortaa:wght@400;700&family=Cookie&family=DM+Sans:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Inter:wght@400;500;700&family=Josefin+Sans:wght@400;700&family=Lato:wght@400;700&family=Lobster&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;700&family=Nunito:wght@400;700&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;500;700&family=Outfit:wght@400;700&family=Pacifico&family=Parisienne&family=Pinyon+Script&family=Playball&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;500;700&family=Quicksand:wght@400;700&family=Raleway:wght@400;700&family=Righteous&family=Roboto:wght@400;500;700&family=Rubik:wght@400;700&family=Satisfy&family=Sacramento&family=Shadows+Into+Light&family=Syne:wght@400;700&family=Ubuntu:wght@400;700&display=swap';
            document.head.appendChild(link);
        }
    }, [editingElement.element.type]);

    const isHeading = editingElement.element.type === 'heading';
    const isDivider = editingElement.element.type === 'divider';
    const isSpacing = editingElement.element.type === 'spacing';
    const isParagraph = editingElement.element.type === 'paragraph';
    const isHtml = editingElement.element.type === 'html';

    return (
        <s-stack direction="vertical" gap="small-400" paddingInline="base" style={{ paddingTop: '8px' }}>
            {isHeading ? (
                <>
                    {/* Heading Content */}
                    <div className="se-content-field">
                        <div className="se-field-label-row">
                            <span className="se-field-label">Content</span>
                        </div>
                        <s-text-field
                            value={editingElement.element.content || ''}
                            onInput={(e: any) => handleUpdateElement({ content: e.target.value })}
                        ></s-text-field>
                    </div>

                    {/* Color + Style row */}
                    <s-grid gridTemplateColumns="1fr 1fr" gap="small">
                        {/* Color picker */}
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Color</span>
                            </div>
                            <div className={`se-color-picker-container-${editingElement.element.id}`} style={{ position: 'relative' }}>
                                <div
                                    className="se-color-trigger"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div
                                        className="se-color-trigger-swatch"
                                        style={{ background: editingElement.element.headingColor || '#000000' }}
                                    />
                                    <span className="se-color-trigger-hex">
                                        {(editingElement.element.headingColor || '#000000').slice(0, 7)}
                                    </span>
                                </div>
                                {isDropdownOpen && (
                                    <div
                                        className="se-color-popover"
                                        onMouseDown={(e: any) => e.stopPropagation()}
                                    >
                                        <s-color-picker
                                            value={editingElement.element.headingColor || '#000000ff'}
                                            alpha
                                            onInput={(e: any) => handleUpdateElement({ headingColor: e.target.value })}
                                        ></s-color-picker>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Style dropdown */}
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Style</span>
                            </div>
                            <s-select
                                value={editingElement.element.headingStyle || 'H2'}
                                onInput={(e: any) => handleUpdateElement({ headingStyle: e.target.value })}
                            >
                                <s-option value="H1">Heading 1</s-option>
                                <s-option value="H2">Heading 2</s-option>
                                <s-option value="H3">Heading 3</s-option>
                                <s-option value="H4">Heading 4</s-option>
                                <s-option value="H5">Heading 5</s-option>
                                <s-option value="H6">Heading 6</s-option>
                            </s-select>
                        </div>
                    </s-grid>
                </>
            ) : isDivider ? (
                <>

                    {/* Color + Style row */}
                    <s-grid gridTemplateColumns="1fr 1fr" gap="small">
                        {/* Color picker */}
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Color</span>
                            </div>
                            <div className={`se-color-picker-container-${editingElement.element.id}`} style={{ position: 'relative' }}>
                                <div
                                    className="se-color-trigger"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div
                                        className="se-color-trigger-swatch"
                                        style={{ background: editingElement.element.dividerColor || '#e1e3e5' }}
                                    />
                                    <span className="se-color-trigger-hex">
                                        {(editingElement.element.dividerColor || '#e1e3e5').slice(0, 7)}
                                    </span>
                                </div>
                                {isDropdownOpen && (
                                    <div
                                        className="se-color-popover"
                                        onMouseDown={(e: any) => e.stopPropagation()}
                                    >
                                        <s-color-picker
                                            value={editingElement.element.dividerColor || '#e1e3e5ff'}
                                            alpha
                                            onInput={(e: any) => handleUpdateElement({ dividerColor: e.target.value })}
                                        ></s-color-picker>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Style segmented toggle */}
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Style</span>
                            </div>
                            <div className="se-segmented-toggle">
                                {["Solid", "Double", "Dashed", "Dotted"].map((val) => {
                                    const valueKey = val.toLowerCase();
                                    const isActive = (editingElement.element.dividerStyle || 'solid') === valueKey;
                                    return (
                                        <div
                                            key={val}
                                            onClick={() => handleUpdateElement({ dividerStyle: valueKey })}
                                            className={`se-segmented-toggle-item${isActive ? ' active' : ''}`}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </s-grid>

                    {/* Thickness field */}
                    <div style={{ marginTop: '8px' }}>
                        <div className="se-field-label-row">
                            <span className="se-field-label">Thickness</span>
                        </div>
                        <s-number-field
                            value={editingElement.element.dividerThickness !== undefined ? editingElement.element.dividerThickness : 1}
                            min="1"
                            onInput={(e: any) => handleUpdateElement({ dividerThickness: parseInt(e.target.value) || 1 })}
                        ></s-number-field>
                    </div>
                </>
            ) : isSpacing ? (
                <>
                    {/* Height field */}
                    <div className="se-content-field" style={{ marginBottom: '8px' }}>
                        <div className="se-field-label-row">
                            <span className="se-field-label">Height (px)</span>
                        </div>
                        <s-number-field
                            value={editingElement.element.spacingHeight !== undefined ? editingElement.element.spacingHeight : 20}
                            min="0"
                            onInput={(e: any) => handleUpdateElement({ spacingHeight: parseInt(e.target.value) || 0 })}
                        ></s-number-field>
                    </div>
                </>
            ) : isParagraph ? (
                <>
                    {/* Content field (Rich Text / HTML) */}
                    <div className="se-content-field" style={{ marginBottom: '0px' }}>
                        <div className="se-field-label-row">
                            <span className="se-field-label">Content</span>
                        </div>
                        <RichTextEditor value={editingElement.element.content || ''} onChange={(html) => handleUpdateElement({ content: html })} placeholder="Enter paragraph text..." />
                    </div>
                </>
            ) : isHtml ? (
                <>
                    {/* HTML Content field */}
                    <div className="se-content-field" style={{ marginBottom: '0px' }}>
                        <div className="se-field-label-row">
                            <span className="se-field-label">HTML Content</span>
                        </div>
                        <textarea
                            style={{
                                width: '100%',
                                minHeight: '200px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #c9cccf',
                                fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                                fontSize: '13px',
                                outline: 'none',
                                resize: 'vertical',
                                backgroundColor: '#f9fafb'
                            }}
                            value={editingElement.element.htmlContent || ''}
                            onChange={(e: any) => handleUpdateElement({ htmlContent: e.target.value })}
                            placeholder="<div>Enter your custom HTML here...</div>"
                        />
                    </div>
                </>
            ) : (
                <>
                    <s-grid gridTemplateColumns="1fr 1fr" gap="small">
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Label</span>
                            </div>
                            <s-text-field
                                required
                                value={editingElement.element.label}
                                onInput={(e: any) => handleUpdateElement({ label: e.target.value })}
                            ></s-text-field>
                        </div>
                        <div>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Name</span>
                            </div>
                            <s-text-field
                                required
                                value={editingElement.element.name || editingElement.element.type + '-1'}
                                onInput={(e: any) => handleUpdateElement({ name: e.target.value })}
                            ></s-text-field>
                        </div>
                    </s-grid>

                    <s-grid gridTemplateColumns="1fr 1fr" gap="small">
                        <s-checkbox
                            label="Required field"
                            checked={editingElement.element.required || false}
                            onInput={(e: any) => handleUpdateElement({ required: e.target.checked })}
                            className="se-checkbox-row"
                        ></s-checkbox>
                        <s-checkbox
                            label="Hidden label"
                            checked={editingElement.element.hiddenLabel || false}
                            onInput={(e: any) => handleUpdateElement({ hiddenLabel: e.target.checked })}
                            className="se-checkbox-row"
                        ></s-checkbox>
                    </s-grid>
                </>
            )}

            {!isHeading && !isDivider && !isSpacing && !isParagraph && !isHtml && <s-grid gridTemplateColumns="1fr 1fr" gap="small" paddingBlockEnd="small-200">
                <div className={`se-ext-container-${editingElement.element.id}`} style={{ position: 'relative' }}>
                    {editingElement.element.type === 'file' ? (
                        <>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Allowed extensions</span>
                            </div>
                            <s-text-field
                                icon="search"
                                placeholder="Search for extensions"
                                autoComplete="off"
                                onKeyDown={(e: any) => e.preventDefault()}
                                onFocus={() => setIsDropdownOpen(true)}
                                onClick={() => setIsDropdownOpen(true)}
                            ></s-text-field>

                            <div className="se-chips-wrap">
                                {(editingElement.element.allowedExtensions || []).map((ext: string) => (
                                    <s-clickable-chip
                                        key={ext}
                                        color="strong"
                                        removable
                                        onRemove={() => {
                                            handleUpdateElement({ allowedExtensions: (editingElement.element.allowedExtensions || []).filter((e: string) => e !== ext) });
                                        }}
                                    >
                                        {ext}
                                    </s-clickable-chip>
                                ))}
                            </div>

                            {isDropdownOpen && (
                                <div className="se-dropdown-panel">
                                    {[
                                        { title: "Archive & Compressed", items: ["7z", "bin", "rar", "zip"] },
                                        { title: "Audio", items: ["mp3", "mpc", "wav"] },
                                        { title: "Document", items: ["doc", "docx", "rtf", "txt"] },
                                        { title: "Graphics", items: ["3mf", "eps", "ico", "ojb", "stl", "svg"] },
                                        { title: "Image", items: ["bmp", "gif", "heic", "jpg", "jpeg", "png", "tif", "webp"] },
                                        { title: "Video", items: ["mp4", "mov", "wmv", "avi", "mkv", "webm", "hevc"] },
                                        { title: "Presentation", items: ["ppt", "pptx"] },
                                        { title: "Spreadsheet", items: ["csv", "xls", "xlsx"] },
                                        { title: "Others", items: ["ai", "dna", "dst", "dxf", "emb", "pdf", "gpx", "stl", "ps", "psd", "ttf", "otf", "woff", "ttc", "eo", "vcf", "bin", "ect", "ctz", "hpt", "mpc", "fls", "frg", "cod", "dec", "id", "unq", "epr", "uni", "mm3", "sty", "ori", "encBin", "ply", "s2g", "pld", "hpl", "hpt", "efi", "dlg", "mm3", "dat", "constructioninfo", "dentalproject", "pts"] }
                                    ].map(cat => (
                                        <div key={cat.title} className="se-dropdown-category">
                                            <div className="se-dropdown-category-title">{cat.title}</div>
                                            <s-stack gap="none">
                                                {cat.items.map(ext => {
                                                    const isActive = (editingElement.element.allowedExtensions || []).includes(ext);
                                                    return (
                                                        <s-checkbox
                                                            key={ext}
                                                            label={ext}
                                                            checked={isActive}
                                                            onInput={(e: any) => {
                                                                const current = editingElement.element.allowedExtensions || [];
                                                                if (e.target.checked) {
                                                                    handleUpdateElement({ allowedExtensions: [...current, ext] });
                                                                } else {
                                                                    handleUpdateElement({ allowedExtensions: current.filter((e: string) => e !== ext) });
                                                                }
                                                            }}
                                                        ></s-checkbox>
                                                    );
                                                })}
                                            </s-stack>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : editingElement.element.type === 'font-picker' ? (
                        <div className="se-font-dropdown-container" style={{ position: 'relative' }}>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Default Font</span>
                            </div>
                            <div
                                className="se-font-trigger"
                                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                style={{ fontFamily: editingElement.element.defaultValue || 'Inter' }}
                            >
                                <span>{editingElement.element.defaultValue || "Inter"}</span>
                                <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>

                            {isFontDropdownOpen && (
                                <div className="se-font-dropdown">
                                    {FONT_OPTIONS.map(font => (
                                        <div
                                            key={font}
                                            onClick={() => {
                                                handleUpdateElement({ defaultValue: font });
                                                setIsFontDropdownOpen(false);
                                            }}
                                            className={`se-font-option${(editingElement.element.defaultValue || 'Inter') === font ? ' active' : ''}`}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="se-field-label-row">
                                <span className="se-field-label">Placeholder</span>
                            </div>
                            <s-text-field
                                value={editingElement.element.placeholder || ""}
                                onInput={(e: any) => handleUpdateElement({ placeholder: e.target.value })}
                            ></s-text-field>
                        </>
                    )}
                </div>
                {!isHeading && (
                    <div>
                        <div className="se-field-label-row">
                            <span className="se-field-label">Help text</span>
                        </div>
                        <s-text-field
                            value={editingElement.element.helpText || ""}
                            onInput={(e: any) => handleUpdateElement({ helpText: e.target.value })}
                        ></s-text-field>
                    </div>
                )}
            </s-grid>}

            <div className="se-section-divider">
                {children}
            </div>
        </s-stack>
    );
};
