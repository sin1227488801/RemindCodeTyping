// トグルボタンに表示・非表示のイベントリスナーを追加する関数
function setupToggleButtons() {
    document.querySelectorAll(".toggleButton").forEach(button => {
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);

            // 表示・非表示をトグル
            if (targetElement.style.display === "none" || targetElement.style.display === "") {
                targetElement.style.display = "block";
                this.classList.add("active");
            } else {
                targetElement.style.display = "none";
                this.classList.remove("active");
            }
        });
    });
}
