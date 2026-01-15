// js/main.js
import { configureMarked } from './markdown.js';
import { Editor } from './editor.js';
import { setupFileOperations } from './file.js';
import { setupSearch } from './search.js';

// ★★★ 新增：引入 Mermaid ★★★
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.12.2/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // ★★★ 新增：初始化 Mermaid ★★★
    mermaid.initialize({ 
        startOnLoad: false, // 關閉自動載入，由 Editor 手動觸發
        theme: 'default',
        securityLevel: 'loose', // 允許圖表中的 HTML
    });

    // 1. 設定 Markdown 渲染器
    configureMarked();

    // 2. 初始化編輯器核心
    const sourceInput = document.getElementById('source-input');
    const previewContainer = document.getElementById('preview-container');
    const wordCountDisplay = document.getElementById('word-count-display');
    
    const editor = new Editor(sourceInput, previewContainer, wordCountDisplay);
    editor.init();

    // 3. 綁定檔案操作
    setupFileOperations(editor);

    // 4. 綁定搜尋取代
    setupSearch(editor);

    // 5. 綁定事件
    sourceInput.addEventListener('input', () => editor.handleInput());
    
    sourceInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            editor.undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            editor.redo();
        }
    });

    document.getElementById('undo-btn').addEventListener('click', () => editor.undo());
    document.getElementById('redo-btn').addEventListener('click', () => editor.redo());
    
    document.getElementById('clear-btn').addEventListener('click', () => {
        if(confirm('確定要清空所有內容嗎？')) {
            editor.setContent('');
        }
    });
});