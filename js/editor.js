// js/editor.js
import { parseMarkdown } from './markdown.js';
import { calculateWordCount } from './count.js';
import { debounce } from './utils.js';

export class Editor {
    constructor(sourceInput, previewContainer, wordCountDisplay) {
        this.sourceInput = sourceInput;
        this.previewContainer = previewContainer;
        this.wordCountDisplay = wordCountDisplay;
        
        // 歷史紀錄相關
        this.historyStack = [];
        this.historyIndex = -1;
        
        // 防抖動的存檔與計算
        this.debouncedSaveAndRender = debounce(() => this.saveToHistory(), 500);
    }

    init() {
        const savedContent = localStorage.getItem('markdown-content');
        if (savedContent) {
            this.sourceInput.value = savedContent;
        } else {
            this.sourceInput.value = `# 歡迎使用\n\n測試字數: Hello World, 你好世界。\n$E=mc^2$`;
        }
        
        // 初始化歷史紀錄
        this.historyStack.push(this.sourceInput.value);
        this.historyIndex = 0;
        
        this.render();
        this.updateButtons();
    }

    render() {
        const content = this.sourceInput.value;
        localStorage.setItem('markdown-content', content);
        
        // 1. 渲染 Markdown
        const html = parseMarkdown(content);
        this.previewContainer.innerHTML = html;

        // 2. 更新字數
        const count = calculateWordCount(content);
        if (this.wordCountDisplay) {
            this.wordCountDisplay.textContent = `字數: ${count}`;
        }
    }

    handleInput() {
        this.render();
        // 延遲儲存歷史紀錄
        this.debouncedSaveAndRender();
    }

    saveToHistory() {
        const currentContent = this.sourceInput.value;
        // 只有內容不同才存
        if (this.historyStack[this.historyIndex] !== currentContent) {
            // 清除指標後的紀錄 (如果有的話)
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyStack.splice(this.historyIndex + 1);
            }
            this.historyStack.push(currentContent);
            this.historyIndex++;
            this.updateButtons();
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.sourceInput.value = this.historyStack[this.historyIndex];
            this.render();
            this.updateButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyIndex++;
            this.sourceInput.value = this.historyStack[this.historyIndex];
            this.render();
            this.updateButtons();
        }
    }

    updateButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.historyStack.length - 1;
    }
    
    setContent(text) {
        this.sourceInput.value = text;
        this.render();
        this.saveToHistory();
    }
    
    getContent() {
        return this.sourceInput.value;
    }
}
