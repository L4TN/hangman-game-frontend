document.addEventListener("DOMContentLoaded", function () {
    let loadingText = document.getElementById("loading");
    let baseText = "Esperando por outro Jogador";
    let maxDots = 3;
    let currentDots = 0;

    setInterval(() => {
        currentDots = (currentDots + 1) % (maxDots + 1);
        loadingText.textContent = baseText + ".".repeat(currentDots);
    }, 500);

    const backgroundMusic = new Audio("../../audio/waiting_players_music.mp3");
    const soundToggle = document.getElementById("sound-toggle");
    const soundIcon = document.getElementById("sound-icon");
    let isPlaying = false;

    backgroundMusic.pause();

    soundToggle.addEventListener("click", () => {
        if (isPlaying) {
            backgroundMusic.pause();
            soundIcon.classList.remove("fa-volume-up");
            soundIcon.classList.add("fa-volume-mute");
            isPlaying = false;
        } else {
            backgroundMusic.play().then(() => {
                soundIcon.classList.remove("fa-volume-mute");
                soundIcon.classList.add("fa-volume-up");
                isPlaying = true;
            }).catch(error => {
                console.error("Erro ao tocar o áudio:", error);
                alert("Não foi possível ativar o som. Tente novamente.");
            });
        }
    });

    function simulateClickSequence(element) {
        const events = [
            new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }),
            new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }),
            new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
            new FocusEvent("focus", { bubbles: true, cancelable: true, relatedTarget: window })
        ];

        events.forEach((event, index) => {
            setTimeout(() => element.dispatchEvent(event), index * 100);
        });
    }

    setTimeout(() => {
        simulateClickSequence(soundToggle);
    }, 1000);

    function showGameStartPopup() {
        const popup = document.getElementById("popupGameStart");
        popup.classList.add("visible");

        // Fechar o popup ao clicar no botão
        const closeBtn = popup.querySelector(".btn-close");
        closeBtn.addEventListener("click", () => {
            popup.classList.remove("visible");
            // Qualquer ação adicional após fechar o popup pode ser adicionada aqui
        });
    }

    async function sendStartGameRequest() {
        const Tema_ID = localStorage.getItem("Tema_ID");
        const Nome = localStorage.getItem("Nome");
        const User_ID = localStorage.getItem("User_ID");

        if (!Tema_ID || !Nome || !User_ID) {
            console.error("Dados necessários não encontrados no localStorage.");
            alert("Erro ao iniciar o jogo: dados insuficientes.");
            return;
        }

        console.log("Enviando dados para iniciar o jogo:", { Tema_ID: parseInt(Tema_ID, 10), Nome, User_ID });

        try {
            //http://127.0.0.1:8000/game/start
            //https://hangman-game-backend.onrender.com/game/start
            const response = await fetch("https://hangman-game-backend.onrender.com/game/start", {
                method: "POST",
                headers: {

                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ Tema_ID: parseInt(Tema_ID, 10), Nome, User_ID })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === "Partida criada com sucesso") {
                    // Salvar as informações da partida no localStorage
                    const partidaData = data.partida;
                    for (const [key, value] of Object.entries(partidaData)) {
                        localStorage.setItem(key, value);
                    }

                    console.log("Dados da partida salvos no localStorage:", partidaData);

                    showGameStartPopup(); // Mostra o popup
                    console.log("Redirecionando para o jogo...");
                    window.location.href = "../game/game.html"; // Redireciona para a página do jogo
                } else if (data.message === "O jogador já está em uma partida em andamento neste tema, retomando partida...") {
                    showGameStartPopup(); // Mostra o popup
                    localStorage.setItem("Nome", Nome);
                    console.log("Jogador já em partida, redirecionando...");
                    window.location.href = "../game/game.html"; // Redireciona para a página do jogo
                } else {
                    console.log("Aguardando outro jogador. Repetindo tentativa...");
                    // Retry após 5 segundos
                    setTimeout(sendStartGameRequest, 5000);
                }
            } else {
                console.error("Erro ao iniciar o jogo:", data.message);
                setTimeout(sendStartGameRequest, 5000); // Retry após erro
            }
        } catch (error) {
            console.error("Erro ao enviar requisição para iniciar o jogo:", error);
            alert("Erro ao iniciar o jogo. Tente novamente.");
        }
    }

    // Inicia o loop de requisições
    sendStartGameRequest();
});
