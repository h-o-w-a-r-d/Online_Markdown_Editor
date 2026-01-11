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
            // 預設教學內容
            this.sourceInput.value = `# 歡迎使用 Markdown 專業編輯器

這是一個整合 **Markdown 預覽**、**LaTeX 數學公式** 與 **語法高亮** 的編輯器。

## 🛠️ 功能說明
1. **檔案操作**：支援開啟/儲存 \`.md\` 檔案，並可選擇編碼 (UTF-8, Big5, Shift_JIS, GBK)。
2. **編輯工具**：支援 **上一步 (Ctrl+Z)** 與 **下一步 (Ctrl+Y)**。
3. **搜尋取代**：點擊「搜尋」按鈕或使用工具列開啟搜尋面板。
4. **字數統計**：底部狀態列即時顯示字數 (支援中日韓與歐語系混合計算)。

---

## 📝 Markdown 語法教學

### 1. 標題與文字
# 第一層標題 (H1)
## 第二層標題 (H2)
**這是粗體文字**
*這是斜體文字*
~~這是刪除線~~

### 2. 清單
- 無序清單項目 A
- 無序清單項目 B
1. 有序清單項目 1
2. 有序清單項目 2

### 3. 程式碼區塊
使用三個反引號 (\`) 包裹程式碼：

\`\`\`javascript
function hello() {
    console.log("Hello World");
}
\`\`\`

### 4. 引用與連結
> 這是引用區塊
[Google 首頁](https://www.google.com)

---

## 📐 LaTeX 數學公式教學
本編輯器使用 **KaTeX** 渲染，支援行內與區塊公式。

### 1. 行內公式 (Inline)
使用單個 \`$\` 包裹，例如：
質能互換公式：$E = mc^2$
歐拉恆等式：$e^{i\\pi} + 1 = 0$

### 2. 獨立區塊 (Block)
使用 \`$$\` 包裹，公式會置中顯示：
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

### 3. 常用數學符號速查
| 描述 | 語法 | 預覽 |
| :--- | :--- | :--- |
| 分數 | \`\\frac{a}{b}\` | $\\frac{a}{b}$ |
| 上標 | \`x^2\` | $x^2$ |
| 下標 | \`x_i\` | $x_i$ |
| 根號 | \`\\sqrt{x}\` | $\\sqrt{x}$ |
| 總和 | \`\\sum_{i=1}^n\` | $\\sum_{i=1}^n$ |
| 積分 | \`\\int_a^b f(x) dx\` | $\\int_a^b f(x) dx$ |
| 希臘字母 | \`\\alpha, \\beta, \\theta\` | $\\alpha, \\beta, \\theta$ |
| 矩陣 | \`\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\` | $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ |
`;
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
