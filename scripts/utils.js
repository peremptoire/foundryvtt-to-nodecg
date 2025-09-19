// =============================
// Shared Utility Functions
// =============================

/**
 * Convert a DOM element to a minimal JSON representation.
 * @param {Element} node
 * @returns {object|string|null}
 */
export function domElementToJson(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        return text || null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const obj = {};
        if (node.classList.length) obj.classes = Array.from(node.classList);

        const attributes = Array.from(node.attributes);
        if (attributes.length) {
            obj.attributes = attributes.map(attr => ({
                name: attr.name,
                value: attr.value
            }));
        }

        const children = [];
        for (let child of node.childNodes) {
            const childJson = domElementToJson(child);
            if (childJson !== null) children.push(childJson);
        }
        if (children.length) obj.children = children;

        if (!obj.classes && !obj.children) return null;
        return obj;
    }

    return null;
}

/**
 * Parse raw HTML string into minimal JSON tree.
 * @param {string} htmlString
 * @returns {object|null}
 */
export function parseRawContentToGenericJson(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return null;
    return domElementToJson(root);
}

/**
 * Detect if message content has dice roll HTML patterns.
 */
export function containsDiceRollHTML(content) {
    return content.includes('dice-roll') ||
        content.includes('data-roll-total') ||
        content.includes('dice-formula') ||
        content.includes('roll-total');
}

/**
 * Determine the roll’s origin.
 */
export function determineRollSource(msg) {
    if (msg.flags?.core?.initiativeRoll) return "initiative";
    if (msg.content?.includes('chat-card')) return "character_sheet";
    if (msg.speaker?.alias) return "macro";
    return "manual_chat";
}
