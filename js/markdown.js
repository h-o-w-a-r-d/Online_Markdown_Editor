// js/markdown.js

export function configureMarked() {
    // 這裡只負責處理 "標準" 的程式碼區塊高亮
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
    const codeMap = new Map();
    let maskCounter = 0;

    // --- 第一步：保護機制 (Masking) ---
    
    // 1.1 保護「程式碼區塊」(```...```)
    processed = processed.replace(/(\n|^)```[\s\S]*?```/g, (match) => {
        const key = `__MASKED_BLOCK_${maskCounter++}__`;
        codeMap.set(key, match);
        return key;
    });

    // 1.2 保護「行內程式碼」(`...`)
    processed = processed.replace(/(`+)(.*?)\1/g, (match) => {
        const key = `__MASKED_INLINE_${maskCounter++}__`;
        codeMap.set(key, match);
        return key;
    });

    // 1.3 保護「跳脫字元」(\$)
    // 讓使用者可以輸入 \$ 來顯示真正的錢字號，而不會被當成公式
    processed = processed.replace(/\\\$/g, (match) => {
        const key = `__MASKED_ESCAPE_${maskCounter++}__`;
        codeMap.set(key, match);
        return key;
    });

    // --- 第二步：渲染數學公式 ---

    // 2.1 嚴格處理「區塊公式」 ($$ ... $$)
    // 修正點：限制 $$ 必須在「行首」或「換行後」，避免誤判文字中的 "$$"
    processed = processed.replace(/(^|\n)\$\$([\s\S]+?)\$\$($|\n)/g, (match, prefix, tex, suffix) => {
        try {
            const rendered = katex.renderToString(tex, { displayMode: true, throwOnError: false });
            return prefix + rendered + suffix;
        } catch (e) { return match; }
    });

    // 2.2 智慧處理「行內公式」 ($ ... $)
    processed = processed.replace(/\$([^\n]+?)\$/g, (match, tex) => {
        // 防呆機制：如果內容包含中文(CJK)，且沒有使用 \text 指令，通常代表這是誤判 (例如：使用 '$' 包裹)
        // 這樣可以避免 KaTeX 報錯並導致後面的公式亂掉
        if (/[\u4e00-\u9fa5]/.test(tex) && !tex.includes('\\text')) {
            return match; // 當作一般文字，不渲染
        }

        try {
            return katex.renderToString(tex, { displayMode: false, throwOnError: false });
        } catch (e) { return match; }
    });

    // --- 第三步：還原保護內容 ---
    codeMap.forEach((value, key) => {
        processed = processed.replace(key, value);
    });

    // --- 第四步：Marked 解析 ---
    try {
        const html = marked.parse(processed);
        return DOMPurify.sanitize(html);
    } catch (err) {
        console.error("Parse error:", err);
        return "";
    }
}
