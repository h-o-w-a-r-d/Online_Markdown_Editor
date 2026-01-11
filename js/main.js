// js/main.js
import { configureMarked } from './markdown.js';
import { Editor } from './editor.js';
import { setupFileOperations } from './file.js';
import { setupSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 設定 Markdown 渲染器 (KaTeX, Highlight.js)
    configureMarked();

    // 2. 初始化編輯器核心
    const sourceInput = document.getElementById('source-input');
    const previewContainer = document.getElementById('preview-container');
    const wordCountDisplay = document.getElementById('word-count-display');
    
    const editor = new Editor(sourceInput, previewContainer, wordCountDisplay);
    editor.init();

    // 3. 綁定檔案操作 (開啟、儲存、編碼)
    setupFileOperations(editor);

    // 4. 綁定搜尋取代
    setupSearch(editor);

    // 5. 綁定主要輸入事件與快捷鍵
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
