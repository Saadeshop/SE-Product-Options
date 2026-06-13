import React, { useState, useEffect, useMemo } from 'react';
import './LivePreview.css';
import '../../styles/product-options.css';
import { useSettings, buildGlobalCss } from '../../context/SettingsContext';

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

const PLACEHOLDER_IMAGE = "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

// Self-contained selection group (radio/checkbox) that uses React state so custom styles work in the admin preview
const PreviewSelectionGroup: React.FC<{ el: any; elId: string }> = ({ el, elId }) => {
    const isButton = el.type === 'button';
    const isMultiple = el.type === 'checkbox-group' || el.type === 'checkbox';
    const isSquare = el.type === 'checkbox' || el.type === 'checkbox-group';

    const getDefaultIds = () => {
        if (isMultiple) {
            return (el.optionValues || []).filter((o: any) => o.isDefault).map((o: any) => o.id);
        }
        return [(el.optionValues || []).find((o: any) => o.isDefault)?.id || null].filter(Boolean);
    };

    const [selectedIds, setSelectedIds] = useState<string[]>(getDefaultIds());

    // Sync when the default value is changed in the editor settings panel
    React.useEffect(() => {
        setSelectedIds(getDefaultIds());
    }, [JSON.stringify((el.optionValues || []).map((o: any) => ({ id: o.id, isDefault: o.isDefault })))]);

    const handleToggle = (id: string) => {
        if (isMultiple) {
            setSelectedIds(prev => {
                if (prev.includes(id)) return prev.filter(i => i !== id);
                if (el.maxSelections && prev.length >= el.maxSelections) return prev;
                return [...prev, id];
            });
        } else {
            const isSwatchType = el.type === 'color-swatch' || el.type === 'image-swatch';
            if (selectedIds.includes(id)) {
                // Enforce notAllowDeselect for button and swatch types
                if (el.notAllowDeselect && (el.type === 'button' || isSwatchType)) {
                    return; // Stay selected
                }
                // button or swatch without notAllowDeselect: allow deselect
                if (el.type === 'button' || isSwatchType) {
                    setSelectedIds([]);
                    return;
                }
            }
            setSelectedIds([id]);
        }
    };

    let constraintNote = '';
    if (isMultiple) {
        if (el.minSelections && el.maxSelections) {
            constraintNote = `Choose ${el.minSelections} - ${el.maxSelections} options`;
        } else if (el.minSelections) {
            constraintNote = `Choose minimum ${el.minSelections} option${el.minSelections > 1 ? 's' : ''}`;
        } else if (el.maxSelections) {
            constraintNote = `Choose maximum ${el.maxSelections} option${el.maxSelections > 1 ? 's' : ''}`;
        }
    }

    // Button-style rendering
    if (isButton) {
        const hasSwatchTooltip = el.swatchStyle === 'color' || el.swatchStyle === 'image';
        const isVertical = el.direction === 'vertical';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                    className={`se-btn-group${isVertical ? ' se-btn-group--vertical' : ''}`}
                    style={{
                        display: 'flex',
                        flexDirection: isVertical ? 'column' : 'row',
                        alignItems: isVertical ? 'stretch' : 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '4px'
                    }}
                >
                    {(el.optionValues || []).map((opt: any, idx: number) => {
                        const isChecked = selectedIds.includes(opt.id);
                        const priceSuffix = opt.price > 0 ? ` (+ $${parseFloat(opt.price).toFixed(2)})` : '';

                        // Build tooltip preview content
                        let tooltipPreviewStyle: React.CSSProperties = {};
                        if (el.swatchStyle === 'color') {
                            if (opt.swatchMode === 'two') {
                                tooltipPreviewStyle = {
                                    background: `linear-gradient(135deg, ${opt.swatchValue || '#000000'} 50%, ${opt.swatchValue2 || '#ffffff'} 50%)`,
                                };
                            } else {
                                tooltipPreviewStyle = { background: opt.swatchValue || '#000000' };
                            }
                        } else if (el.swatchStyle === 'image' && opt.swatchImage) {
                            tooltipPreviewStyle = {
                                backgroundImage: `url(${opt.swatchImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            };
                        }

                        return (
                            <div key={opt.id || idx} className="se-btn-tooltip-wrapper">
                                {hasSwatchTooltip && (
                                    <div className="se-btn-swatch-tooltip">
                                        <div className="se-btn-swatch-tooltip-title">{opt.value}{priceSuffix}</div>
                                        <div className="se-btn-swatch-tooltip-preview" style={tooltipPreviewStyle} />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleToggle(opt.id)}
                                    className={`se-btn-option${isChecked ? ' se-btn-option--active' : ''}`}
                                >
                                    <span>{opt.value}{priceSuffix}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const isSwatchMode = el.swatchStyle === 'color' || el.swatchStyle === 'image' || el.type === 'color-swatch' || el.type === 'image-swatch';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className={`se-radio-group se-radio-${el.direction || 'vertical'}${['color', 'image'].includes(el.swatchStyle) || ['color-swatch', 'image-swatch'].includes(el.type) ? ' se-radio-group--swatch' : ''}`}>
                {(el.optionValues || []).map((opt: any, idx: number) => {
                    const optId = `${elId}-${idx}`;
                    const isChecked = selectedIds.includes(opt.id);
                    const priceSuffix = opt.price > 0 ? ` (+ $${parseFloat(opt.price).toFixed(2)})` : '';
                    return (
                        <label
                            key={opt.id || idx}
                            className={`se-radio-item${isSwatchMode ? ' se-radio-item--swatch' : ''}`}
                            htmlFor={optId}
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggle(opt.id);
                            }}
                        >
                            <input
                                type={isMultiple ? 'checkbox' : 'radio'}
                                id={optId}
                                name={`preview-selection-${elId}`}
                                value={opt.value}
                                checked={isChecked}
                                onChange={() => handleToggle(opt.id)}
                                className="se-radio-input"
                            />
                            {!isSwatchMode && <span className={`se-radio-custom se-radio-custom-${isSquare ? 'checkbox' : 'radio'}`}></span>}
                            <span className="se-radio-label">
                                {opt.helpText && el.helpTextPosition === 'above' && (
                                    <span className="se-radio-option-help" style={{ marginBottom: '2px' }}>
                                        {opt.helpText}
                                    </span>
                                )}
                                <span className="se-radio-option-row">
                                    {el.swatchStyle === 'color' && opt.swatchMode === 'two' && (
                                        <span
                                            className="se-swatch se-swatch-two"
                                            style={{
                                                '--se-swatch-c1': opt.swatchValue || '#000000',
                                                '--se-swatch-c2': opt.swatchValue2 || '#ffffff',
                                            } as React.CSSProperties}
                                        />
                                    )}
                                    {el.swatchStyle === 'color' && opt.swatchMode !== 'two' && (
                                        <span
                                            className="se-swatch se-swatch-one"
                                            style={{ '--se-swatch-c1': opt.swatchValue || '#000000' } as React.CSSProperties}
                                        />
                                    )}
                                    {el.swatchStyle === 'image' && (
                                        <span
                                            className="se-swatch se-swatch-image"
                                            style={{ '--se-swatch-img': `url(${opt.swatchImage || PLACEHOLDER_IMAGE})` } as React.CSSProperties}
                                        />
                                    )}
                                    <span>{opt.value}{priceSuffix}</span>
                                    {opt.helpText && el.helpTextPosition === 'tooltip' && (
                                        <span className="se-tooltip-container">
                                            <i className="se-tooltip-icon">i</i>
                                            <span className="se-tooltip-text">{opt.helpText}</span>
                                        </span>
                                    )}
                                </span>
                                {opt.helpText && (!el.helpTextPosition || el.helpTextPosition === 'below') && (
                                    <span className="se-radio-option-help" style={{ marginTop: '2px' }}>
                                        {opt.helpText}
                                    </span>
                                )}
                            </span>
                        </label>
                    );
                })}
            </div>
            {constraintNote && <div className="se-constraint-note">{constraintNote}</div>}
        </div>
    );
};

interface LivePreviewProps {
    groups: any[];
    previewMode: 'desktop' | 'mobile';
}

export const LivePreview: React.FC<LivePreviewProps> = ({ groups, previewMode }) => {
    const [openFontPickerId, setOpenFontPickerId] = React.useState<string | null>(null);
    const [selectedFonts, setSelectedFonts] = React.useState<Record<string, string>>({});

    // Read global design settings from context so preview reflects saved settings
    const { settings } = useSettings();
    const globalCss = buildGlobalCss(settings);

    React.useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (!event.target.closest('.se-font-picker-dropdown-container')) {
                setOpenFontPickerId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const initFP = () => {
            const inputs = document.querySelectorAll('.se-datetime-input');
            if (inputs.length === 0) return;

            if (!(window as any).flatpickr) {
                if (!document.getElementById('fp-style')) {
                    const link = document.createElement('link');
                    link.id = 'fp-style';
                    link.rel = 'stylesheet';
                    link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
                    document.head.appendChild(link);
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
                script.onload = () => {
                    document.querySelectorAll('.se-datetime-input').forEach(input => setupFP(input));
                };
                document.head.appendChild(script);
            } else {
                inputs.forEach(input => setupFP(input));
            }
        };

        const setupFP = (input: any) => {
            if (input._flatpickr) {
                input._flatpickr.destroy();
            }

            const dateFormat = input.getAttribute('data-date-format');
            const dateMode = input.getAttribute('data-date-mode');
            const displayFormat = input.getAttribute('data-display-format') || 'Y-m-d';

            const isTime = dateFormat === 'time';
            const isDateTime = dateFormat === 'date_time';

            let flatpickrFormat = displayFormat;
            if (isTime) flatpickrFormat = 'h:i K';
            else if (isDateTime) flatpickrFormat = displayFormat + ' h:i K';

            (window as any).flatpickr(input, {
                enableTime: isTime || isDateTime,
                noCalendar: isTime,
                dateFormat: flatpickrFormat,
                time_24hr: false,
                allowInput: true,
                static: true,
                onReady: (selectedDates: any, dateStr: string, instance: any) => {
                    input.type = 'text';
                }
            });
        };

        // Universal Google Fonts Loader (Global Design + Builder Elements)
        const fontsToLoad = new Set<string>();

        groups.forEach(g => g.elements.forEach((el: any) => {
            if (el.type === 'font-picker' && el.defaultValue) fontsToLoad.add(el.defaultValue);
        }));

        if (fontsToLoad.size > 0) {
            const linkId = "se-universal-google-fonts";
            let link = document.getElementById(linkId) as HTMLLinkElement;
            if (!link) {
                link = document.createElement("link");
                link.id = linkId;
                link.rel = "stylesheet";
                document.head.appendChild(link);
            }
            link.href = `https://fonts.googleapis.com/css2?family=${Array.from(fontsToLoad).map(f => f.replace(/ /g, "+")).join("&family=")}&display=swap`;
        }

        // Load Quill CSS for Paragraph preview
        if (groups.some(g => g.elements.some((el: any) => el.type === 'paragraph')) && !document.getElementById('quill-css-preview')) {
            const link = document.createElement('link');
            link.id = 'quill-css-preview';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
            document.head.appendChild(link);
        }

        initFP();
    }, [groups]);

    return (
        <div className="se-preview-sticky-wrapper">
            <style>{`
                .se-paragraph .ql-editor { padding: 0; height: auto; min-height: unset; overflow: visible; }
                .se-paragraph .ql-container.ql-snow { border: none; font-family: inherit; font-size: inherit; }
            `}</style>
            {/* Inject global design settings CSS into the preview */}
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />
            <div className={`se-preview-card ${previewMode === 'mobile' ? 'se-mobile' : 'se-desktop'}`}>
                <s-grid gridTemplateColumns={previewMode === 'mobile' ? "1fr" : "1fr 1.2fr"} gap={previewMode === 'mobile' ? "medium" : "large"} alignItems="start" className="se-preview-grid">
                    {/* Left: Product Image Placeholder */}
                    <div className="se-preview-image-container">
                        <s-icon type="image" size="large" tone="subdued"></s-icon>
                    </div>

                    {/* Right: Product Info */}
                    <s-stack gap="base" className="se-preview-info-stack">
                        {/* Skeleton Title */}
                        <div className="se-skeleton-title" />

                        {/* Skeleton Price/Description lines */}
                        <s-stack gap="small-200">
                            <div className="se-skeleton-line" />
                            <div className="se-skeleton-line" />
                            <div className="se-skeleton-line" />
                            <div className="se-skeleton-line se-skeleton-line-short" />
                        </s-stack>

                        {/* Space for added options */}
                        <s-box paddingBlock="large">
                            <div className="se-preview-container">
                                {groups.filter(g => !g.hidden).map(group => (
                                    <div key={group.id} className="se-option-group-wrapper">
                                        <div className="se-option-group se-group-wrapper-inner">
                                            {group.elements.filter((el: any) => !el.hidden).map((el: any, idx: number) => {
                                                const colWidth = el.columnWidth || '100%';
                                                const colClass = 'se-col-' + colWidth.replace('%', '');
                                                const elId = 'preview-' + (el.id || idx);
                                                const textTransformClass = el.textTransform ? 'se-text-' + el.textTransform : '';

                                                const helpTextHtml = el.helpText ? <div className="se-help-text">{el.helpText}</div> : null;
                                                const tooltipHtml = el.helpText && el.helpTextPosition === 'tooltip' ? (
                                                    <span className="se-tooltip-container">
                                                        <i className="se-tooltip-icon">i</i>
                                                    </span>
                                                ) : null;

                                                // Dynamic Price for Select
                                                let dynamicPriceHtml = null;
                                                if (el.type === 'select' || el.type === 'radio') {
                                                    dynamicPriceHtml = <span id={`${elId}-price-label`} className="se-label-price"></span>;
                                                }

                                                const priceHtml = el.price > 0 ? <span className="se-label-price">(+ ${parseFloat(el.price).toFixed(2)})</span> : dynamicPriceHtml;
                                                const labelHtml = (el.hiddenLabel || el.type === 'heading' || el.type === 'divider' || el.type === 'spacing' || el.type === 'paragraph' || el.type === 'html') ? null : (
                                                    <label htmlFor={elId}>
                                                        {el.label} {priceHtml} {el.required && <span className="se-required">*</span>} {tooltipHtml}
                                                    </label>
                                                );
                                                const charCounterHtml = (el.showCharacterCounter && el.maxCharacter) ? (
                                                    <div className="se-char-counter"><span className="se-char-counter-value">0</span> / {el.maxCharacter}</div>
                                                ) : null;

                                                return (
                                                    <div
                                                        key={el.id || idx}
                                                        className={`se-option-element ${colClass} ${el.htmlClass || ""}`.trim()}
                                                    >
                                                        {el.helpTextPosition === 'above' && helpTextHtml}
                                                        {labelHtml}

                                                        {['text', 'phone', 'email', 'number', 'textarea'].includes(el.type) ? (
                                                            <>
                                                                {el.type === 'textarea' ? (
                                                                    <textarea id={elId} className={`se-input ${textTransformClass}`.trim()} rows={4} placeholder={el.placeholder || ""} defaultValue={el.defaultValue || ""} />
                                                                ) : (
                                                                    <input id={elId} className={`se-input ${textTransformClass}`.trim()} type={el.type === 'phone' ? 'tel' : el.type} placeholder={el.placeholder || ""} defaultValue={el.defaultValue || ""} />
                                                                )}
                                                                {((!el.helpTextPosition || el.helpTextPosition === 'below') && el.helpText || charCounterHtml) && (
                                                                    <div className="se-bottom-row">
                                                                        {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                                        {charCounterHtml}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : el.type === 'color-picker' ? (
                                                            <>
                                                                <div className="se-color-picker-container" id={`${elId}-container`}>
                                                                    <input type="hidden" id={elId} defaultValue={el.defaultValue || "#000000"} />
                                                                    <div
                                                                        className="se-color-picker-trigger"
                                                                        id={`${elId}-trigger`}
                                                                        onClick={() => {
                                                                            const dropdown = document.getElementById(`${elId}-dropdown`);
                                                                            const trigger = document.getElementById(`${elId}-trigger`);
                                                                            const overlay = document.getElementById(`${elId}-overlay`);
                                                                            if (dropdown && trigger && overlay) {
                                                                                const isOpen = dropdown.classList.contains('se-cp-visible');
                                                                                if (isOpen) {
                                                                                    dropdown.classList.remove('se-cp-visible');
                                                                                    trigger.classList.remove('se-cp-open');
                                                                                    overlay.style.display = 'none';
                                                                                } else {
                                                                                    dropdown.classList.add('se-cp-visible');
                                                                                    trigger.classList.add('se-cp-open');
                                                                                    overlay.style.display = 'block';
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="se-color-picker-swatch">
                                                                            <div className="se-color-picker-swatch-inner" id={`${elId}-swatch`} style={{ backgroundColor: el.defaultValue || '#000000' }}></div>
                                                                        </div>
                                                                        <span className="se-color-picker-hex-label" id={`${elId}-hex`}>{el.defaultValue || '#000000'}</span>
                                                                        <svg className="se-color-picker-chevron" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                                    </div>
                                                                    <div id={`${elId}-overlay`} className="se-cp-overlay" style={{ display: 'none' }} onClick={() => {
                                                                        const dropdown = document.getElementById(`${elId}-dropdown`);
                                                                        const trigger = document.getElementById(`${elId}-trigger`);
                                                                        const overlay = document.getElementById(`${elId}-overlay`);
                                                                        if (dropdown && trigger && overlay) {
                                                                            dropdown.classList.remove('se-cp-visible');
                                                                            trigger.classList.remove('se-cp-open');
                                                                            overlay.style.display = 'none';
                                                                        }
                                                                    }}></div>
                                                                    <div className="se-color-picker-dropdown" id={`${elId}-dropdown`}>
                                                                        <div className="se-cp-saturation" id={`${elId}-sat`} style={{ backgroundColor: `hsl(0, 100%, 50%)` }}
                                                                            ref={(satEl) => {
                                                                                if (!satEl || satEl.dataset.cpBound) return;
                                                                                satEl.dataset.cpBound = 'true';
                                                                                const PRESETS = ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'];
                                                                                let hue = 0, sat = 100, bri = 0;
                                                                                const hexVal = el.defaultValue || '#000000';
                                                                                // Parse initial hex to HSB
                                                                                const parseHex = (hex: string) => {
                                                                                    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
                                                                                    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
                                                                                    let h = 0;
                                                                                    if (d !== 0) { if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6; else if (max === g) h = ((b - r) / d + 2) / 6; else h = ((r - g) / d + 4) / 6; }
                                                                                    return { h: h * 360, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
                                                                                };
                                                                                const hsb = parseHex(hexVal);
                                                                                hue = hsb.h; sat = hsb.s; bri = hsb.v;

                                                                                const hsbToHex = (h: number, s: number, v: number) => {
                                                                                    s /= 100; v /= 100;
                                                                                    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
                                                                                    let r = 0, g = 0, b = 0;
                                                                                    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
                                                                                    return '#' + [r + m, g + m, b + m].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
                                                                                };

                                                                                const updateUI = () => {
                                                                                    const hex = hsbToHex(hue, sat, bri);
                                                                                    const hiddenInput = document.getElementById(elId) as HTMLInputElement;
                                                                                    const swatchEl = document.getElementById(`${elId}-swatch`);
                                                                                    const hexLabel = document.getElementById(`${elId}-hex`);
                                                                                    const hexInput = document.getElementById(`${elId}-hex-input`) as HTMLInputElement;
                                                                                    const satBox = document.getElementById(`${elId}-sat`);
                                                                                    const satPtr = document.getElementById(`${elId}-sat-ptr`);
                                                                                    const hueThumb = document.getElementById(`${elId}-hue-thumb`);
                                                                                    if (hiddenInput) hiddenInput.value = hex;
                                                                                    if (swatchEl) swatchEl.style.backgroundColor = hex;
                                                                                    if (hexLabel) hexLabel.textContent = hex;
                                                                                    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
                                                                                    if (satBox) satBox.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                                                                                    if (satPtr) { satPtr.style.left = sat + '%'; satPtr.style.top = (100 - bri) + '%'; }
                                                                                    if (hueThumb) hueThumb.style.left = (hue / 360 * 100) + '%';
                                                                                    // Update preset active states
                                                                                    const presets = satEl.parentElement?.querySelectorAll('.se-cp-preset');
                                                                                    presets?.forEach((p: any) => { p.classList.toggle('se-cp-active', p.dataset.color === hex); });
                                                                                };

                                                                                // Saturation drag
                                                                                const onSatMove = (e: MouseEvent) => {
                                                                                    const rect = satEl.getBoundingClientRect();
                                                                                    sat = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                                                                                    bri = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
                                                                                    updateUI();
                                                                                };
                                                                                satEl.addEventListener('mousedown', (e: MouseEvent) => {
                                                                                    onSatMove(e);
                                                                                    const onMove = (ev: MouseEvent) => onSatMove(ev);
                                                                                    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                                                                                    document.addEventListener('mousemove', onMove);
                                                                                    document.addEventListener('mouseup', onUp);
                                                                                });

                                                                                // Hue drag
                                                                                const hueBar = satEl.parentElement?.querySelector(`#${CSS.escape(elId)}-hue`) as HTMLElement;
                                                                                if (hueBar) {
                                                                                    const onHueMove = (e: MouseEvent) => {
                                                                                        const rect = hueBar.getBoundingClientRect();
                                                                                        hue = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
                                                                                        updateUI();
                                                                                    };
                                                                                    hueBar.addEventListener('mousedown', (e: MouseEvent) => {
                                                                                        onHueMove(e);
                                                                                        const onMove = (ev: MouseEvent) => onHueMove(ev);
                                                                                        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                                                                                        document.addEventListener('mousemove', onMove);
                                                                                        document.addEventListener('mouseup', onUp);
                                                                                    });
                                                                                }

                                                                                // Hex input
                                                                                const hexInput = satEl.parentElement?.querySelector(`#${CSS.escape(elId)}-hex-input`) as HTMLInputElement;
                                                                                if (hexInput) {
                                                                                    hexInput.addEventListener('input', () => {
                                                                                        let val = hexInput.value.trim();
                                                                                        if (!val.startsWith('#')) val = '#' + val;
                                                                                        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                                                                                            const parsed = parseHex(val);
                                                                                            hue = parsed.h; sat = parsed.s; bri = parsed.v;
                                                                                            updateUI();
                                                                                        }
                                                                                    });
                                                                                }

                                                                                // Preset clicks
                                                                                const presetEls = satEl.parentElement?.querySelectorAll('.se-cp-preset');
                                                                                presetEls?.forEach((p: any) => {
                                                                                    p.addEventListener('click', () => {
                                                                                        const parsed = parseHex(p.dataset.color);
                                                                                        hue = parsed.h; sat = parsed.s; bri = parsed.v;
                                                                                        updateUI();
                                                                                    });
                                                                                });

                                                                                // Initial render
                                                                                setTimeout(() => updateUI(), 0);
                                                                            }}
                                                                        >
                                                                            <div className="se-cp-saturation-white"></div>
                                                                            <div className="se-cp-saturation-black"></div>
                                                                            <div className="se-cp-saturation-pointer" id={`${elId}-sat-ptr`}></div>
                                                                        </div>
                                                                        <div className="se-cp-hue-wrap" id={`${elId}-hue`}>
                                                                            <div className="se-cp-hue-thumb" id={`${elId}-hue-thumb`}></div>
                                                                        </div>
                                                                        <div className="se-cp-presets">
                                                                            {['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'].map(c => (
                                                                                <div key={c} className="se-cp-preset" data-color={c} style={{ backgroundColor: c }}></div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="se-cp-hex-row">
                                                                            <span>Hex</span>
                                                                            <input type="text" className="se-cp-hex-input" id={`${elId}-hex-input`} defaultValue={el.defaultValue || '#000000'} maxLength={7} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml && (
                                                                    <div className="se-bottom-row">
                                                                        {helpTextHtml}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : el.type === 'date' ? (
                                                            <div className="se-datetime-container" key={`${el.id}-${el.dateFormat}-${el.dateMode}`}>
                                                                {el.dateMode === 'range' ? (
                                                                    <div className="se-datetime-range">
                                                                        <div className="se-datetime-input-wrapper">
                                                                            <input
                                                                                type="text"
                                                                                id={`preview-${el.id}-start`}
                                                                                className="se-input se-datetime-input"
                                                                                placeholder={el.placeholderStart || ""}
                                                                                readOnly
                                                                                data-date-format={el.dateFormat}
                                                                                data-date-mode={el.dateMode}
                                                                                data-display-format={el.dateDisplayFormat}
                                                                            />
                                                                            <span className={`se-datetime-icon ${el.dateFormat === 'time' ? 'clock' : 'calendar'}`}></span>
                                                                        </div>
                                                                        <span className="se-range-separator">to</span>
                                                                        <div className="se-datetime-input-wrapper">
                                                                            <input
                                                                                type="text"
                                                                                id={`preview-${el.id}-end`}
                                                                                className="se-input se-datetime-input"
                                                                                placeholder={el.placeholderEnd || ""}
                                                                                readOnly
                                                                                data-date-format={el.dateFormat}
                                                                                data-date-mode={el.dateMode}
                                                                                data-display-format={el.dateDisplayFormat}
                                                                            />
                                                                            <span className={`se-datetime-icon ${el.dateFormat === 'time' ? 'clock' : 'calendar'}`}></span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="se-datetime-input-wrapper">
                                                                        <input
                                                                            type="text"
                                                                            id={`preview-${el.id}`}
                                                                            className="se-input se-datetime-input"
                                                                            placeholder={el.placeholder || ""}
                                                                            readOnly
                                                                            data-date-format={el.dateFormat}
                                                                            data-date-mode={el.dateMode}
                                                                            data-display-format={el.dateDisplayFormat}
                                                                        />
                                                                        <span className={`se-datetime-icon ${el.dateFormat === 'time' ? 'clock' : 'calendar'}`}></span>
                                                                    </div>
                                                                )}
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                            </div>
                                                        ) : el.type === 'select' ? (
                                                            <>
                                                                <select
                                                                    key={`${elId}-${el.optionValues?.find((o: any) => o.isDefault)?.id || 'none'}-${el.placeholder || 'none'}-${el.allowMultiple}`}
                                                                    id={elId}
                                                                    className={`se-input ${textTransformClass}`.trim()}
                                                                    defaultValue={el.allowMultiple ? (el.optionValues?.filter((o: any) => o.isDefault).map((o: any) => o.value) || []) : (el.optionValues?.find((o: any) => o.isDefault)?.value || "")}
                                                                    multiple={el.allowMultiple}
                                                                    ref={(selectEl) => {
                                                                        if (!selectEl) return;
                                                                        const syncLabelPrice = () => {
                                                                            const priceLabel = document.getElementById(`${elId}-price-label`);
                                                                            if (!priceLabel) return;
                                                                            let total = 0;
                                                                            Array.from(selectEl.selectedOptions).forEach((opt: any) => {
                                                                                const optConfig = el.optionValues?.find((o: any) => o.value === opt.value);
                                                                                if (optConfig) total += parseFloat(optConfig.price) || 0;
                                                                            });
                                                                            if (total > 0) priceLabel.textContent = ` (+ $${total.toFixed(2)})`;
                                                                            else priceLabel.textContent = '';
                                                                        };

                                                                        if (!selectEl.dataset.priceBound) {
                                                                            selectEl.dataset.priceBound = 'true';
                                                                            selectEl.addEventListener('change', syncLabelPrice);
                                                                            setTimeout(syncLabelPrice, 0); // Initial sync
                                                                        }
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        if (el.allowMultiple) {
                                                                            e.preventDefault();
                                                                            const option = e.target as HTMLOptionElement;
                                                                            if (option.tagName === 'OPTION') {
                                                                                if (option.value === "" && option.disabled) return;
                                                                                option.selected = !option.selected;

                                                                                // Deselect placeholder
                                                                                const select = e.currentTarget as HTMLSelectElement;
                                                                                if (select.options[0] && select.options[0].value === "") {
                                                                                    select.options[0].selected = false;
                                                                                }

                                                                                const event = new Event('change', { bubbles: true });
                                                                                select.dispatchEvent(event);
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    {(el.placeholder || "-- Please select --") && (
                                                                        <option value="" disabled>{el.placeholder || "-- Please select --"}</option>
                                                                    )}
                                                                    {el.optionValues?.map((opt: any) => (
                                                                        <option key={opt.id} value={opt.value}>
                                                                            {opt.value} {opt.price > 0 ? ` (+ $${parseFloat(opt.price).toFixed(2)})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                            </>
                                                        ) : el.type === 'file' ? (
                                                            <div className="se-file-upload-container">
                                                                <div className="se-file-upload-box">
                                                                    <svg className="se-file-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                                    </svg>
                                                                    <div className="se-file-upload-info">Upload file</div>
                                                                    {el.allowedExtensions?.length > 0 && (
                                                                        <div className="se-file-upload-hint">
                                                                            Accepted: {el.allowedExtensions.join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                            </div>
                                                        ) : el.type === 'switch' ? (
                                                            <>
                                                                <div className="se-switch-container">
                                                                    <label className="se-switch">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={elId}
                                                                            defaultChecked={el.selectedByDefault || false}
                                                                        />
                                                                        <span className="se-slider"></span>
                                                                    </label>
                                                                    <label htmlFor={elId} className="se-switch-label-text">
                                                                        {el.placeholder || ""}
                                                                    </label>
                                                                </div>
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml && (
                                                                    <div className="se-bottom-row" style={{ marginTop: '4px' }}>
                                                                        {helpTextHtml}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : el.type === 'font-picker' ? (
                                                            <>
                                                                <div className="se-font-picker-dropdown-container" style={{ position: 'relative' }}>
                                                                    <div
                                                                        onClick={() => setOpenFontPickerId(openFontPickerId === el.id ? null : el.id)}
                                                                        className="se-input"
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            fontFamily: selectedFonts[el.id] || el.defaultValue || "Inter",
                                                                            cursor: 'pointer',
                                                                            userSelect: 'none',
                                                                            height: '36px',
                                                                            boxSizing: 'border-box'
                                                                        }}
                                                                    >
                                                                        <span>{selectedFonts[el.id] || el.defaultValue || "Inter"}</span>
                                                                        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                                    </div>

                                                                    {openFontPickerId === el.id && (
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: 'calc(100% + 4px)',
                                                                                left: 0,
                                                                                right: 0,
                                                                                zIndex: 1000,
                                                                                maxHeight: '220px',
                                                                                overflowY: 'auto',
                                                                                backgroundColor: 'white',
                                                                                border: '1px solid #e1e3e5',
                                                                                borderRadius: '8px',
                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                                                                                padding: '4px 0',
                                                                                boxSizing: 'border-box'
                                                                            }}
                                                                        >
                                                                            {FONT_OPTIONS.map(font => (
                                                                                <div
                                                                                    key={font}
                                                                                    onClick={() => {
                                                                                        setSelectedFonts(prev => ({ ...prev, [el.id]: font }));
                                                                                        setOpenFontPickerId(null);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '8px 12px',
                                                                                        fontFamily: font,
                                                                                        fontSize: '14px',
                                                                                        cursor: 'pointer',
                                                                                        backgroundColor: (selectedFonts[el.id] || el.defaultValue || "Inter") === font ? '#f1f2f4' : 'transparent',
                                                                                        color: '#1a1a1a',
                                                                                        transition: 'background 0.15s ease',
                                                                                        textAlign: 'left'
                                                                                    }}
                                                                                    onMouseEnter={(e: any) => e.target.style.backgroundColor = '#f6f6f7'}
                                                                                    onMouseLeave={(e: any) => e.target.style.backgroundColor = (selectedFonts[el.id] || el.defaultValue || "Inter") === font ? '#f1f2f4' : 'transparent'}
                                                                                >
                                                                                    {font}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                            </>
                                                        ) : el.type === 'heading' ? (
                                                            <div
                                                                className={`se-heading se-heading-${(el.headingStyle || 'H2').toLowerCase()}`}
                                                                style={{
                                                                    '--se-heading-color': el.headingColor || '#1a1a1a'
                                                                } as React.CSSProperties}
                                                            >
                                                                {el.content || el.label || 'Heading'}
                                                            </div>
                                                        ) : el.type === 'divider' ? (
                                                            <div
                                                                className="se-divider"
                                                                style={{
                                                                    display: 'block',
                                                                    width: '100%',
                                                                    borderTop: `${el.dividerThickness || 1}px ${el.dividerStyle || 'solid'} ${el.dividerColor || '#e1e3e5'}`,
                                                                    margin: '16px 0',
                                                                    '--se-divider-style': el.dividerStyle || 'solid',
                                                                    '--se-divider-thickness': `${el.dividerThickness || 1}px`,
                                                                    '--se-divider-color': el.dividerColor || '#000000ff'
                                                                } as React.CSSProperties}
                                                            />
                                                        ) : el.type === 'spacing' ? (
                                                            <div
                                                                className="se-spacing"
                                                                style={{ height: `${el.spacingHeight || 20}px` }}
                                                            />
                                                        ) : el.type === 'paragraph' ? (
                                                            <div className="se-paragraph ql-container ql-snow">
                                                                <div
                                                                    className="ql-editor"
                                                                    dangerouslySetInnerHTML={{ __html: (el.content && el.content !== '<p><br></p>' && el.content !== '<p></p>') ? el.content : 'Paragraph text' }}
                                                                />
                                                            </div>
                                                        ) : el.type === 'html' ? (
                                                            <div
                                                                className="se-html"
                                                                dangerouslySetInnerHTML={{ __html: el.htmlContent || '<!-- Custom HTML -->' }}
                                                            />
                                                        ) : ['radio', 'checkbox', 'checkbox-group', 'button', 'color-swatch', 'image-swatch'].includes(el.type) ? (
                                                            <>
                                                                <PreviewSelectionGroup el={el} elId={elId} />
                                                                {(!el.helpTextPosition || el.helpTextPosition === 'below') && helpTextHtml}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </s-box>

                        {/* Add to cart button */}
                        <button className="se-add-to-cart">
                            Add to cart
                        </button>
                    </s-stack>
                </s-grid>
            </div>
        </div>
    );
};
