// js/search.js

export function setupSearch(editor) {
    const searchBar = document.getElementById('search-bar');
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    const sourceInput = document.getElementById('source-input');

    document.getElementById('toggle-search-btn').addEventListener('click', () => {
        const isHidden = getComputedStyle(searchBar).display === 'none';
        searchBar.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) searchInput.focus();
    });

    document.getElementById('close-search-btn').addEventListener('click', () => {
        searchBar.style.display = 'none';
    });

    document.getElementById('find-next-btn').addEventListener('click', () => {
        const val = sourceInput.value;
        const keyword = searchInput.value;
        if (!keyword) return;

        const startPos = sourceInput.selectionEnd;
        let index = val.indexOf(keyword, startPos);
        
        if (index === -1) {
            index = val.indexOf(keyword); // 從頭找
        }

        if (index !== -1) {
            sourceInput.focus();
            sourceInput.setSelectionRange(index, index + keyword.length);
            // 簡單的捲動計算
            const lines = val.substr(0, index).split('\n').length;
            sourceInput.scrollTop = (lines - 2) * 24; 
        } else {
            alert('找不到目標文字');
        }
    });

    document.getElementById('replace-all-btn').addEventListener('click', () => {
        const keyword = searchInput.value;
        const replaceText = replaceInput.value;
        if (!keyword) return;

        if (confirm(`確定要將所有的 "${keyword}" 取代為 "${replaceText}" 嗎？`)) {
            const content = sourceInput.value.split(keyword).join(replaceText);
            editor.setContent(content);
        }
    });
}
