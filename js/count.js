// js/count.js

/**
 * 計算字數 (支援混合 CJK 與 西文)
 * 邏輯：
 * 1. 找出所有 CJK (中日韓) 字元，每個字算 1。
 * 2. 將 CJK 字元替換為空白，避免干擾西文計算。
 * 3. 剩下的文字視為西文，依據非單字字元(空白、標點)切割，計算單字數。
 */
export function calculateWordCount(text) {
    if (!text) return 0;

    // 定義 CJK 範圍 (包含 漢字、平假名、片假名、韓文音節)
    // \u4e00-\u9fa5: 常用漢字
    // \u3040-\u30ff: 日文假名
    // \uac00-\ud7af: 韓文
    // \u3400-\u4dbf, \uf900-\ufaff: 擴充漢字區
    const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf\uf900-\ufaff\uac00-\ud7af]/g;
    
    // 1. 計算 CJK 字元數量
    const cjkMatches = text.match(cjkRegex);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;

    // 2. 移除 CJK 字元，準備計算西文 (英文、德文、拉丁文等)
    // 將 CJK 換成空白，確保原本相連的英文單字不會因為中間有中文而被黏在一起
    const westernText = text.replace(cjkRegex, ' ');

    // 3. 計算西文單字
    // 使用正則表達式匹配「單字」 (支援帶重音符號的拉丁字母，如德文 ä, ö, ü)
    // [a-zA-Z0-9\u00C0-\u00FF]+ 代表連續的英數或西歐字元
    const westernMatches = westernText.match(/[a-zA-Z0-9\u00C0-\u00FF]+/g);
    const westernCount = westernMatches ? westernMatches.length : 0;

    // 總和
    return cjkCount + westernCount;
}
