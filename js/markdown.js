// js/markdown.js

export function configureMarked() {
    // 設定 Highlight.js 的渲染器
    // 這裡只負責處理 "標準" 的程式碼區塊高亮
    // 數學公式的處理邏輯我們移到 parseMarkdown 函式中
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

    // --- 第一步：保護程式碼區塊 (Masking) ---
    // 為了避免數學公式解析器誤判程式碼區塊內的 $ 或 $$，我們先將程式碼挖空並儲存
    const codeMap = new Map();
    let maskCounter = 0;

    // 1.1 保護區塊程式碼 (``` ... ```)
    // Regex: 尋找以 ``` 開頭和結尾的區塊，允許換行
    let processed = rawInput.replace(/(\n|^)```[\s\S]*?```/g, (match) => {
        const key = `__MASKED_BLOCK_${maskCounter++}__`;
        codeMap.set(key, match);
        return key; // 替換成佔位符
    });

    // 1.2 保護行內程式碼 (` ... `)
    // Regex: 匹配一對或多對反引號包裹的內容
    processed = processed.replace(/(`+)(.*?)\1/g, (match) => {
        const key = `__MASKED_INLINE_${maskCounter++}__`;
        codeMap.set(key, match);
        return key;
    });

    // --- 第二步：渲染數學公式 (Rendering Math) ---
    // 現在字串中已經沒有程式碼區塊了，可以放心地轉換 $$ 和 $
    
    // 2.1 處理獨立區塊公式 ($$ ... $$)
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
        try {
            return katex.renderToString(tex, { 
                displayMode: true, 
                throwOnError: false 
            });
        } catch (e) { return match; }
    });

    // 2.2 處理行內公式 ($ ... $)
    processed = processed.replace(/\$([^\n]+?)\$/g, (match, tex) => {
        try {
            return katex.renderToString(tex, { 
                displayMode: false, 
                throwOnError: false 
            });
        } catch (e) { return match; }
    });

    // --- 第三步：還原程式碼 (Unmasking) ---
    // 將剛剛挖掉的程式碼填回去，這樣 Marked.js 才能正確解析它們並進行高亮
    codeMap.forEach((value, key) => {
        processed = processed.replace(key, value);
    });

    // --- 第四步：Marked 解析 ---
    try {
        // 這時公式已經變成 HTML 標籤 (KaTeX)，Marked 會把它們當作一般 HTML 保留
        // 程式碼區塊也已經還原，Marked 會把它們當作程式碼區塊進行高亮
        const html = marked.parse(processed);
        return DOMPurify.sanitize(html);
    } catch (err) {
        console.error("Parse error:", err);
        return "";
    }
}
