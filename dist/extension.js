"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const RAINBOW_COLORS = [
    '#ff5555', // red
    '#ffae42', // orange
    '#f1fa8c', // yellow
    '#50fa7b', // green
    '#8be9fd', // blue (cyan-ish for contrast)
    '#bd93f9' // violet
];
let activeEditor;
let decorations = [];
let updateTimer;
function activate(context) {
    activeEditor = vscode.window.activeTextEditor;
    initDecorations();
    if (activeEditor && shouldProcessDoc(activeEditor.document)) {
        triggerUpdateDecorations();
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;
        if (activeEditor && shouldProcessDoc(activeEditor.document)) {
            triggerUpdateDecorations();
        }
        else {
            clearAllDecorations();
        }
    }), vscode.workspace.onDidChangeTextDocument((event) => {
        if (activeEditor && event.document === activeEditor.document && shouldProcessDoc(event.document)) {
            triggerUpdateDecorations();
        }
    }), vscode.workspace.onDidOpenTextDocument((doc) => {
        if (activeEditor && doc === activeEditor.document && shouldProcessDoc(doc)) {
            triggerUpdateDecorations();
        }
    }), vscode.workspace.onDidCloseTextDocument(() => {
        clearAllDecorations();
    }), vscode.commands.registerCommand('rainbow-html-tags.refresh', () => triggerUpdateDecorations()));
}
function deactivate() {
    clearAllDecorations();
}
function shouldProcessDoc(doc) {
    if (doc.languageId === 'html' || doc.fileName.endsWith('.html') || doc.fileName.endsWith('.htm'))
        return true;
    // Support JS/TS and React variants to handle html`...` tagged templates
    return (doc.languageId === 'javascript' ||
        doc.languageId === 'typescript' ||
        doc.languageId === 'javascriptreact' ||
        doc.languageId === 'typescriptreact');
}
function initDecorations() {
    disposeDecorations();
    decorations = RAINBOW_COLORS.map(color => ({
        decorationType: vscode.window.createTextEditorDecorationType({
            color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        }),
        ranges: []
    }));
}
function disposeDecorations() {
    for (const d of decorations) {
        d.decorationType.dispose();
    }
    decorations = [];
}
function clearAllDecorations() {
    if (!activeEditor)
        return;
    for (const d of decorations) {
        activeEditor.setDecorations(d.decorationType, []);
    }
}
function triggerUpdateDecorations() {
    if (updateTimer) {
        clearTimeout(updateTimer);
    }
    updateTimer = setTimeout(updateDecorations, 100);
}
function updateDecorations() {
    if (!activeEditor)
        return;
    const doc = activeEditor.document;
    if (!shouldProcessDoc(doc)) {
        clearAllDecorations();
        return;
    }
    // Reset ranges
    for (const d of decorations)
        d.ranges = [];
    const text = doc.getText();
    const segments = getProcessableSegments(doc, text);
    // Lightweight scanner that pairs tags so opening/closing share the same color
    const rawTextElements = new Set(['script', 'style']);
    let colorIndex = 0;
    const colorStack = [];
    for (const seg of segments) {
        let pos = seg.start;
        let inComment = false;
        let inDoctype = false;
        while (pos < seg.end) {
            if (!inComment && !inDoctype && text.startsWith('<!--', pos)) {
                inComment = true;
                pos += 4;
                continue;
            }
            if (inComment) {
                const end = text.indexOf('-->', pos);
                if (end === -1 || end + 3 > seg.end) {
                    pos = seg.end;
                    inComment = false;
                    continue;
                }
                pos = end + 3;
                inComment = false;
                continue;
            }
            if (!inDoctype && text.startsWith('<!DOCTYPE', pos)) {
                inDoctype = true;
                pos += 2; // advance minimally, next branch consumes till '>'
            }
            if (inDoctype) {
                const end = text.indexOf('>', pos);
                if (end === -1 || end + 1 > seg.end) {
                    pos = seg.end;
                    inDoctype = false;
                    continue;
                }
                pos = end + 1;
                inDoctype = false;
                continue;
            }
            if (text.charCodeAt(pos) === 60 /* '<' */) {
                // Try to parse a tag
                const gt = findTagEnd(text, pos + 1, seg.end);
                if (gt === -1 || gt >= seg.end) {
                    pos++;
                    continue;
                }
                const tagText = text.slice(pos, gt + 1);
                // Exclude comments and processing instructions (handled above) and <![CDATA[ ... ]]> (rare in HTML)
                if (tagText.startsWith('<?') || tagText.startsWith('<!') && !tagText.startsWith('<!DOCTYPE')) {
                    pos = gt + 1;
                    continue;
                }
                // Extract tag name
                const isClosing = tagText.startsWith('</');
                const nameMatch = tagText.match(/^<\/?\s*([A-Za-z][A-Za-z0-9:-]*)/);
                if (!nameMatch) {
                    pos = gt + 1;
                    continue;
                }
                const tagName = nameMatch[1].toLowerCase();
                const isSelfClosingSyntax = tagText.endsWith('/>');
                const isVoid = isVoidElement(tagName);
                const isSelfClosing = isSelfClosingSyntax || isVoid;
                if (isClosing) {
                    // Match closing with the nearest same-name opening to get its color
                    let matchedColor = colorIndex; // fallback
                    for (let i = colorStack.length - 1; i >= 0; i--) {
                        if (colorStack[i].name === tagName) {
                            matchedColor = colorStack[i].colorIndex;
                            colorStack.splice(i); // pop everything above including this
                            break;
                        }
                    }
                    addTagPieces(doc, pos, tagText, matchedColor);
                    pos = gt + 1;
                    continue;
                }
                else {
                    // Assign a color, ensuring it differs from the immediate parent's color
                    const parentColor = colorStack.length > 0 ? colorStack[colorStack.length - 1].colorIndex : null;
                    const assigned = nextDifferentColor(colorIndex, parentColor);
                    addTagPieces(doc, pos, tagText, assigned);
                    if (!isSelfClosing) {
                        colorStack.push({ name: tagName, colorIndex: assigned });
                        // If rawtext element, skip content until explicit closing and color that closing with same assigned color
                        if (rawTextElements.has(tagName)) {
                            const closeIdx = text.indexOf(`</${tagName}`, gt + 1);
                            if (closeIdx !== -1 && closeIdx < seg.end) {
                                const closeGt = text.indexOf('>', closeIdx + 2);
                                if (closeGt !== -1 && closeGt < seg.end) {
                                    const closeTagText = text.slice(closeIdx, closeGt + 1);
                                    addTagPieces(doc, closeIdx, closeTagText, assigned);
                                    // pop the rawtext element from stack if it's still on top
                                    for (let i = colorStack.length - 1; i >= 0; i--) {
                                        if (colorStack[i].name === tagName) {
                                            colorStack.splice(i);
                                            break;
                                        }
                                    }
                                    pos = closeGt + 1;
                                    colorIndex = (colorIndex + 1) % RAINBOW_COLORS.length;
                                    continue;
                                }
                            }
                        }
                    }
                    // Advance based on the assigned color to avoid duplicate colors when skipping parent color
                    colorIndex = (assigned + 1) % RAINBOW_COLORS.length;
                    pos = gt + 1;
                    continue;
                }
            }
            pos++;
        }
    }
    // Apply decorations
    if (!activeEditor)
        return;
    for (const d of decorations) {
        activeEditor.setDecorations(d.decorationType, d.ranges);
    }
}
function addTagPieces(doc, startOffset, tagText, colorIdx) {
    // Identify indices for '<', optional '/', tag name, optional '/', and '>'
    const pieces = [];
    if (tagText.length === 0)
        return;
    // '<'
    pieces.push([0, 1]);
    // optional '/'
    if (tagText.startsWith('</')) {
        pieces.push([1, 2]);
    }
    // tag name
    const nameMatch = tagText.match(/^<\/?\s*([A-Za-z][A-Za-z0-9:-]*)/);
    if (nameMatch && nameMatch.index !== undefined) {
        const nameStartInTag = nameMatch[0].indexOf(nameMatch[1]);
        const nameStart = nameStartInTag;
        const nameEnd = nameStartInTag + nameMatch[1].length;
        pieces.push([nameStart, nameEnd]);
    }
    // possible self-closing '/'
    if (tagText.endsWith('/>')) {
        pieces.push([tagText.length - 2, tagText.length - 1]);
    }
    // '>'
    pieces.push([tagText.length - 1, tagText.length]);
    for (const [s, e] of pieces) {
        const start = doc.positionAt(startOffset + s);
        const end = doc.positionAt(startOffset + e);
        decorations[colorIdx].ranges.push(new vscode.Range(start, end));
    }
}
function isVoidElement(name) {
    switch (name) {
        case 'area':
        case 'base':
        case 'br':
        case 'col':
        case 'embed':
        case 'hr':
        case 'img':
        case 'input':
        case 'link':
        case 'meta':
        case 'param':
        case 'source':
        case 'track':
        case 'wbr':
            return true;
        default:
            return false;
    }
}
function getProcessableSegments(doc, full) {
    if (doc.languageId === 'html') {
        return [{ start: 0, end: full.length }];
    }
    if (doc.languageId === 'javascriptreact' || doc.languageId === 'typescriptreact') {
        // For JSX/TSX, process the entire document buffer
        return [{ start: 0, end: full.length }];
    }
    const segments = [];
    let i = 0;
    while (i < full.length) {
        if (full[i] === '`') {
            // Look backwards for an identifier ending with .?html before optional whitespace/comments
            let k = i - 1;
            // skip whitespace
            while (k >= 0 && /\s/.test(full[k]))
                k--;
            // skip line comments
            if (k >= 1 && full[k - 1] === '/' && full[k] === '/') {
                // unlikely right before backtick, but move back to line start
                while (k >= 0 && full[k] !== '\n')
                    k--;
            }
            // read last identifier possibly after a dot chain
            let endWord = k;
            // move over identifier chars
            while (endWord >= 0 && /[A-Za-z0-9_$]/.test(full[endWord]))
                endWord--;
            // if there's a dot, skip previous identifiers until no more dots
            let word = full.slice(endWord + 1, k + 1);
            if (word.length === 0 && full[endWord] === '.') {
                // try previous word
                let p = endWord - 1;
                while (p >= 0 && /[A-Za-z0-9_$\.]/.test(full[p]))
                    p--;
                const chain = full.slice(p + 1, k + 1).replace(/\s+/g, '');
                if (chain.endsWith('.html'))
                    word = 'html';
            }
            if (word === 'html') {
                const contentStart = i + 1;
                const end = scanBacktickLiteral(full, contentStart);
                if (end !== -1) {
                    segments.push({ start: contentStart, end });
                    i = end + 1;
                    continue;
                }
            }
        }
        i++;
    }
    return segments;
}
function nextDifferentColor(startIndex, forbiddenIndex) {
    if (forbiddenIndex === null)
        return startIndex % RAINBOW_COLORS.length;
    let idx = startIndex % RAINBOW_COLORS.length;
    if (idx === forbiddenIndex) {
        idx = (idx + 1) % RAINBOW_COLORS.length;
    }
    return idx;
}
function findTagEnd(text, startPos, hardEnd) {
    // Find '>' but treat `>` inside attribute values as text.
    // Handle quotes ' and " and also template placeholders like ${ ... } inside attribute values of html templates.
    let i = startPos;
    let inSingle = false;
    let inDouble = false;
    let exprBraceDepth = 0;
    while (i < hardEnd) {
        const ch = text[i];
        const next2 = text.slice(i, i + 2);
        if (exprBraceDepth === 0) {
            // Enter/exit quotes, with escape handling
            if (!inDouble && ch === "'" && !inSingle) {
                inSingle = true;
                i++;
                continue;
            }
            if (inSingle && ch === "'") {
                inSingle = false;
                i++;
                continue;
            }
            if (!inSingle && ch === '"' && !inDouble) {
                inDouble = true;
                i++;
                continue;
            }
            if (inDouble && ch === '"') {
                inDouble = false;
                i++;
                continue;
            }
            if ((inSingle || inDouble) && ch === '\\' && i + 1 < hardEnd) {
                i += 2;
                continue;
            }
            // Enter template expression both inside or outside quotes
            if (next2 === '${') {
                const res = scanTemplateExpr(text, i + 2, hardEnd);
                if (res === -1)
                    return -1;
                i = res;
                continue;
            }
            // End of tag when not inside quotes or expressions
            if (ch === '>' && !inSingle && !inDouble)
                return i;
            i++;
            continue;
        }
        // Should never reach here since scanTemplateExpr consumes fully
        i++;
    }
    return -1;
}
function scanTemplateExpr(text, startPos, hardEnd) {
    // We enter right after the `${`. We must stop right after the matching `}` of this expression.
    let i = startPos;
    let braceDepth = 1; // one '{' from `${`
    let inSingle = false;
    let inDouble = false;
    let inBacktick = false;
    while (i < hardEnd) {
        const ch = text[i];
        const next2 = text.slice(i, i + 2);
        // Handle escapes in any string mode
        if ((inSingle || inDouble || inBacktick) && ch === '\\') {
            i += 2;
            continue;
        }
        // Toggle string modes
        if (!inDouble && !inBacktick && ch === "'" && !inSingle) {
            inSingle = true;
            i++;
            continue;
        }
        if (inSingle && ch === "'") {
            inSingle = false;
            i++;
            continue;
        }
        if (!inSingle && !inBacktick && ch === '"' && !inDouble) {
            inDouble = true;
            i++;
            continue;
        }
        if (inDouble && ch === '"') {
            inDouble = false;
            i++;
            continue;
        }
        if (!inSingle && !inDouble && ch === '`' && !inBacktick) {
            inBacktick = true;
            i++;
            continue;
        }
        if (inBacktick && ch === '`') {
            inBacktick = false;
            i++;
            continue;
        }
        if (!(inSingle || inDouble || inBacktick)) {
            if (next2 === '${') {
                braceDepth++;
                i += 2;
                continue;
            }
            if (ch === '{') {
                braceDepth++;
                i++;
                continue;
            }
            if (ch === '}') {
                braceDepth--;
                i++;
                if (braceDepth === 0)
                    return i;
                continue;
            }
        }
        i++;
    }
    return -1;
}
function scanBacktickLiteral(text, startPos) {
    // startPos is first char after opening backtick. Return index of closing backtick.
    let i = startPos;
    let expr = 0;
    while (i < text.length) {
        const ch = text[i];
        const next2 = text.slice(i, i + 2);
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (expr === 0) {
            if (ch === '`')
                return i;
            if (next2 === '${') {
                expr = 1;
                i += 2;
                continue;
            }
            i++;
        }
        else {
            // inside ${...}
            if (next2 === '${') {
                expr++;
                i += 2;
                continue;
            }
            if (ch === '}') {
                expr--;
                i++;
                continue;
            }
            // handle string literals inside the JS expression
            if (ch === '"' || ch === "'" || ch === '`') {
                const endStr = scanJsString(text, i);
                i = endStr === -1 ? i + 1 : endStr;
                continue;
            }
            i++;
        }
    }
    return -1;
}
function scanJsString(text, startPos) {
    const quote = text[startPos];
    let i = startPos + 1;
    let nestedTpl = 0;
    while (i < text.length) {
        const ch = text[i];
        const next2 = text.slice(i, i + 2);
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (quote === '`') {
            if (next2 === '${') {
                nestedTpl++;
                i += 2;
                continue;
            }
            if (ch === '`' && nestedTpl === 0)
                return i + 1;
            if (ch === '}' && nestedTpl > 0) {
                nestedTpl--;
                i++;
                continue;
            }
            i++;
            continue;
        }
        if (ch === quote)
            return i + 1;
        i++;
    }
    return -1;
}
function extractProcessableText(doc) {
    // For html documents, process the whole text
    if (doc.languageId === 'html') {
        return doc.getText();
    }
    // For JS/TS variants, extract html`...` template literal contents, skipping ${...}
    const full = doc.getText();
    let result = '';
    let i = 0;
    while (i < full.length) {
        // Look for html` start
        if (full.startsWith('html`', i)) {
            i += 5; // move past html`
            const start = i;
            let buf = '';
            let inExprDepth = 0;
            while (i < full.length) {
                const ch = full[i];
                const next2 = full.slice(i, i + 2);
                if (inExprDepth === 0 && ch === '`') {
                    // end of template
                    result += buf;
                    i++; // consume closing backtick
                    break;
                }
                if (inExprDepth === 0 && next2 === '${') {
                    // enter expression; skip until matching }
                    inExprDepth = 1;
                    i += 2;
                    // Skip expression content with rudimentary brace balancing
                    let brace = 1;
                    while (i < full.length && brace > 0) {
                        const c = full[i];
                        if (c === '{')
                            brace++;
                        else if (c === '}')
                            brace--;
                        i++;
                    }
                    continue;
                }
                // handle escaped backticks \`
                if (ch === '\\' && i + 1 < full.length && full[i + 1] === '`') {
                    buf += '`';
                    i += 2;
                    continue;
                }
                buf += ch;
                i++;
            }
            continue;
        }
        i++;
    }
    return result;
}
//# sourceMappingURL=extension.js.map