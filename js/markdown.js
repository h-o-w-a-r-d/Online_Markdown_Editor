// js/markdown.js

export function configureMarked() {
    const renderer = {
        code(token) {
            const text = token.text;
            const lang = token.lang;
            if (typeof hljs !== 'undefined' && lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                try {
                    const highlighted = hljs.highlight(text, { language }).value;
                    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
                } catch (e) {}
            }
            return `<pre><code>${text}</code></pre>`;
        }
    };
    marked.use({ renderer });
}

export function parseMarkdown(rawInput) {
    if (!rawInput) return "";

    let processed = rawInput;
    const mathMap = new Map();
    const codeMap = new Map();
    let counter = 0;

    // --- 步驟 1：保護程式碼區塊 (避免程式碼裡的 $ 被當成公式) ---
    // 我們先把它們挖出來，存到 codeMap，變成 __CODE_BLOCK_X__
    
    // 1.1 保護 ```...```
    processed = processed.replace(/(\n|^)```[\s\S]*?```/g, (match) => {
        const key = `__CODE_BLOCK_${counter++}__`;
        codeMap.set(key, match);
        return key;
    });

    // 1.2 保護行內代碼 `...`
    processed = processed.replace(/(`+)(.*?)\1/g, (match) => {
        const key = `__CODE_INLINE_${counter++}__`;
        codeMap.set(key, match);
        return key;
    });
    
    // 1.3 保護跳脫字元 \$
    processed = processed.replace(/\\\$/g, (match) => {
        const key = `__ESCAPED_DOLLAR_${counter++}__`;
        codeMap.set(key, match);
        return key; // 暫存為代號，避免被數學正則抓到
    });

    // --- 步驟 2：提取數學公式 (但不渲染！) ---
    // 我們只把公式挖出來，存成 LaTeX 字串，換成簡單的 __MATH_TOKEN_X__
    // 這樣 Marked 解析表格時，只會看到簡單的字串，不會被複雜的 SVG 搞爛
    
    // 2.1 區塊公式 $$...$$ (嚴格限制：必須獨占一行或在換行後)
    processed = processed.replace(/(^|\n)\$\$([\s\S]+?)\$\$($|\n)/g, (match, prefix, tex, suffix) => {
        const key = `__MATH_BLOCK_${counter++}__`;
        mathMap.set(key, { tex: tex, display: true });
        return prefix + key + suffix; // 保留原本的換行結構
    });

    // 2.2 行內公式 $...$
    processed = processed.replace(/\$([^\n]+?)\$/g, (match, tex) => {
        // CJK 防呆：如果包含中文且無 \text，視為誤判，直接忽略
        if (/[\u4e00-\u9fa5]/.test(tex) && !tex.includes('\\text')) {
            return match; 
        }
        const key = `__MATH_INLINE_${counter++}__`;
        mathMap.set(key, { tex: tex, display: false });
        return key;
    });

    // --- 步驟 3：還原程式碼區塊 ---
    // 為什麼要在這還原？因為我們要讓 Marked 看到 ```code``` 並進行高亮處理
    codeMap.forEach((value, key) => {
        processed = processed.replace(key, value);
    });

    // --- 步驟 4：Marked 解析 Markdown ---
    // 此時表格裡的公式只是 "__MATH_INLINE_99__" 這種純文字，非常安全
    let html = "";
    try {
        html = marked.parse(processed);
    } catch (err) {
        console.error("Markdown parse error:", err);
        return rawInput;
    }

    // --- 步驟 5：淨化 HTML (DOMPurify) ---
    // 先淨化，再放入數學公式，避免 DOMPurify 破壞 SVG 標籤
    html = DOMPurify.sanitize(html);

    // --- 步驟 6：最後渲染數學公式 (Post-render) ---
    // 現在 HTML 結構已經固定了，我們把代號換成真正的 KaTeX HTML
    mathMap.forEach((value, key) => {
        try {
            const rendered = katex.renderToString(value.tex, {
                displayMode: value.display,
                throwOnError: false
            });
            // 使用全域取代，以防同一個公式出現多次
            html = html.split(key).join(rendered);
        } catch (e) {
            // 如果渲染失敗，顯示原始碼
            html = html.split(key).join(value.tex);
        }
    });

    // 還原跳脫的 \$ (現在變回 $)
    // 注意：因為已經是 HTML，這裡不需要再做什麼，只需確保之前保護的代號被移除
    // 但因為我們在步驟3已經還原了 codeMap (包含 ESCAPED_DOLLAR)，
    // 所以這裡其實已經在 Marked 解析時變成了普通的 '$' 文字。
    
    return html;
}
