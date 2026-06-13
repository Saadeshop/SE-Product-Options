function startInitialization() {
  if (window.__seProductOptionsStarted) return;

  if (!document.body) {
    setTimeout(startInitialization, 100);
    return;
  }

  if (!window.seProductOptions || !window.seProductOptions.product) {
    setTimeout(startInitialization, 500);
    return;
  }

  window.__seProductOptionsStarted = true;
  console.log("%c SE Product Options Initializing.. ", "background: linear-gradient(135deg, #1ea7ff 0%, #2f6dff 25%, #7a3cff 50%, #ff3ea5 75%, #ffb300 100%); color: #fff; font-weight: bold; padding: 8px 20px; font-size: 16px; font-family: sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.2); margin: 10px 0;");
  initProductOptions();
}

async function initProductOptions() {
  const findAndInject = () => {
    if (document.querySelector('.se-option-set')) {
      console.log("[SE] Widget already rendered.");
      return true;
    }

    let root = document.querySelector('.se-product-options-container .se-options-content') ||
      document.querySelector('.se-product-options-container') ||
      document.getElementById('se-product-options-root');

    const atcSelectors = ['button[name="add"]', 'button.product-form__submit', '.product-form__buttons', '.add-to-cart', '#AddToCart', '[data-add-to-cart]', '.btn--add-to-cart'];
    let atcButton = null;
    for (const selector of atcSelectors) {
      atcButton = document.querySelector(selector);
      if (atcButton && atcButton.offsetWidth > 0) {
        console.log("[SE] Found ATC Button:", selector);
        break;
      }
    }

    if (!atcButton) {
      const form = document.querySelector('form[action^="/cart/add"]');
      if (form) {
        atcButton = form;
        console.log("[SE] Found Product Form as fallback.");
      }
    }

    if (!root && atcButton) {
      root = document.createElement('div');
      root.id = 'se-product-options-root';
      atcButton.parentNode.insertBefore(root, atcButton);
      console.log("[SE] Created and injected root above button/form.");
    }

    if (root) {
      // Listen for variant changes from the theme
      const variantIdInput = document.querySelector('form[action^="/cart/add"] input[name="id"]');
      if (variantIdInput) {
        variantIdInput.addEventListener('change', () => applyConditionalLogic(root));
        // Some themes don't trigger change on programmatic updates, so we observe attributes
        const observer = new MutationObserver(() => applyConditionalLogic(root));
        observer.observe(variantIdInput, { attributes: true, attributeFilter: ['value'] });
      }

      fetchOptions(root);
      return true;
    }
    return false;
  };

  if (!findAndInject()) {
    console.log("[SE] Button not found yet, starting watcher...");
    const observer = new MutationObserver((mutations, obs) => {
      if (findAndInject()) {
        console.log("[SE] Watcher found button!");
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!document.querySelector('.se-option-set')) {
        console.log("[SE] Final fallback triggered.");
        const form = document.querySelector('form[action^="/cart/add"]');
        if (form) {
          const root = document.createElement('div');
          root.id = 'se-product-options-root';
          form.prepend(root);
          fetchOptions(root);
        }
      }
      observer.disconnect();
    }, 5000);
  }
}

async function fetchOptions(root) {
  if (root.dataset.loading === "true") return;
  root.dataset.loading = "true";
  try {
    const apiUrl = `/apps/se-product-options/api/options`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop: window.seProductOptions.shop,
        product: window.seProductOptions.product,
        collections: window.seProductOptions.collections || []
      })
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[SE] API Error (HTML returned):", text.substring(0, 200));
      return;
    }

    const data = await response.json();
    if (data.optionSets && data.optionSets.length > 0) {
      renderOptionSets(root, data.optionSets);
    } else {
      console.log("[SE] No option sets found for this product.");
    }
  } catch (error) {
    console.error("[SE] Fetch Error:", error);
  } finally {
    delete root.dataset.loading;
  }
}

function applyConditionalLogic(container) {
  if (!container) return;
  const allElements = container.querySelectorAll('.se-option-element');
  if (allElements.length === 0) return;
  const currentValues = {};

  const getVariantId = () => {
    return new URLSearchParams(window.location.search).get('variant') ||
      document.querySelector('form[action^="/cart/add"] input[name="id"]')?.value;
  };

  const variantId = getVariantId();

  // 1. Gather all current values
  allElements.forEach(elWrapper => {
    const config = elWrapper.__seConfig;
    if (!config) return;

    const inputs = Array.from(elWrapper.querySelectorAll('input, select, textarea'));
    let val = undefined;
    if (config.type === 'checkbox' || config.type === 'checkbox-group') {
      val = inputs.filter(i => i.checked).map(i => i.value);
    } else if (config.type === 'radio' || config.type === 'color-swatch' || config.type === 'image-swatch') {
      const checked = inputs.find(i => i.checked);
      val = checked ? checked.value : "";
    } else if (config.type === 'button') {
      const activeBtn = elWrapper.querySelector('.se-btn-option--active');
      val = activeBtn ? activeBtn.dataset.value : "";
    } else if (inputs.length > 0) {
      val = inputs[0].value;
    }

    if (val !== undefined) {
      currentValues[config.id.toString()] = val;
    }
  });

  // 2. Evaluate and toggle
  allElements.forEach(elWrapper => {
    const el = elWrapper.__seConfig;

    // If logic is disabled or no conditions exist, ensure it's visible and skip
    if (!el || !el.logicEnabled || !el.conditions) {
      return;
    }

    const validConditions = el.conditions.filter(cond => cond.field && cond.field.trim() !== "");
    if (validConditions.length === 0) {
      elWrapper.style.display = "";
      return;
    }

    const logicType = el.logicType || "Show";
    const logicOperator = el.logicOperator || "All";

    const results = validConditions.map(cond => {
      const fieldKey = cond.field.toString();
      let currentVal = fieldKey === 'shopify_variant' ? variantId : currentValues[fieldKey];

      if (currentVal === undefined || currentVal === null) currentVal = "";

      const target = String(cond.value || "").toLowerCase();
      const op = cond.operator;
      const isArray = Array.isArray(currentVal);
      const valStr = isArray ? currentVal.map(v => String(v).toLowerCase()) : String(currentVal).toLowerCase();

      switch (op) {
        case 'EQUALS':
          return isArray ? valStr.includes(target) : valStr == target;
        case 'NOT_EQUALS':
          return isArray ? !valStr.includes(target) : valStr != target;
        case 'GREATER_THAN':
          return Number(currentVal) > Number(target);
        case 'LESS_THAN':
          return Number(currentVal) < Number(target);
        case 'STARTS_WITH':
          return !isArray && valStr.startsWith(target);
        case 'ENDS_WITH':
          return !isArray && valStr.endsWith(target);
        case 'CONTAINS':
          return isArray ? valStr.includes(target) : valStr.includes(target);
        case 'NOT_CONTAINS':
          return isArray ? !valStr.includes(target) : !valStr.includes(target);
        default: return false;
      }
    });

    let isMet = logicOperator === 'All' ? results.every(r => r) : results.some(r => r);
    let shouldShow = logicType === 'Show' ? isMet : !isMet;

    elWrapper.style.display = shouldShow ? "" : "none";
  });
}

function renderOptionSets(container, optionSets) {
  container.innerHTML = '';
  const addonVariants = [];
  optionSets.forEach(set => {
    try {
      const setElement = document.createElement('div');
      setElement.className = 'se-option-set';
      const groups = typeof set.groups === 'string' ? JSON.parse(set.groups || '[]') : (set.groups || []);
      groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'se-option-group';
        group.elements.forEach(el => {
          try {
            const elContainer = document.createElement('div');
            const colWidth = el.columnWidth || '100%';
            const colClass = `se-col-${colWidth.replace('%', '')}`;
            elContainer.className = `se-option-element ${el.htmlClass || ''} ${colClass}`;
            elContainer.__seConfig = el; // Store config for logic evaluation
            const elId = `se-opt-${el.id}`;
            if (el.addonProduct && el.addonProduct.id) {
              const numericId = el.addonProduct.id.toString().split('/').pop();
              const gid = el.addonProduct.id.toString().includes('gid://') ? el.addonProduct.id : `gid://shopify/ProductVariant/${numericId}`;
              const price = el.addonProduct.price || 0;
              addonVariants.push({ id: numericId, gid: gid, price: price, quantity: 1, label: el.label || 'Add-on', elementId: el.id });
            }
            let tooltipHtml = '';
            if (el.helpText && el.helpTextPosition === 'tooltip') {
              tooltipHtml = `<span class="se-tooltip-container"><i class="se-tooltip-icon">i</i><span class="se-tooltip-text">${el.helpText}</span></span>`;
            }
            const labelHtml = (el.type === 'heading' || el.type === 'divider' || el.type === 'spacing' || el.type === 'paragraph' || el.type === 'html') ? '' : `<label for="${elId}">${el.label}${el.price > 0 ? ` (+ $${parseFloat(el.price).toFixed(2)})` : ''}${el.required ? ' <span class="se-required">*</span>' : ''}${tooltipHtml}</label>`;
            const helpTextHtml = el.helpText ? `<div class="se-help-text">${el.helpText}</div>` : '';
            const charCounterHtml = (el.showCharacterCounter && el.maxCharacter) ? `<div id="${elId}-counter" class="se-char-counter">0 / ${el.maxCharacter}</div>` : '';
            let html = el.helpTextPosition === 'above' ? helpTextHtml : '';
            html += labelHtml;
            const textTransformClass = el.textTransform ? `se-text-${el.textTransform}` : '';
            const propertyName = el.name || el.label;

            if (el.type === 'date') {
              const iconClass = el.dateFormat === 'time' ? 'clock' : 'calendar';

              html += `<div class="se-datetime-container">`;
              if (el.dateMode === 'range') {
                html += `
                  <div class="se-datetime-range">
                    <div class="se-datetime-input-wrapper">
                      <input id="${elId}-start" class="se-input se-datetime-input" type="text" name="properties[${propertyName} (Start)]" placeholder="Start" ${el.required ? 'required' : ''} readonly>
                      <span class="se-datetime-icon ${iconClass}"></span>
                    </div>
                    <span class="se-range-separator">to</span>
                    <div class="se-datetime-input-wrapper">
                      <input id="${elId}-end" class="se-input se-datetime-input" type="text" name="properties[${propertyName} (End)]" placeholder="End" ${el.required ? 'required' : ''} readonly>
                      <span class="se-datetime-icon ${iconClass}"></span>
                    </div>
                  </div>
                `;
              } else {
                html += `
                  <div class="se-datetime-input-wrapper">
                    <input id="${elId}" class="se-input se-datetime-input" type="text" name="properties[${propertyName}]" value="${el.defaultValue || ''}" placeholder="${el.placeholder || ''}" ${el.required ? 'required' : ''} readonly>
                    <span class="se-datetime-icon ${iconClass}"></span>
                  </div>
                `;
              }
              html += `</div>`;
            } else if (['text', 'phone', 'email', 'number', 'textarea'].includes(el.type)) {
              if (el.type === 'textarea') {
                html += `<textarea id="${elId}" class="se-input ${textTransformClass}" name="properties[${propertyName}]" rows="4" placeholder="${el.placeholder || ''}" ${el.required ? 'required' : ''} ${el.maxCharacter ? `maxlength="${el.maxCharacter}"` : ''}>${el.defaultValue || ''}</textarea>`;
              } else {
                html += `<input id="${elId}" class="se-input ${textTransformClass}" type="${el.type === 'phone' ? 'tel' : el.type}" name="properties[${propertyName}]" value="${el.defaultValue || ''}" placeholder="${el.placeholder || ''}" ${el.required ? 'required' : ''} ${el.maxCharacter ? `maxlength="${el.maxCharacter}"` : ''}>`;
              }
              const showBottomHelp = !el.helpTextPosition || el.helpTextPosition === 'below';
              if (showBottomHelp || charCounterHtml) {
                html += `<div class="se-bottom-row">${showBottomHelp ? helpTextHtml || '<div></div>' : '<div></div>'}${charCounterHtml}</div>`;
              }
            } else if (el.type === 'select') {
              html += `<select id="${elId}" class="se-input ${textTransformClass}" name="properties[${propertyName}]" ${el.required ? 'required' : ''}>`;
              (el.optionValues || []).forEach(opt => {
                html += `<option value="${opt.value}" ${opt.isDefault ? 'selected' : ''}>${opt.value}${opt.price > 0 ? ` (+ $${parseFloat(opt.price).toFixed(2)})` : ''}</option>`;
              });
              html += `</select>`;
              if (el.helpTextPosition === 'below' || !el.helpTextPosition) html += helpTextHtml;
            } else if (el.type === 'heading') {
              const tag = (el.headingStyle || 'H2').toLowerCase();
              const color = el.headingColor || '#1a1a1a';
              const content = el.content || el.label || 'Heading';
              html = `<${tag} class="se-heading se-heading-${tag}" style="--se-heading-color: ${color};">${content}</${tag}>`;
            } else if (el.type === 'divider') {
              const thickness = el.dividerThickness || 1;
              const style = el.dividerStyle || 'solid';
              const color = el.dividerColor || '#e1e3e5';
              html = `<div class="se-divider" style="--se-divider-style: ${style}; --se-divider-thickness: ${thickness}px; --se-divider-color: ${color};"></div>`;
            } else if (el.type === 'spacing') {
              const height = el.spacingHeight || 20;
              html = `<div class="se-spacing" style="height: ${height}px;"></div>`;
            } else if (el.type === 'paragraph') {
              const content = el.content || '';
              html = `<div class="se-paragraph">${content}</div>`;
            } else if (el.type === 'html') {
              const content = el.htmlContent || '';
              html = `<div class="se-html">${content}</div>`;
            }
            elContainer.innerHTML = html;
            groupElement.appendChild(elContainer);
          } catch (e) {
            console.error('[SE] Error rendering element:', e);
          }
        });
        setElement.appendChild(groupElement);
      });
      container.appendChild(setElement);

      // ATTACH EVENTS AFTER DOM RENDER
      groups.forEach(group => {
        group.elements.forEach(el => {
          if (['text', 'phone', 'email', 'number', 'date', 'textarea', 'select'].includes(el.type)) {
            const elId = `se-opt-${el.id}`;
            const input = document.getElementById(elId);

            if (!input) return;

            const restriction = String(el.allowedValue || '').trim().toLowerCase();
            const transform = String(el.textTransform || '').trim().toLowerCase();

            const applyRestriction = function () {
              let value = this.value;

              // Letters only
              if (
                restriction === 'letters' ||
                restriction === 'letter'
              ) {
                value = value.replace(/[^a-zA-Z ]/g, '');
              }

              // Numbers only
              else if (
                restriction === 'numbers' ||
                restriction === 'number' ||
                restriction === 'numeric'
              ) {
                value = value.replace(/[^0-9]/g, '');
              }

              // Alphanumeric only
              else if (
                restriction === 'alphanumeric' ||
                restriction === 'alpha-numeric'
              ) {
                value = value.replace(/[^a-zA-Z0-9 ]/g, '');
              }

              if (this.value !== value) {
                this.value = value;
                this.dispatchEvent(new Event('input', { bubbles: true }));
              }
            };

            input.removeEventListener('input', applyRestriction);
            input.addEventListener('input', applyRestriction);

            applyRestriction.call(input);

            // Text Transform
            if (transform) {
              const applyTransform = function () {
                let value = this.value;
                if (transform === 'uppercase') {
                  value = value.toUpperCase();
                } else if (transform === 'lowercase') {
                  value = value.toLowerCase();
                } else if (transform === 'capitalize') {
                  value = value.replace(/\b\w/g, c => c.toUpperCase());
                }
                if (this.value !== value) {
                  this.value = value;
                  this.dispatchEvent(new Event('input', { bubbles: true }));
                }
              };
              input.addEventListener('input', applyTransform);
              input.addEventListener('keyup', applyTransform);
              input.addEventListener('change', applyTransform);
              applyTransform.call(input);
            }
          }
        });
      });
    } catch (e) { }
  });

  // Attach global logic listener
  container.addEventListener('input', () => applyConditionalLogic(container));
  container.addEventListener('change', () => applyConditionalLogic(container));
  // Initial run
  applyConditionalLogic(container);

  if (addonVariants.length > 0) interceptAddToCart(addonVariants);
  initFlatpickr();
}

function interceptAddToCart(addonVariants) {
  if (window.__seAddonPatched) return;
  window.__seAddonPatched = true;
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    if (url.includes('/cart/add') && (options.method || 'POST').toUpperCase() === 'POST' && options.body) {
      try {
        // 1. Gather all properties from the options widget
        const root = document.querySelector('.se-product-options-container') || document.getElementById('se-product-options-root');
        const widgetProps = {};
        if (root) {
          const propertyInputs = root.querySelectorAll('[name^="properties["]');
          propertyInputs.forEach(input => {
            const parent = input.closest('.se-option-element');
            if (parent && parent.style.display === 'none') return; // Skip logic-hidden fields

            if ((input.type === 'radio' || input.type === 'checkbox') && !input.checked) return;

            // Skip empty text/textarea/number values
            if (!['radio', 'checkbox'].includes(input.type) && (!input.value || input.value.trim() === '')) return;

            const key = input.name.match(/properties\[(.*?)\]/)?.[1];
            if (key) widgetProps[key] = input.value;
          });
        }

        // 2. Filter addons: only include if the source element has a value
        const activeAddons = addonVariants.filter(v => {
          const input = document.getElementById(`se-opt-${v.elementId}`);
          if (!input) return true; // Fallback for complex elements
          if (input.type === 'checkbox' || input.type === 'radio') return input.checked;
          console.log(`[SE Debug] Filtering addon for elementId: ${v.elementId}, type: ${input.type}, value: '${input.value}'`);
          return input.value && input.value.trim() !== '';
        });

        const addonData = activeAddons.map(v => ({ gid: v.gid, price: v.price }));
        const addonJson = JSON.stringify(addonData);

        if (options.body instanceof FormData) {
          const formData = options.body;
          formData.append('properties[_addons]', addonJson);
          if (formData.has('items[0][id]')) formData.append('items[0][properties][_addons]', addonJson);

          // Inject widget properties if they aren't already present (fixes fields outside form)
          for (const [key, val] of Object.entries(widgetProps)) {
            if (!formData.has(`properties[${key}]`)) {
              formData.append(`properties[${key}]`, val);
            }
          }
        } else if (typeof options.body === 'string') {
          const bodyJson = JSON.parse(options.body);
          const processItem = (item) => {
            item.properties = { ...(item.properties || {}), _addons: addonJson, ...widgetProps };
          };

          if (bodyJson.id) {
            processItem(bodyJson);
          } else if (bodyJson.items && bodyJson.items.length > 0) {
            bodyJson.items.forEach(processItem);
          }
          options.body = JSON.stringify(bodyJson);
        }
      } catch (e) { }
    }
    return originalFetch.apply(this, args);
  };
}
startInitialization();

function initFlatpickr() {
  console.log("[SE] Initializing Flatpickr...");
  const inputs = document.querySelectorAll('.se-datetime-input');
  if (inputs.length === 0) return;

  if (!window.flatpickr) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
    script.onload = () => {
      document.querySelectorAll('.se-datetime-input').forEach(input => setupFlatpickrInstance(input));
    };
    document.head.appendChild(script);
  } else {
    inputs.forEach(input => setupFlatpickrInstance(input));
  }
}

function setupFlatpickrInstance(input) {
  if (input._flatpickr) return;

  // Find the element config to get format and mode
  const elId = input.id.replace('-start', '').replace('-end', '');
  const idParts = elId.split('-');
  const elementId = idParts[idParts.length - 1];

  // Try to find el in window.seProductOptions data
  let elConfig = null;
  if (window.seProductOptions && window.seProductOptions.optionSets) {
    window.seProductOptions.optionSets.forEach(set => {
      const groups = typeof set.groups === 'string' ? JSON.parse(set.groups) : set.groups;
      groups.forEach(group => {
        group.elements.forEach(el => {
          if (el.id.toString() === elementId) elConfig = el;
        });
      });
    });
  }

  if (!elConfig) return;

  const isTime = elConfig.dateFormat === 'time';
  const isDateTime = elConfig.dateFormat === 'date_time';
  const displayFormat = elConfig.dateDisplayFormat || 'Y-m-d';

  // Map display format to flatpickr format
  let flatpickrFormat = displayFormat;
  if (isTime) {
    flatpickrFormat = 'H:i';
  } else if (isDateTime) {
    // If it's date_time, we combine date display format with time
    flatpickrFormat = displayFormat + ' H:i';
  }

  flatpickr(input, {
    enableTime: isTime || isDateTime,
    noCalendar: isTime,
    dateFormat: flatpickrFormat,
    allowInput: true,
    static: true, // This helps with positioning in some themes
    onReady: (selectedDates, dateStr, instance) => {
      // Adjust input type to text so flatpickr works well
      input.type = 'text';
    }
  });
}
