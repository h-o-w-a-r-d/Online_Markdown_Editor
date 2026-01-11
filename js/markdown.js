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

    // ============================================
    // 步驟 1：保護程式碼 (避免程式碼裡的 $ 被當成公式)
    // ============================================
    // 使用純英數字的 Token，避免 Markdown 誤判為粗體或斜體
    
    // 1.1 保護區塊程式碼 ```...```
    processed = processed.replace(/(\n|^)```[\s\S]*?```/g, (match) => {
        const key = `CODEBLOCK${counter++}ENDCODE`; // 改用無特殊符號的代號
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
    // 步驟 2：提取數學公式 (換成純文字代號)
    // ============================================
    
    // 2.1 區塊公式 $$...$$ (嚴格限制：換行開頭與結尾)
    processed = processed.replace(/(^|\n)\$\$([\s\S]+?)\$\$($|\n)/g, (match, prefix, tex, suffix) => {
        const key = `MATHBLOCK${counter++}ENDMATH`; // 純英數字 Token
        mathMap.set(key, { tex: tex, display: true });
        // 保留原本的前後換行符號，維持段落結構
        return prefix + key + suffix; 
    });

    // 2.2 行內公式 $...$
    processed = processed.replace(/\$([^\n]+?)\$/g, (match, tex) => {
        // CJK 防呆
        if (/[\u4e00-\u9fa5]/.test(tex) && !tex.includes('\\text')) {
            return match; 
        }
        const key = `MATHINLINE${counter++}ENDMATH`; // 純英數字 Token
        mathMap.set(key, { tex: tex, display: false });
        return key;
    });

    // ============================================
    // 步驟 3：還原程式碼區塊
    // ============================================
    // 讓 Marked 看到 ```code``` 並進行高亮
    codeMap.forEach((value, key) => {
        processed = processed.replace(key, value);
    });

    // ============================================
    // 步驟 4：Marked 解析
    // ============================================
    let html = "";
    try {
        // 這時候公式只是 "MATHINLINE15ENDMATH" 這種普通單字
        // Marked 不會對它做任何 formatting (因為沒有底線)
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
    // 步驟 6：渲染數學公式 (最後一步)
    // ============================================
    // 把代號換成真正的 KaTeX HTML
    mathMap.forEach((value, key) => {
        try {
            const rendered = katex.renderToString(value.tex, {
                displayMode: value.display,
                throwOnError: false
            });
            // 全域替換
            html = html.split(key).join(rendered);
        } catch (e) {
            html = html.split(key).join(value.tex);
        }
    });

    return html;
}
