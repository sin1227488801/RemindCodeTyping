-- HTMLとCSSの問題を20問ずつ追加

INSERT INTO study_book (id, user_id, language, question, explanation, created_at, updated_at)
VALUES 

-- HTML問題（20問）
(
    '550e8400-e29b-41d4-a716-446655440200',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>',
    'HTMLの基本的な構造とDoctype宣言の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<header>
    <nav>
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
</header>',
    'HTMLのセマンティック要素とナビゲーションの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<form action="/submit" method="post">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
    
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    
    <button type="submit">Submit</button>
</form>',
    'HTMLのフォーム要素と入力検証の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Age</th>
            <th>City</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Alice</td>
            <td>25</td>
            <td>Tokyo</td>
        </tr>
    </tbody>
</table>',
    'HTMLのテーブル構造（thead、tbody）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440204',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<article>
    <header>
        <h2>Article Title</h2>
        <time datetime="2024-01-15">January 15, 2024</time>
    </header>
    <p>This is the article content...</p>
    <footer>
        <p>Author: John Doe</p>
    </footer>
</article>',
    'HTMLのarticle要素とtime要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<figure>
    <img src="image.jpg" alt="Beautiful landscape" width="300" height="200">
    <figcaption>A beautiful mountain landscape at sunset</figcaption>
</figure>',
    'HTMLのfigure要素とfigcaption要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440206',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<details>
    <summary>Click to expand</summary>
    <p>This content is hidden by default and can be toggled by clicking the summary.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
    </ul>
</details>',
    'HTMLのdetails要素とsummary要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440207',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<video controls width="400">
    <source src="movie.mp4" type="video/mp4">
    <source src="movie.webm" type="video/webm">
    <p>Your browser does not support the video element.</p>
</video>

<audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    <source src="audio.ogg" type="audio/ogg">
</audio>',
    'HTMLのvideo要素とaudio要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440208',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<div class="container">
    <aside class="sidebar">
        <h3>Sidebar</h3>
        <p>Navigation links here</p>
    </aside>
    <main class="content">
        <h1>Main Content</h1>
        <p>Primary content goes here</p>
    </main>
</div>',
    'HTMLのレイアウト用セマンティック要素（aside、main）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440209',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<fieldset>
    <legend>Personal Information</legend>
    <label for="firstName">First Name:</label>
    <input type="text" id="firstName" name="firstName">
    
    <label for="lastName">Last Name:</label>
    <input type="text" id="lastName" name="lastName">
</fieldset>',
    'HTMLのfieldset要素とlegend要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440210',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<select name="country" id="country">
    <option value="">Select a country</option>
    <optgroup label="Asia">
        <option value="jp">Japan</option>
        <option value="kr">Korea</option>
    </optgroup>
    <optgroup label="Europe">
        <option value="uk">United Kingdom</option>
        <option value="de">Germany</option>
    </optgroup>
</select>',
    'HTMLのselect要素とoptgroup要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440211',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<canvas id="myCanvas" width="300" height="200">
    Your browser does not support the canvas element.
</canvas>

<script>
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "blue";
ctx.fillRect(10, 10, 100, 50);
</script>',
    'HTMLのcanvas要素とJavaScriptでの描画例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440212',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<progress value="70" max="100">70%</progress>

<meter value="0.7" min="0" max="1">70%</meter>

<input type="range" min="0" max="100" value="50" id="slider">
<output for="slider" id="output">50</output>',
    'HTMLのprogress、meter、range要素の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440213',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<datalist id="browsers">
    <option value="Chrome">
    <option value="Firefox">
    <option value="Safari">
    <option value="Edge">
</datalist>

<input type="text" list="browsers" placeholder="Choose a browser">',
    'HTMLのdatalist要素を使った入力候補の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440214',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<blockquote cite="https://example.com">
    <p>This is a quoted text from another source.</p>
    <footer>
        <cite>Source: Example Website</cite>
    </footer>
</blockquote>

<p>He said <q>Hello World</q> to everyone.</p>',
    'HTMLの引用要素（blockquote、q、cite）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440215',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<address>
    <p>Contact Information:</p>
    <p>Email: <a href="mailto:info@example.com">info@example.com</a></p>
    <p>Phone: <a href="tel:+81-3-1234-5678">+81-3-1234-5678</a></p>
    <p>Address: 123 Tokyo Street, Japan</p>
</address>',
    'HTMLのaddress要素と連絡先情報の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440216',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<dl>
    <dt>HTML</dt>
    <dd>HyperText Markup Language</dd>
    
    <dt>CSS</dt>
    <dd>Cascading Style Sheets</dd>
    
    <dt>JavaScript</dt>
    <dd>Programming language for web development</dd>
</dl>',
    'HTMLの定義リスト（dl、dt、dd）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440217',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<input type="date" id="birthday" name="birthday">
<input type="time" id="meeting-time" name="meeting-time">
<input type="datetime-local" id="appointment" name="appointment">
<input type="color" id="favcolor" name="favcolor" value="#ff0000">
<input type="file" id="upload" name="upload" accept="image/*" multiple>',
    'HTMLの新しい入力タイプ（date、time、color、file）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440218',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<template id="card-template">
    <div class="card">
        <h3 class="card-title"></h3>
        <p class="card-content"></p>
        <button class="card-button">Click me</button>
    </div>
</template>

<script>
const template = document.getElementById("card-template");
const clone = template.content.cloneNode(true);
document.body.appendChild(clone);
</script>',
    'HTMLのtemplate要素とJavaScriptでの複製例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440219',
    '550e8400-e29b-41d4-a716-446655440000',
    'HTML',
    '<picture>
    <source media="(min-width: 800px)" srcset="large.jpg">
    <source media="(min-width: 400px)" srcset="medium.jpg">
    <img src="small.jpg" alt="Responsive image">
</picture>

<img src="image.jpg" alt="Description" 
     srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
     sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px">',
    'HTMLのレスポンシブ画像（picture、srcset）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- CSS問題（20問）
(
    '550e8400-e29b-41d4-a716-446655440300',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    'body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f4;
}

h1 {
    color: #333;
    text-align: center;
    font-size: 2rem;
}',
    'CSSの基本的なスタイリング（フォント、色、レイアウト）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.item {
    flex: 1;
    padding: 10px;
    background-color: white;
    border-radius: 8px;
}',
    'CSSのFlexboxレイアウトの基本的な使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440302',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 20px;
    padding: 20px;
}

.grid-item {
    background-color: #ddd;
    padding: 20px;
    text-align: center;
}',
    'CSSのGrid Layoutの基本的な使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440303',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.button {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    color: white;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}',
    'CSSのグラデーション、トランジション、ホバー効果の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440304',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '@media (max-width: 768px) {
    .container {
        flex-direction: column;
        padding: 10px;
    }
    
    .sidebar {
        display: none;
    }
    
    .main-content {
        width: 100%;
    }
}',
    'CSSのメディアクエリを使ったレスポンシブデザインの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440305',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.card {
    position: relative;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
}',
    'CSSの疑似要素（::before）とポジショニングの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440306',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate {
    animation: fadeInUp 0.6s ease-out;
}',
    'CSSのキーフレームアニメーションの定義と使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440307',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    ':root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --font-size-base: 16px;
    --spacing-unit: 8px;
}

.theme-button {
    background-color: var(--primary-color);
    font-size: var(--font-size-base);
    padding: calc(var(--spacing-unit) * 2);
}',
    'CSSのカスタムプロパティ（CSS変数）の定義と使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440308',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.navbar {
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.hero {
    height: 100vh;
    background: url("hero.jpg") center/cover;
    display: flex;
    align-items: center;
    justify-content: center;
}',
    'CSSのsticky positioning、backdrop-filter、背景画像の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440309',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.form-group {
    position: relative;
    margin-bottom: 20px;
}

.form-input {
    width: 100%;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 4px;
}

.form-input:focus {
    outline: none;
    border-color: #3498db;
}

.form-input:focus + .form-label,
.form-input:not(:placeholder-shown) + .form-label {
    transform: translateY(-25px) scale(0.8);
    color: #3498db;
}',
    'CSSのフォーカス状態と隣接セレクタを使ったフローティングラベルの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440310',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.masonry {
    column-count: 3;
    column-gap: 20px;
}

.masonry-item {
    break-inside: avoid;
    margin-bottom: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
}

@media (max-width: 768px) {
    .masonry {
        column-count: 2;
    }
}',
    'CSSのマルチカラムレイアウト（masonry風）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440311',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.tooltip {
    position: relative;
    cursor: pointer;
}

.tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
}

.tooltip:hover::after {
    opacity: 1;
}',
    'CSSの疑似要素とattr()関数を使ったツールチップの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440312',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}',
    'CSSのローディングスピナーアニメーションの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440313',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.dark-mode {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --card-bg: #2d2d2d;
}

.light-mode {
    --bg-color: #ffffff;
    --text-color: #333333;
    --card-bg: #f8f9fa;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 0.3s, color 0.3s;
}',
    'CSSのダークモード実装（CSS変数とクラス切り替え）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440314',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.parallax-container {
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
    perspective: 1px;
}

.parallax-element {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateZ(-1px) scale(2);
}

.content {
    position: relative;
    background-color: white;
    z-index: 1;
}',
    'CSSのパララックス効果（perspective、translateZ）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440315',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.glassmorphism {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.neumorphism {
    background: #e0e0e0;
    border-radius: 20px;
    box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
}',
    'CSSのグラスモーフィズムとニューモーフィズムの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440316',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.container {
    display: grid;
    grid-template-areas: 
        "header header header"
        "sidebar main aside"
        "footer footer footer";
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 200px 1fr 200px;
    min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }',
    'CSSのGrid Template Areasを使ったレイアウトの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440317',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.scroll-snap-container {
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    height: 100vh;
}

.scroll-snap-item {
    scroll-snap-align: start;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.smooth-scroll {
    scroll-behavior: smooth;
}',
    'CSSのスクロールスナップとスムーススクロールの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440318',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '.clip-path-shape {
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.mask-image {
    width: 300px;
    height: 200px;
    background: url("image.jpg") center/cover;
    mask-image: radial-gradient(circle, black 50%, transparent 70%);
}',
    'CSSのclip-pathとmask-imageを使った図形マスクの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440319',
    '550e8400-e29b-41d4-a716-446655440000',
    'CSS',
    '@supports (display: grid) {
    .modern-layout {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }
}

@supports not (display: grid) {
    .modern-layout {
        display: flex;
        flex-wrap: wrap;
    }
    
    .modern-layout > * {
        flex: 1 1 250px;
        margin: 10px;
    }
}',
    'CSSの@supportsを使った機能検出とフォールバックの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);