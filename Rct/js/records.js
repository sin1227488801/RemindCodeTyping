// トグルボタンに表示・非表示のイベントリスナーを追加する関数
function setupToggleButtons() {
    console.log('Setting up toggle buttons...');
    
    document.querySelectorAll(".toggleButton").forEach(button => {
        console.log('Found toggle button:', button);
        
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);
            
            console.log('Toggle button clicked:', targetId, targetElement);

            if (!targetElement) {
                console.error('Target element not found:', targetId);
                return;
            }

            // 表示・非表示をトグル
            if (targetElement.style.display === "none" || targetElement.style.display === "") {
                targetElement.style.display = "block";
                this.classList.add("active");
                this.textContent = "▼";
                console.log('Showing content for:', targetId);
            } else {
                targetElement.style.display = "none";
                this.classList.remove("active");
                this.textContent = "▶";
                console.log('Hiding content for:', targetId);
            }
        });
    });
    
    console.log('Toggle buttons setup complete');
}
