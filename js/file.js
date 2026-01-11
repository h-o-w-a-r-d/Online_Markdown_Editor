// js/file.js

export function setupFileOperations(editor) {
    const fileInput = document.getElementById('file-input-element');
    const encodingSelect = document.getElementById('encoding-select');

    // 開啟
    document.getElementById('open-file-btn').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const encoding = encodingSelect.value;

        reader.onload = (e) => {
            editor.setContent(e.target.result);
            fileInput.value = ''; // 重置
        };
        
        reader.onerror = () => alert('讀取檔案失敗');
        reader.readAsText(file, encoding);
    });

    // 儲存
    document.getElementById('save-file-btn').addEventListener('click', () => {
        const content = editor.getContent();
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });


}
