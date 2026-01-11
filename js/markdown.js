// js/markdown.js

export function configureMarked() {
    
    // 1. 定義【區塊數學公式】擴充 ($$ ... $$)
    const blockMathExtension = {
        name: 'blockMath',
        level: 'block', // 屬於區塊層級
        start(src) { return src.indexOf('$$'); }, // 提示 Marked 從哪裡開始找
        tokenizer(src, tokens) {
            // 正則：開頭必須是 $$，中間任意內容，結尾 $$
            const rule = /^\$\$([\s\S]+?)\$\$/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'blockMath',
                    raw: match[0],
                    text: match[1].trim()
                };
            }
        },
        renderer(token) {
            try {
                return `<div class="katex-block">${katex.renderToString(token.text, { throwOnError: false, displayMode: true })}</div>`;
            } catch (e) {
                return `<pre>${token.text}</pre>`;
            }
        }
    };

    // 2. 定義【行內數學公式】擴充 ($ ... $)
    const inlineMathExtension = {
        name: 'inlineMath',
        level: 'inline', // 屬於行內層級
        start(src) { return src.indexOf('$'); },
        tokenizer(src, tokens) {
            // 正則：開頭 $，中間非換行內容，結尾 $
            const rule = /^\$([^\n]+?)\$/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'inlineMath',
                    raw: match[0],
                    text: match[1].trim()
                };
            }
        },
        renderer(token) {
            try {
                return katex.renderToString(token.text, { throwOnError: false, displayMode: false });
            } catch (e) {
                return token.text;
            }
        }
    };

    // 3. 設定 Highlight.js 的渲染器 (保留程式碼高亮功能)
    const renderer = {
        code(token) {
            const text = token.text;
            const lang = token.lang;
            
            // 如果剛好有人用 ```math 寫法，也支援一下
            if (lang === 'math') {
                try {
                    return `<div class="katex-block">${katex.renderToString(text, { throwOnError: false, displayMode: true })}</div>`;
                } catch (e) { return `<pre><code>${text}</code></pre>`; }
            }

            if (typeof hljs !== 'undefined') {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                try {
                    const highlighted = hljs.highlight(text, { language }).value;
                    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
                } catch (e) {}
            }
            return `<pre><code>${text}</code></pre>`;
        }
    };

    // 4. 套用設定
    marked.use({ 
        extensions: [blockMathExtension, inlineMathExtension],
        renderer: renderer
    });
}

export function parseMarkdown(rawInput) {
    // ★★★ 重點：這裡不需要再做任何 replace 了！ ★★★
    // 讓 Marked 的擴充功能自己去解析結構，它會自動避開代碼區塊內的符號。
    
    try {
        const html = marked.parse(rawInput);
        return DOMPurify.sanitize(html);
    } catch (err) {
        console.error("Parse error:", err);
        return "";
    }
}
