// js/markdown.js

export function configureMarked() {
    const renderer = {
        // 處理行內公式 $...$ 和 $$...$$
        codespan(token) {
            const codeText = typeof token === 'string' ? token : (token.text || '');
            if (codeText.startsWith('$$') && codeText.endsWith('$$')) {
                try {
                    const tex = codeText.substring(2, codeText.length - 2);
                    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
                } catch (e) { return `<code>${codeText}</code>`; }
            } else if (codeText.startsWith('$') && codeText.endsWith('$')) {
                 try {
                    const tex = codeText.substring(1, codeText.length - 1);
                    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
                } catch (e) { return `<code>${codeText}</code>`; }
            }
            return false;
        },
        // 處理程式碼區塊 ```math 與 highlight
        code(token) {
            const text = token.text;
            const lang = token.lang;
            if (lang === 'math') {
                try {
                    return `<p>${katex.renderToString(text, { throwOnError: false, displayMode: true })}</p>`;
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

    marked.use({ renderer });
}

export function parseMarkdown(rawInput) {
    // 預處理：將 $$...$$ 轉為 block，將 $...$ 轉為 inline codespan 格式以便 renderer 處理
    let processedMessage = rawInput
        .replace(/\$\$([\s\S]+?)\$\$/g, '```math\n$1\n```')
        .replace(/(^|[^\\])\$([^\n$]+?)\$/g, '$1`$$$2$$`');

    try {
        const html = marked.parse(processedMessage);
        return DOMPurify.sanitize(html);
    } catch (err) {
        console.error("Parse error:", err);
        return "";
    }
}
