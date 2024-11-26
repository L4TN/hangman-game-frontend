function showPopup(title, message) {
    const popup = document.getElementById("popupSuccess");
    const userNameElement = document.getElementById("userName");
    userNameElement.textContent = message;
    popup.querySelector("h2").textContent = title;
    popup.classList.add("visible");

    const closeBtn = popup.querySelector(".btn-close");
    closeBtn.addEventListener("click", () => {
        popup.classList.remove("visible");
    });
}

document.getElementById("btn-login").addEventListener("click", async function (event) {
    event.preventDefault();

    const Nome = document.getElementById("login").value;
    const Senha = document.getElementById("senha").value;

    if (!Nome || !Senha) {
        showPopup("Erro", "Por favor, preencha todos os campos.");
        return;
    }

    try {

        //http://127.0.0.1:8000/usuarios/login
        //https://hangman-game-backend.onrender.com/usuarios/login
        const response = await fetch("http://127.0.0.1:8000/usuarios/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ Nome, Senha }),
        });
        
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            const errorDetails = await response.text();
            console.error(`Details: ${errorDetails}`);
        }
        

        const data = await response.json();

        if (response.ok) {
            // Salvar os campos retornados no localStorage
            if (data.data) {
                for (const [key, value] of Object.entries(data.data)) {
                    localStorage.setItem(key, value);
                }
            }

            window.location.href = "../lobby/lobby.html";

            //TODO FIX
            // // Mostrar popup estilizado
            // const popup = document.getElementById("popupSuccess");
            // const userNameElement = document.getElementById("userName");
            // popup.classList.add("popup-content");
            // userNameElement.textContent = Nome;
            // console.log("Exibindo popup de sucesso");
            // popup.classList.add("visible");

            // // Fechar popup e redirecionar
            // const closeBtn = popup.querySelector(".btn-close");
            // closeBtn.addEventListener("click", () => {
            //     popup.classList.remove("visible");
            //     window.location.href = "../lobby/lobby.html";
            // });


            //apos 5s vamos redirecionar de qq jeito a ../lobby/lobby.html


        } else {
            showPopup("Erro", data.message); // Erro no login
        }
    } catch (error) {
        console.error("Erro ao conectar ao backend:", error);
        showPopup("Erro", "Erro ao tentar conectar ao servidor. Tente novamente.");
    }
});
