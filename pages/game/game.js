// gameCore.js

document.addEventListener("DOMContentLoaded", function () {
  let socket;
  let sessionId;
  let playerId;
  let playerIndex = null; // Índice do jogador (0 ou 1)
  let timerInterval = null;
  let isPlaying = false;
  let musicaAtual = null;
  const soundToggle = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");

  // Definindo as músicas para cada tema
  const musicas = {
      "0": new Audio("../../audio/faroeste.mp3"),
      "1": new Audio("../../audio/natal.mp3"),
      "2": new Audio("../../audio/halloween.mp3"),
      "3": new Audio("../../audio/mar.mp3")
  };

  // Sons de acerto e erro
  const correctSound = new Audio("../../audio/correct.mp3");
  const wrongSound = new Audio("../../audio/wrong.mp3");

  // Variáveis para armazenar o estado anterior do jogo
  let previousPartialWord = null;
  let previousLives = null;

  // Inicializa os valores de session_id e player_id
  function initializeGame() {
      sessionId = localStorage.getItem("Tema_ID") || "1"; // Tema_ID como session_id (padrão: "1")
      playerId = localStorage.getItem("User_ID") || `player${Math.floor(Math.random() * 1000)}`; // User_ID ou ID gerado automaticamente

      // Tenta recuperar o playerIndex do localStorage
      const storedPlayerIndex = localStorage.getItem("playerIndex");
      if (storedPlayerIndex !== null) {
          playerIndex = parseInt(storedPlayerIndex, 10);
          console.log(`Recuperado playerIndex do localStorage: ${playerIndex}`);
      } else {
          console.log('playerIndex não encontrado no localStorage');
      }

      console.log(`Session ID: ${sessionId}, Player ID: ${playerId}`);

      updatePlayerName();

      // Inicia conexão WebSocket
      connectWebSocket();

      // Configurações de tema e música
      setupThemeAndMusic();

      // Configura eventos de UI
      setupUIEvents();
  }

  // Atualiza o nome do jogador na UI
  function updatePlayerName() {
      const playerNameElement = document.querySelector(".player-name");
      const storedName = localStorage.getItem("Nome") || "Jogador";
      if (playerNameElement) {
          playerNameElement.textContent = storedName;
      } else {
          console.warn("Elemento com a classe 'player-name' não encontrado.");
      }
  }

  // Exibe qual jogador você é (Player 1 ou Player 2)
  function displayPlayerNumber() {
      const playerNumberElement = document.getElementById("player-number");
      if (playerNumberElement) {
          if (playerIndex !== null) {
              const playerNumber = playerIndex + 1; // playerIndex é 0 ou 1
              playerNumberElement.textContent = `PLAYER - ${playerNumber}`;
          } else {
              playerNumberElement.textContent = "Identificando jogador...";
          }
      } else {
          console.warn("Elemento com o ID 'player-number' não encontrado.");
      }
  }

  // Configura o tema e a música
  function setupThemeAndMusic() {
      const temaSalvo = sessionId; // Usando o sessionId como tema
      alterarFundo(temaSalvo);
      alterarFundoModal(temaSalvo);
      mostrarTemaVigente(temaSalvo);
      changeTheme(temaSalvo);
  }

  // Estabelece a conexão com WebSocket
  function connectWebSocket() {
      socket = new WebSocket("wss://hangman-game-backend.onrender.com");

      socket.onopen = () => {
          console.log("Conexão WebSocket estabelecida");

          // Envia o comando inicial para o servidor
          sendInitialCommand();
      };

      socket.onmessage = (event) => {
          if (!event.data) {
              console.warn("Resposta vazia recebida. Tentando reconectar...");
              reconnectWebSocket();
              return;
          }

          const message = JSON.parse(event.data);
          handleServerMessage(message);
      };

      socket.onclose = () => {
          console.log("Conexão WebSocket encerrada");
          setTimeout(connectWebSocket, 3000); // Tenta reconectar após 3 segundos
      };

      socket.onerror = (error) => {
          console.error("Erro no WebSocket:", error);
      };
  }

  // Reenvia o comando inicial caso a resposta seja vazia ou ocorra desconexão
  function reconnectWebSocket() {
      console.log("Tentando reconectar...");
      setTimeout(() => {
          if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
              connectWebSocket();
          }
      }, 1000); // Tenta reconectar após 1 segundo
  }

  // Envia o comando inicial para o servidor
  function sendInitialCommand() {
      const initialCommand = {
          type: "join",
          session_id: sessionId,
          player_id: playerId,
      };

      if (socket.readyState === WebSocket.OPEN) {
          console.log("Enviando comando inicial:", initialCommand);
          socket.send(JSON.stringify(initialCommand));
      } else {
          console.warn("WebSocket não está pronto. Tentando novamente...");
          setTimeout(sendInitialCommand, 1000); // Tenta enviar novamente após 1 segundo
      }
  }

  // Manipula mensagens recebidas do servidor
  function handleServerMessage(message) {
      switch (message.type) {
          case "wait":
              console.log(message.message); // "Aguardando outro jogador"
              if (message.player_index !== undefined) {
                  playerIndex = message.player_index;
                  // Salva o playerIndex no localStorage
                  localStorage.setItem("playerIndex", playerIndex);
                  // Exibe mensagem na UI
                  showWaitingMessage(message.message);
                  // Atualiza o número do jogador na UI
                  displayPlayerNumber();
              }
              break;
          case "game_state":
              // Atualiza o playerIndex se ainda não tiver sido definido
              if (playerIndex === null && message.player_index !== undefined) {
                  playerIndex = message.player_index;
                  // Salva o playerIndex no localStorage
                  localStorage.setItem("playerIndex", playerIndex);
                  // Atualiza o número do jogador na UI
                  displayPlayerNumber();
              }
              updateGameUI(message);
              break;
          case "guess_result":
              handleGuessResult(message);
              break;
          case "game_over":
              handleGameOver(message);
              // Após o fim do jogo, podemos limpar o playerIndex do localStorage
              localStorage.removeItem("playerIndex");
              break;
          case "error":
              console.error("Erro do servidor:", message.message);
              showMessage("Erro: " + message.message);
              break;
          case "confuse":
              handleConfuseEffect();
              break;
          default:
              console.warn("Mensagem desconhecida:", message);
              break;
      }
  }

  // Função para manipular o resultado do palpite
  function handleGuessResult(message) {
      if (message.player_id === playerId) {
          // É o nosso palpite
          if (message.correct) {
              correctSound.play();
          } else {
              wrongSound.play();
          }
      } else {
          // Palpite do outro jogador
          // Opcionalmente, você pode adicionar alguma lógica aqui
      }
  }

  // Atualiza os componentes da interface com o estado do jogo
  function updateGameUI(gameState) {
      // Verifica se temos o estado anterior para comparar
      if (previousPartialWord !== null && previousLives !== null) {
          // Verifica se é o nosso turno
          const currentPlayer = parseInt(localStorage.getItem("currentPlayer"), 10);
          if (currentPlayer === playerIndex) {
              // É o nosso turno; verifica se a palavra mudou
              if (gameState.word !== previousPartialWord) {
                  // A palavra mudou; provavelmente acertamos
                  correctSound.play();
              } else if (gameState.lives[playerIndex] < previousLives) {
                  // Nossas vidas diminuíram; provavelmente erramos
                  wrongSound.play();
              }
          }
      }

      // Atualiza a palavra parcial
      updateWordDisplay(gameState.word);

      // Atualiza vidas dos jogadores
      updateLivesDisplay(gameState.lives);

      // Atualiza o indicador de turno
      atualizarTurno(gameState.current_player);

      // Atualiza os poderes disponíveis
      updatePowersDisplay(gameState.powers);

      // Atualiza o cronômetro
      updateTimer(gameState.time_left);

      // Atualiza o teclado (letras já usadas)
      updateKeyboard(gameState.used_letters);

      // Habilita ou desabilita os controles com base no turno
      if (gameState.current_player === playerIndex) {
          enableKeyboard();
          enablePowers();
      } else {
          disableKeyboard();
          disablePowers();
      }

      // Armazena o estado atual para a próxima comparação
      previousPartialWord = gameState.word;
      previousLives = gameState.lives[playerIndex];
  }

  // Atualiza a exibição da palavra
  function updateWordDisplay(partialWord) {
      const palavraContainer = document.getElementById("palavra-container");
      palavraContainer.innerHTML = ''; // Limpa o conteúdo anterior

      // Supondo que partialWord seja uma string com espaços entre as letras
      const letters = partialWord.split(' ');

      letters.forEach((letter) => {
          const letterElement = document.createElement('span');
          letterElement.classList.add('letter');
          letterElement.textContent = letter.toUpperCase(); // Exibe a letra ou '_'
          palavraContainer.appendChild(letterElement);
      });
  }

  // Atualiza as vidas dos jogadores e exibe os erros
  function updateLivesDisplay(lives) {
      // Número total de vidas (por padrão, 5)
      const totalLives = 5;

      // Vidas do jogador atual
      const playerLives = lives[playerIndex];

      // Calcula o número de erros cometidos
      const errorsMade = totalLives - playerLives;

      // Atualiza a imagem da forca
      updateHangmanImage(errorsMade);

      // Atualiza a exibição de vidas na UI
      document.getElementById("poder-vida").textContent = `x${playerLives} Vidas`;

      // Atualiza a exibição dos erros na UI
      const errorsDisplay = document.getElementById("errors-display");
      if (errorsDisplay) {
          errorsDisplay.textContent = `Erros: ${errorsMade} / ${totalLives}`;
      } else {
          console.warn("Elemento com id 'errors-display' não encontrado.");
      }
  }

  // Atualiza a imagem da forca
  function updateHangmanImage(errors) {
      // Mostra a imagem correspondente ao número de erros
      for (let i = 1; i <= 6; i++) {
          const forcaImg = document.getElementById(`forca${i}`);
          if (forcaImg) {
              if (i === errors + 1) {
                  forcaImg.style.display = 'block';
              } else {
                  forcaImg.style.display = 'none';
              }
          }
      }
  }

  // Atualiza o indicador de turno
  function atualizarTurno(currentPlayerIndex) {
      const turnoIndicador = document.getElementById("turno-indicador");
      turnoIndicador.textContent = `Turno do Jogador ${currentPlayerIndex + 1}`;

      // Salva o jogador atual no localStorage
      localStorage.setItem("currentPlayer", currentPlayerIndex);

      // Comparar o índice do jogador atual com o índice do jogador armazenado
      if (currentPlayerIndex === playerIndex) {
          enableKeyboard();
          enablePowers();
      } else {
          disableKeyboard();
          disablePowers();
      }
  }

  // Habilita o teclado
  function enableKeyboard() {
      document.querySelectorAll(".key").forEach((button) => {
          if (!button.classList.contains("used-letter")) {
              button.disabled = false;
          }
      });
  }

  // Desabilita o teclado
  function disableKeyboard() {
      document.querySelectorAll(".key").forEach((button) => {
          button.disabled = true;
      });
  }

  // Habilita os poderes
  function enablePowers() {
      document.querySelectorAll(".poder-img").forEach((img) => {
          img.style.pointerEvents = "auto";
          img.style.opacity = "1";
      });
  }

  // Desabilita os poderes
  function disablePowers() {
      document.querySelectorAll(".poder-img").forEach((img) => {
          img.style.pointerEvents = "none";
          img.style.opacity = "0.5";
      });
  }

  // Atualiza os poderes disponíveis
  function updatePowersDisplay(powers) {
      // Atualiza as quantidades dos poderes na UI
      const playerPowers = powers[playerIndex];

      document.getElementById("poder-vida").textContent = `x${playerPowers.heal} Vidas`;
      document.getElementById("poder-dica").textContent = `x${playerPowers.hint} Dicas`;
      document.getElementById("poder-distracao").textContent = `x${playerPowers.confuse || 0} Distração`;
      // Atualize outros poderes conforme necessário

      // Desabilita o botão de distração se não houver mais poderes
      const confuseButton = document.querySelector(".poder-img[onclick*='usePower(\"confuse\")']");
      if (confuseButton) {
          if (playerPowers.confuse <= 0) {
              confuseButton.style.opacity = "0.5";
              confuseButton.style.pointerEvents = "none";
          } else {
              confuseButton.style.opacity = "1";
              confuseButton.style.pointerEvents = "auto";
          }
      }
  }

  // Atualiza o cronômetro
  function updateTimer(timeLeft) {
      const timerElement = document.getElementById("timer");

      if (timerInterval) {
          clearInterval(timerInterval);
      }

      const endTime = Date.now() + timeLeft * 1000;

      timerInterval = setInterval(() => {
          const now = Date.now();
          const remainingTime = Math.max(0, endTime - now);
          const seconds = Math.ceil(remainingTime / 1000);

          const minutes = Math.floor(seconds / 60);
          const secs = seconds % 60;

          timerElement.textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

          if (remainingTime <= 0) {
              clearInterval(timerInterval);
          }
      }, 1000);
  }

  // Atualiza o teclado virtual com base nas letras usadas
  function updateKeyboard(usedLetters) {
      document.querySelectorAll(".key").forEach((button) => {
          const letter = button.textContent.toLowerCase();
          if (usedLetters.includes(letter)) {
              button.disabled = true;
              button.classList.add("used-letter");
          } else {
              button.classList.remove("used-letter");
              // Habilita ou desabilita o botão com base no turno
              button.disabled = !isMyTurn();
          }
      });
  }

  // Verifica se é a vez do jogador atual
  function isMyTurn() {
      const currentPlayer = parseInt(localStorage.getItem("currentPlayer"), 10);
      return currentPlayer === playerIndex;
  }

  // Manipula o fim do jogo
  function handleGameOver(gameOverData) {
      console.log("Jogo Encerrado:", gameOverData.reason);

      // Exibe o modal de vitória, derrota ou empate
      const vitoriaModal = document.getElementById("vitoria-modal");
      const resultadoElement = vitoriaModal.querySelector(".vitoria-ou-derrota");
      const tempoElement = document.getElementById("tempo-partida");

      if (gameOverData.winner === playerIndex) {
          resultadoElement.src = "../../img/palavra_vitoria.png"; // Imagem de vitória
      } else if (gameOverData.winner === null) {
          resultadoElement.src = "../../img/palavra_empate.png"; // Imagem de empate
      } else {
          resultadoElement.src = "../../img/palavra_derrota.png"; // Imagem de derrota
      }

      tempoElement.textContent = `Tempo decorrido: ${formatTime(gameOverData.time_left)}`;

      vitoriaModal.classList.remove("hidden");

      // Desabilita o teclado e os poderes
      disableKeyboard();
      disablePowers();

      // Limpa o playerIndex do localStorage
      localStorage.removeItem("playerIndex");
  }

  // Formata o tempo em minutos e segundos
  function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Manipula o efeito de confusão
  function handleConfuseEffect() {
      // Cria um overlay
      const overlay = document.createElement('div');
      overlay.id = 'confuse-overlay';

      // Cria o elemento de imagem para o GIF
      const gifImage = document.createElement('img');
      gifImage.src = '../../img/meme.gif'; // Caminho para o meme.gif
      gifImage.alt = 'Confuse Effect';
      gifImage.id = 'confuse-gif';

      // Adiciona a imagem ao overlay
      overlay.appendChild(gifImage);

      // Adiciona o overlay ao body
      document.body.appendChild(overlay);

      // Remove o overlay após 5 segundos
      setTimeout(() => {
          if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
          }
      }, 5000); // Exibe por 5 segundos
  }

  // Função para mostrar a mensagem de espera
  function showWaitingMessage(message) {
      const turnoIndicador = document.getElementById("turno-indicador");
      turnoIndicador.textContent = message;

      // Desabilita os controles enquanto espera
      disableKeyboard();
      disablePowers();
  }

  // Exibe mensagens ao usuário
  function showMessage(message) {
      // Você pode implementar uma função para exibir mensagens na interface
      alert(message);
  }

  // Envia a letra selecionada para o servidor
  window.selectLetter = function (letter) {
      if (socket && socket.readyState === WebSocket.OPEN) {
          const message = {
              session_id: sessionId,
              player_id: playerId,
              type: "guess",
              letter: letter.toLowerCase()
          };
          socket.send(JSON.stringify(message));

          // Desabilita o botão após o clique
          const button = Array.from(document.querySelectorAll('.key')).find(btn => btn.textContent === letter);
          if (button) {
              button.disabled = true;
              button.classList.add("used-letter");
          }

          // Desabilita o teclado após a jogada
          disableKeyboard();
      } else {
          console.error("WebSocket não está conectado.");
      }
  };

  // Envia o uso de um poder para o servidor
  window.usePower = function (powerName) {
      if (socket && socket.readyState === WebSocket.OPEN) {
          const message = {
              session_id: sessionId,
              player_id: playerId,
              type: "use_power",
              power: powerName === 'distraction' ? 'confuse' : powerName // Mapeia 'distraction' para 'confuse'
          };
          socket.send(JSON.stringify(message));

          // Desabilita os poderes após o uso, se desejar
          // Você pode atualizar a UI após receber a resposta do servidor
      } else {
          console.error("WebSocket não está conectado.");
      }
  };

  // Configura eventos de UI
  function setupUIEvents() {
      // Botão de som
      soundToggle.addEventListener("click", () => {
          if (isPlaying) {
              musicaAtual.pause();
              soundIcon.classList.remove("fa-volume-up");
              soundIcon.classList.add("fa-volume-mute");
              isPlaying = false;
          } else {
              musicaAtual.play().then(() => {
                  soundIcon.classList.remove("fa-volume-mute");
                  soundIcon.classList.add("fa-volume-up");
                  isPlaying = true;
              }).catch(error => {
                  console.error("Erro ao tocar o áudio:", error);
                  alert("Não foi possível ativar o som. Tente novamente.");
              });
          }
      });

      // Botão de configuração
      document.getElementById("btn-config").addEventListener("click", () => {
          document.getElementById("config-modal").classList.remove("hidden");
      });

      // Botão para fechar o modal de configuração
      window.closeConfigModal = function () {
          document.getElementById("config-modal").classList.add("hidden");
      };

      // Botão para sair do jogo
      window.exitGame = function () {
          if (socket && socket.readyState === WebSocket.OPEN) {
              socket.close();
          }
          window.location.href = "../../index.html";
      };

      // Botões do modal de vitória/derrota
      document.getElementById("jogar-novamente").addEventListener("click", () => {
          // Reinicia o jogo
          location.reload();
      });

      document.getElementById("sair-jogo").addEventListener("click", () => {
          window.exitGame();
      });
  }

  // Função para alterar o tema e a música
  function changeTheme(theme) {
      const body = document.body;
      body.classList.remove('lobby-default', 'lobby-tema1', 'lobby-tema2', 'lobby-tema3');
      const themeClass = theme === '0' ? 'lobby-default' : `lobby-tema${theme}`;
      body.classList.add(themeClass);

      // Troca a música
      if (musicaAtual) {
          musicaAtual.pause();
          musicaAtual.currentTime = 0;
      }
      musicaAtual = musicas[theme] || musicas["0"];

      if (isPlaying) {
          musicaAtual.play().catch(error => {
              console.error("Erro ao tocar o áudio:", error);
          });
      }
  }

  // Função para alterar o fundo com base no tema
  function alterarFundo(tema) {
      const body = document.body;
      let imagemFundo;

      switch (tema) {
          case "0":
              imagemFundo = "url('../../img/fundo_faroesteGame.png')";
              break;
          case "1":
              imagemFundo = "url('../../img/fundo_natalGame.png')";
              break;
          case "2":
              imagemFundo = "url('../../img/fundo_halloweenGame.png')";
              break;
          case "3":
              imagemFundo = "url('../../img/fundo_marGame.png')";
              break;
          default:
              imagemFundo = "url('../../img/fundo_faroesteGame.png')";
              break;
      }

      // Aplica o estilo no body
      body.style.backgroundImage = imagemFundo;
      body.style.backgroundSize = "cover";
      body.style.backgroundRepeat = "no-repeat";
      body.style.backgroundPosition = "center";
  }

  // Função para alterar o fundo da tela de vitória ou derrota com base no tema
  function alterarFundoModal(tema) {
      const modalVitoriaDerrota = document.querySelectorAll(".modal-content");
      let imagemFundoModal;

      switch (tema) {
          case "0":
              imagemFundoModal = "url('../../img/fundo_faroesteGame.png')";
              break;
          case "1":
              imagemFundoModal = "url('../../img/fundo_vitoria_natal.jpg')";
              break;
          case "2":
              imagemFundoModal = "url('../../img/fundo_vitoria_halloween.jpg')";
              break;
          case "3":
              imagemFundoModal = "url('../../img/fundo_vitoria_mar.jpg')";
              break;
          default:
              imagemFundoModal = "url('../../img/fundo_vitoria_padrao.jpg')";
              break;
      }

      // Aplica o estilo de fundo para todas as telas de vitória/derrota
      modalVitoriaDerrota.forEach((modal) => {
          modal.style.backgroundImage = imagemFundoModal;
          modal.style.backgroundSize = "cover";
          modal.style.backgroundRepeat = "no-repeat";
          modal.style.backgroundPosition = "center";
      });
  }

  // Função para mostrar o tema vigente
  function mostrarTemaVigente(tema) {
      // Mapeia os IDs dos temas com suas divs correspondentes
      const temas = {
          "0": "tema-faroeste",
          "1": "tema-natal",
          "2": "tema-halloween",
          "3": "tema-mar"
      };

      // Remove a classe `hidden` apenas do tema correspondente
      Object.keys(temas).forEach(key => {
          const temaDiv = document.getElementById(temas[key]);
          if (temaDiv) {
              if (key === tema) {
                  temaDiv.classList.remove("hidden");
              } else {
                  temaDiv.classList.add("hidden");
              }
          } else {
              console.warn(`Elemento com ID ${temas[key]} não encontrado.`);
          }
      });
  }

  // Inicializa o jogo
  initializeGame();
});
