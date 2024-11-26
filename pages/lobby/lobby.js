document.addEventListener("DOMContentLoaded", function () {
  const themeConfig = {
      'default': '../../audio/faroeste.mp3',
      'tema1': '../../audio/natal.mp3',
      'tema2': '../../audio/halloween.mp3',
      'tema3': '../../audio/mar.mp3'
  };

  let currentAudio = new Audio(themeConfig['default']);
  currentAudio.loop = true; // Faz a música tocar em loop
  let isMuted = true; // O áudio começa mutado

  const soundToggle = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");

  // Inicialmente pausa o áudio
  currentAudio.pause();

  // Função para alternar entre som ligado e mudo
  function toggleMute() {
      if (isMuted) {
          currentAudio.play().catch(error => {
              console.error("Erro ao tocar o áudio:", error);
              alert("Clique novamente para ativar o som.");
          });
          soundIcon.classList.remove("fa-volume-mute");
          soundIcon.classList.add("fa-volume-up");
          isMuted = false;
      } else {
          currentAudio.pause();
          soundIcon.classList.remove("fa-volume-up");
          soundIcon.classList.add("fa-volume-mute");
          isMuted = true;
      }
  }

  // Evento de clique no botão de som
  soundToggle.addEventListener("click", toggleMute);

  // Função para trocar o tema e tocar o áudio correspondente
  function changeTheme(theme) {
      const body = document.body;

      // Remove classes de tema existentes
      body.classList.remove("lobby-default", "lobby-tema1", "lobby-tema2", "lobby-tema3");

      // Adiciona a nova classe de tema
      const themeClass = theme === "default" ? "lobby-default" : `lobby-${theme}`;
      body.classList.add(themeClass);

      // Enumeração dos valores possíveis de Tema_ID:
      // 0: Tema Padrão ("lobby-default")
      // 1: Tema 1 ("lobby-tema1")
      // 2: Tema 2 ("lobby-tema2")
      // 3: Tema 3 ("lobby-tema3")
      // Adicione novos temas conforme necessário seguindo este padrão.

      // Salve o tema no localStorage, armazenando apenas números para Tema_ID
      if (themeClass) {
        const temaID = theme === "default" ? 0 : parseInt(theme.replace("tema", ""), 10);
        localStorage.setItem("Tema_ID", temaID);
      }


      // Pausa e reinicia o áudio atual
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
      }

      // Configura o novo áudio
      const audioPath = themeConfig[theme];
      if (audioPath) {
          currentAudio = new Audio(audioPath);
          currentAudio.loop = true;

          // Reproduz o áudio se não estiver mutado
          if (!isMuted) {
              currentAudio.play().catch(error => {
                  console.error("Erro ao tocar o áudio:", error);
              });
          }
      }
  }

  // Configuração dos botões de tema
  document.querySelectorAll(".theme-option").forEach(button => {
      button.addEventListener("click", function () {
          const theme = button.getAttribute("data-theme");
          changeTheme(theme);
      });
  });

  // Simula clique no botão para tocar o áudio padrão ao carregar
  setTimeout(() => {
      const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
      });
      soundToggle.dispatchEvent(clickEvent);
  }, 1000); // Aguarda 1 segundo antes de disparar o evento
});

localStorage.setItem("Tema_ID", 0);


document
  .getElementById("btn-selecionartema")
  .addEventListener("click", function() {
    document.getElementById("theme-selector").classList.remove("hidden");
  });

function closeThemeSelector() {
  document.getElementById("theme-selector").classList.add("hidden");
}

// Função para mudar o tema do lobby
function changeTheme(theme) {
  const body = document.body;
  // Remove classes de tema existentes
  body.classList.remove(
    "lobby-default",
    "lobby-tema1",
    "lobby-tema2",
    "lobby-tema3"
  );

  // Adiciona a nova classe de tema; se for "default", usa "lobby-default"
  const themeClass = theme === "default" ? "lobby-default" : `lobby-${theme}`;
  body.classList.add(themeClass);
  // Fecha o modal após a seleção
  closeThemeSelector();
}

// Evento para cada botão de tema no modal
document.querySelectorAll(".theme-option").forEach(button => {
  button.addEventListener("click", function() {
    const theme = button.getAttribute("data-theme");
    changeTheme(theme);
  });
});

// Adiciona event listeners aos botões de tema
document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
      const temaSelecionado = button.getAttribute("data-theme");
      localStorage.setItem("tema", temaSelecionado); // Salva o tema no localStorage
    });
  });

function openUserConfigModal() {
  document.getElementById("user-config-modal").classList.remove("hidden");
  document.querySelector(".modal-overlay").classList.remove("hidden");
}

function closeUserConfigModal() {
  document.getElementById("user-config-modal").classList.add("hidden");
  document.querySelector(".modal-overlay").classList.add("hidden");
}

document.querySelector(".modal-overlay").addEventListener("click", function(event) {
  if (!document.getElementById("user-modal-content").contains(event.target)) {
    closeUserConfigModal();
  }
});

function openModal() {
  document.querySelector(".modal").classList.remove("hidden");
  document.querySelector(".modal-overlay").classList.remove("hidden"); 
}

function closeModal() {
  document.getElementById("config-modal").classList.add("hidden");
  document.querySelector(".modal-overlay").classList.add("hidden");
}

function exitGame() {
  localStorage.clear();
  window.location.href = "../home/home.html";
}

document.getElementById("btn-config").addEventListener("click", () => {
  const configModal = document.getElementById("config-modal");
  configModal.classList.remove("hidden");
});

document.getElementById("btn-jogar").addEventListener("click", () => {
  window.location.href = "../waiting_for_players/waiting_for_players.html";
});

function closeConfigModal() {
  document.getElementById("config-modal").classList.add("hidden");
}

function openShopModal() {
  document.getElementById("shop-modal").style.display = "flex";
}

function closeShopModal() {
  document.getElementById("shop-modal").style.display = "none";
}

window.onclick = function(event) {
  const modal = document.getElementById("shop-modal");
  if (event.target === modal) {
    closeShopModal();
  }
};

window.onclick = function(event) {
  const modal = document.getElementById("user-config-modal");
  if (event.target === modal) {
    closeUserConfigModal();
  }
};

function changeUserIcon(iconSrc) {

  if(iconSrc === "../../img/usuario_sem_fundo.png")
    return

  const userIcons = document.querySelectorAll('.user-icon, .img-usuario, .img-usuario-dialog, #user-icon');
  userIcons.forEach(icon => {
    icon.src = iconSrc;
  });
}

