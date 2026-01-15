// js/markdown.js

export function configureMarked() {
    const renderer = {
        code(token) {
            const text = token.text;
            const lang = token.lang;
            
            // ★★★ 新增：Mermaid 攔截處理 ★★★
            if (lang === 'mermaid') {
                // 回傳 div 容器，而不是 pre code
                return `<div class="mermaid">${text}</div>`;
            }

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

    // ============================================
    // 步驟 1：保護程式碼 (避免程式碼裡的 $ 被當成公式)
    // ============================================
    
    // 1.1 保護區塊程式碼 ```...```
    processed = processed.replace(/(\n|^)```[\s\S]*?```/g, (match) => {
        const key = `CODEBLOCK${counter++}ENDCODE`; 
        codeMap.set(key, match);
        return key;
    });

    // 1.2 保護行內代碼 `...`
    processed = processed.replace(/(`+)(.*?)\1/g, (match) => {
        const key = `CODEINLINE${counter++}ENDCODE`;
        codeMap.set(key, match);
        return key;
    });
    
    // 1.3 保護跳脫字元 \$
    processed = processed.replace(/\\\$/g, (match) => {
        const key = `ESCAPEDDOLLAR${counter++}END`;
        codeMap.set(key, match);
        return key;
    });

    // ============================================
    // 步驟 2：提取數學公式
    // ============================================
    
    // 2.1 區塊公式 $$...$$
    processed = processed.replace(/(^|\n)\$\$([\s\S]+?)\$\$($|\n)/g, (match, prefix, tex, suffix) => {
        const key = `MATHBLOCK${counter++}ENDMATH`;
        mathMap.set(key, { tex: tex, display: true });
        return prefix + key + suffix; 
    });

    // 2.2 行內公式 $...$
    processed = processed.replace(/\$([^\n]+?)\$/g, (match, tex) => {
        if (/[\u4e00-\u9fa5]/.test(tex) && !tex.includes('\\text')) {
            return match; 
        }
        const key = `MATHINLINE${counter++}ENDMATH`;
        mathMap.set(key, { tex: tex, display: false });
        return key;
    });

    // ============================================
    // 步驟 3：還原程式碼區塊
    // ============================================
    codeMap.forEach((value, key) => {
        processed = processed.replace(key, value);
    });

    // ============================================
    // 步驟 4：Marked 解析
    // ============================================
    let html = "";
    try {
        html = marked.parse(processed);
    } catch (err) {
        console.error("Markdown parse error:", err);
        return rawInput;
    }

    // ============================================
    // 步驟 5：淨化 HTML
    // ============================================
    html = DOMPurify.sanitize(html);

    // ============================================
    // 步驟 6：渲染數學公式
    // ============================================
    mathMap.forEach((value, key) => {
        try {
            const rendered = katex.renderToString(value.tex, {
                displayMode: value.display,
                throwOnError: false
            });
            html = html.split(key).join(rendered);
        } catch (e) {
            html = html.split(key).join(value.tex);
        }
    });

    return html;
}