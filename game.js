(() => {
  "use strict";

  const COLS = 9;
  const ROWS = 7;
  const BOMB_COUNT = 5;
  const board = document.querySelector("#gameBoard");
  const message = document.querySelector("#gameMessage");
  const bombCount = document.querySelector("#bombCount");
  const lastVowel = document.querySelector("#lastVowel");
  const micStatus = document.querySelector("#micStatus");
  const micBtn = document.querySelector("#micBtn");
  const supportNote = document.querySelector("#supportNote");
  const signalBar = document.querySelector("#signalBar");
  const restartBtn = document.querySelector("#restartBtn");

  let drone = { x: 4, y: 3 };
  let bombs = [];
  let recognition = null;
  let listening = false;
  let audioContext = null;
  let analyser = null;
  let micStream = null;
  let meterFrame = null;
  let roundOver = false;

  const droneIcon = `<svg class="drone" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20 28 28M44 20 36 28M20 44 28 36M44 44 36 36"/><circle cx="16" cy="16" r="8"/><circle cx="48" cy="16" r="8"/><circle cx="16" cy="48" r="8"/><circle cx="48" cy="48" r="8"/><rect x="23" y="23" width="18" height="18" rx="5" fill="#163c40"/><circle cx="32" cy="32" r="3" fill="currentColor"/></g></svg>`;

  function newGame() {
    stopMicrophone();
    drone = { x: 4, y: 3 };
    roundOver = false;
    const positions = new Set([key(drone.x, drone.y)]);
    bombs = [];
    while (bombs.length < BOMB_COUNT) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      const id = key(x, y);
      if (positions.has(id)) continue;
      positions.add(id);
      bombs.push({ x, y, cleared: false, marked: false });
    }
    lastVowel.textContent = "–";
    message.textContent = "Aktiviere das Mikrofon und sprich „A“.";
    micStatus.textContent = "Nicht gestartet";
    micBtn.textContent = "🎙 Mikrofon aktivieren";
    micBtn.classList.remove("listening");
    render();
  }

  function key(x, y) { return `${x},${y}`; }
  function bombAt(x, y) { return bombs.find(b => b.x === x && b.y === y); }
  function activeBombs() { return bombs.filter(b => !b.cleared).length; }

  function render() {
    board.innerHTML = "";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        const bomb = bombAt(x, y);
        if (bomb && !bomb.cleared) {
          if (x === drone.x && y === drone.y) {
            bomb.marked = true;
            tile.classList.add("marked-tile");
            tile.innerHTML = '<span class="bomb bomb-marked" aria-hidden="true">●</span>';
          } else {
            tile.classList.add("bomb-tile");
            tile.innerHTML = '<span class="bomb" aria-hidden="true">●</span>';
          }
        } else if (bomb && bomb.cleared) {
          tile.classList.add("cleared-tile");
          tile.innerHTML = '<span class="cleared" aria-hidden="true">✓</span>';
        }
        if (x === drone.x && y === drone.y) {
          tile.classList.add("drone-tile");
          tile.insertAdjacentHTML("beforeend", droneIcon);
        }
        board.appendChild(tile);
      }
    }
    const done = bombs.filter(b => b.cleared).length;
    bombCount.textContent = `${done} / ${BOMB_COUNT}`;
    if (done === BOMB_COUNT) {
      roundOver = true;
      message.textContent = "Mission erfüllt! Alle Bomben sind entschärft. Starte eine neue Runde.";
    } else {
      const here = bombAt(drone.x, drone.y);
      if (here && !here.cleared) message.textContent = "Bombe gefunden! Sprich „U“, um sie zu entschärfen.";
    }
  }

  function handleVowel(vowel) {
    if (roundOver) return;
    const v = String(vowel).toUpperCase().trim();
    if (!["A", "E", "I", "O", "U"].includes(v)) return;
    lastVowel.textContent = v;
    if (v === "U") {
      const bomb = bombAt(drone.x, drone.y);
      if (bomb && !bomb.cleared) {
        bomb.cleared = true;
        bomb.marked = false;
        message.textContent = "Entschärft! Gute Artikulation – weiter zur nächsten Bombe.";
        render();
      } else {
        message.textContent = "Hier ist keine Bombe. Fliege mit A, E, I oder O weiter.";
      }
      return;
    }
    const moves = { A: [0, -1], E: [1, 0], I: [0, 1], O: [-1, 0] };
    const [dx, dy] = moves[v];
    const nx = Math.max(0, Math.min(COLS - 1, drone.x + dx));
    const ny = Math.max(0, Math.min(ROWS - 1, drone.y + dy));
    if (nx === drone.x && ny === drone.y) {
      message.textContent = "Am Spielfeldrand. Versuche einen anderen Vokal.";
    } else {
      drone = { x: nx, y: ny };
      const bomb = bombAt(drone.x, drone.y);
      message.textContent = bomb && !bomb.cleared
        ? "Bombe gefunden! Ihre Markierung leuchtet. Sprich „U“ zum Entschärfen."
        : `Drohne bewegt sich: ${v}.`;
      render();
    }
  }

  function startMeter(stream) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = new AudioCtx();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const n of data) { const d = (n - 128) / 128; sum += d * d; }
      const rms = Math.sqrt(sum / data.length);
      signalBar.style.width = `${Math.min(100, Math.round(rms * 260))}%`;
      meterFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = "de-CH";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 5;
    r.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Prefer final results; interim results are often unstable and can cause repeated moves.
        if (!result.isFinal) continue;
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript.toLocaleUpperCase("de-CH");
          const vowel = extractVowel(transcript);
          if (vowel) { handleVowel(vowel); break; }
        }
      }
    };
    r.onerror = event => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        message.textContent = "Mikrofonzugriff verweigert. Erlaube ihn in den iPad-Einstellungen für Safari.";
        micStatus.textContent = "Zugriff verweigert";
      } else if (event.error === "network") {
        message.textContent = "Spracherkennung benötigt eine Verbindung. Du kannst alternativ die Vokale antippen.";
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        message.textContent = `Spracherkennung: ${event.error}. Nutze bei Bedarf die Tipp-Steuerung.`;
      }
    };
    r.onend = () => {
      if (listening) {
        try { r.start(); } catch (_) { /* Browser can briefly reject an immediate restart. */ }
      }
    };
    return r;
  }

  function extractVowel(text) {
    const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    // Speech services often return a whole word rather than an isolated vowel.
    // Match explicit vowel names and common short utterance variants.
    const words = normalized.split(/[^A-ZÄÖÜ]+/).filter(Boolean);
    const map = {
      A: ["A", "AH", "AA", "AAA", "HA", "JA"],
      E: ["E", "EH", "EE", "EEE"],
      I: ["I", "IH", "IE", "II", "III"],
      O: ["O", "OH", "OO", "OOO"],
      U: ["U", "UH", "UU", "UUU"]
    };
    for (const word of words) {
      for (const vowel of Object.keys(map)) {
        if (map[vowel].includes(word)) return vowel;
      }
    }
    // Accept a transcript consisting of a single vowel, possibly repeated.
    const compact = normalized.replace(/[^A-Z]/g, "");
    if (/^A{1,4}$/.test(compact)) return "A";
    if (/^E{1,4}$/.test(compact)) return "E";
    if (/^I{1,4}$/.test(compact)) return "I";
    if (/^O{1,4}$/.test(compact)) return "O";
    if (/^U{1,4}$/.test(compact)) return "U";
    return null;
  }

  async function startMicrophone() {
    if (listening) { stopMicrophone(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.textContent = "Dieser Browser erlaubt keinen Mikrofonzugriff. Öffne die Seite über HTTPS oder nutze die Tipp-Steuerung.";
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startMeter(micStream);
      recognition = createRecognition();
      if (!recognition) {
        micStatus.textContent = "Pegel aktiv";
        supportNote.textContent = "Der Mikrofonpegel ist aktiv, aber dieser Browser bietet keine Spracherkennung. Nutze die Vokal-Tasten.";
        message.textContent = "Mikrofon funktioniert. Für automatische Vokalerkennung braucht der Browser SpeechRecognition.";
        micBtn.textContent = "🎙 Mikrofon stoppen";
        micBtn.classList.add("listening");
        listening = true;
        return;
      }
      listening = true;
      recognition.start();
      micStatus.textContent = "Aktiv";
      micBtn.textContent = "🎙 Mikrofon stoppen";
      micBtn.classList.add("listening");
      supportNote.textContent = "Sprich einzelne Vokale deutlich und mit kurzer Pause dazwischen.";
      message.textContent = "Ich höre zu. Sprich „A“, „E“, „I“ oder „O“ zum Fliegen und „U“ zum Entschärfen.";
    } catch (error) {
      const denied = error && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      message.textContent = denied
        ? "Mikrofonzugriff verweigert. Erlaube den Zugriff für Safari und lade die Seite neu."
        : "Mikrofon konnte nicht gestartet werden. Prüfe HTTPS, die Berechtigung und ob das Mikrofon belegt ist.";
      micStatus.textContent = "Nicht verfügbar";
    }
  }

  function stopMicrophone() {
    listening = false;
    if (recognition) {
      const old = recognition;
      recognition = null;
      try { old.onend = null; old.stop(); } catch (_) {}
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }
    if (meterFrame) cancelAnimationFrame(meterFrame);
    meterFrame = null;
    if (audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
    analyser = null;
    signalBar.style.width = "0%";
    micStatus.textContent = "Nicht gestartet";
    micBtn.textContent = "🎙 Mikrofon aktivieren";
    micBtn.classList.remove("listening");
  }

  micBtn.addEventListener("click", startMicrophone);
  restartBtn.addEventListener("click", newGame);
  document.querySelectorAll("[data-vowel]").forEach(button => {
    button.addEventListener("click", () => handleVowel(button.dataset.vowel));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && listening) stopMicrophone();
  });
  newGame();
})();
