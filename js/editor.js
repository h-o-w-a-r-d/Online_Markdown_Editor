// js/editor.js
import { parseMarkdown } from './markdown.js';
import { calculateWordCount } from './count.js';
import { debounce } from './utils.js';
// ★★★ 新增：引入 Mermaid 以便呼叫 run ★★★
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.12.2/+esm';

export class Editor {
    constructor(sourceInput, previewContainer, wordCountDisplay) {
        this.sourceInput = sourceInput;
        this.previewContainer = previewContainer;
        this.wordCountDisplay = wordCountDisplay;
        
        this.historyStack = [];
        this.historyIndex = -1;
        
        this.debouncedSaveAndRender = debounce(() => this.saveToHistory(), 500);
    }

    init() {
        const savedContent = localStorage.getItem('markdown-content');
        if (savedContent) {
            this.sourceInput.value = savedContent;
        } else {
            // 更新預設教學內容，加入 Mermaid 範例
            this.sourceInput.value = `# 歡迎使用 Markdown 專業編輯器

這是一個整合 **Markdown**、**LaTeX**、**Mermaid 圖表** 與 **語法高亮** 的編輯器。

# 🛠️ 功能說明
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


## 📊 Mermaid 圖表範例大全


#### Flowchart
\`\`\`mermaid
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
\`\`\`


#### Class
\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }
\`\`\`


#### Sequence
\`\`\`mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
\`\`\`


#### Entity Relationship
\`\`\`mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : includes
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date orderDate
        string status
    }
    PRODUCT {
        string id
        string name
        float price
    }
    ORDER_ITEM {
        int quantity
        float price
    }
\`\`\`


#### State
\`\`\`mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
\`\`\`


#### Mindmap
\`\`\`mermaid
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
\`\`\`


#### Architecture
\`\`\`mermaid
architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db
\`\`\`


#### Block
\`\`\`mermaid
block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
\`\`\`


#### C4
\`\`\`mermaid
C4Context
    title System Context diagram for Internet Banking System
    Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        Person(customerB, "Banking Customer B")
        Person_Ext(customerC, "Banking Customer C", "desc")

        Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

        Enterprise_Boundary(b1, "BankBoundary") {
            SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

            System_Boundary(b2, "BankBoundary2") {
                System(SystemA, "Banking System A")
                System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
            }

            System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
            SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

            Boundary(b3, "BankBoundary3", "boundary") {
                SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
                SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
            }
        }
    }

    BiRel(customerA, SystemAA, "Uses")
    BiRel(SystemAA, SystemE, "Uses")
    Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
    Rel(SystemC, customerA, "Sends e-mails to")
\`\`\`


#### Gantt
\`\`\`mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d
\`\`\`


#### Git
\`\`\`mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
\`\`\`


#### Kanban
\`\`\`mermaid
---
config:
  kanban:
    ticketBaseUrl: 'https://github.com/mermaid-js/mermaid/issues/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: 2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: 2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: 2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]

\`\`\`


#### Packet
\`\`\`mermaid
---
title: "TCP Packet"
---
packet
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"
128-143: "Checksum"
144-159: "Urgent Pointer"
160-191: "(Options and Padding)"
192-255: "Data (variable length)"
\`\`\`


#### Pie
\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`


#### Quadrant
\`\`\`mermaid
quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
\`\`\`


#### Radar
\`\`\`mermaid
---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0

\`\`\`


#### Requirement
\`\`\`mermaid
requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
\`\`\`


#### Sankey
\`\`\`mermaid
---
config:
  sankey:
    showValues: false
---
sankey-beta

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,NGas,40.719
Gas reserves,NGas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
NGas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
\`\`\`


#### Timeline
\`\`\`mermaid
timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter
\`\`\`


#### Treemap
\`\`\`mermaid
treemap-beta
"Section 1"
    "Leaf 1.1": 12
    "Section 1.2"
      "Leaf 1.2.1": 12
"Section 2"
    "Leaf 2.1": 20
    "Leaf 2.2": 25
\`\`\`


#### User Journey
\`\`\`mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
\`\`\`


#### XY
\`\`\`mermaid
xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
\`\`\`
`;
        }
        
        this.historyStack.push(this.sourceInput.value);
        this.historyIndex = 0;
        
        this.render();
        this.updateButtons();
    }

    async render() {
        const content = this.sourceInput.value;
        localStorage.setItem('markdown-content', content);
        
        // 1. 渲染 Markdown (包含將 mermaid 區塊轉為 div)
        const html = parseMarkdown(content);
        this.previewContainer.innerHTML = html;

        // 2. ★★★ 新增：觸發 Mermaid 渲染 ★★★
        // 尋找所有 .mermaid 類別的容器並進行渲染
        try {
            await mermaid.run({
                querySelector: '.mermaid',
                suppressErrors: true // 避免輸入到一半時報錯
            });
        } catch (e) {
            console.warn('Mermaid rendering error:', e);
        }

        // 3. 更新字數
        const count = calculateWordCount(content);
        if (this.wordCountDisplay) {
            this.wordCountDisplay.textContent = `字數: ${count}`;
        }
    }

    handleInput() {
        this.render();
        this.debouncedSaveAndRender();
    }

    saveToHistory() {
        const currentContent = this.sourceInput.value;
        if (this.historyStack[this.historyIndex] !== currentContent) {
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