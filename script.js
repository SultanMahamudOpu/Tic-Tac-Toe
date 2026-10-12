(() => {
  const $ = (selector) => document.querySelector(selector);
  const cells = [...document.querySelectorAll('.cell')];
  const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const state = {
    board: Array(9).fill(''), mode: 'ai', difficulty: 'hard', current: 'X',
    active: false, busy: false, scores: { X: 0, O: 0, draw: 0 },
    history: [], games: 0, sound: true, finished: false
  };
  let toastTimer, audioContext;

  function sound(type) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioContext, osc = ctx.createOscillator(), gain = ctx.createGain();
      const tones = { move: [type === 'X' ? 480 : 620, .075], win: [760, .18], draw: [330, .14], click: [540, .05] };
      const [freq, duration] = tones[type] || tones.click;
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (type === 'win') osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + duration);
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.09, ctx.currentTime + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration + .02);
    } catch (_) { /* Audio is optional; gameplay still works if unavailable. */ }
  }

  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function getWinner(board = state.board) {
    for (const line of WIN_LINES) if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[1]] === board[line[2]]) return { player: board[line[0]], line };
    return null;
  }
  const isFull = (board = state.board) => board.every(Boolean);
  const available = (board = state.board) => board.map((v, i) => v ? -1 : i).filter(i => i >= 0);

  function render() {
    cells.forEach((cell, i) => {
      const mark = state.board[i];
      cell.textContent = mark === 'X' ? '×' : mark === 'O' ? '○' : '';
      cell.classList.toggle('taken', Boolean(mark));
      cell.classList.toggle('x', mark === 'X');
      cell.classList.toggle('o', mark === 'O');
      cell.classList.remove('winning');
      cell.disabled = !state.active || state.busy || Boolean(mark);
      cell.setAttribute('aria-label', `${['Top left','Top middle','Top right','Middle left','Center','Middle right','Bottom left','Bottom middle','Bottom right'][i]}, ${mark || 'empty'}`);
    });
    const winner = getWinner();
    if (winner) winner.line.forEach(i => cells[i].classList.add('winning'));
    $('#playerXScore').textContent = state.scores.X;
    $('#playerOScore').textContent = state.scores.O;
    $('#winsCount').textContent = state.scores.X;
    $('#lossesCount').textContent = state.scores.O;
    $('#drawsCount').textContent = state.scores.draw;
    $('#gamesCount').textContent = state.games;
    const rate = state.games ? Math.round(state.scores.X / state.games * 100) : 0;
    $('#winRate').innerHTML = `${rate}<span>%</span>`;
    $('#winProgress').style.width = `${rate}%`;
    $('#winRateCaption').textContent = state.games ? (rate >= 70 ? 'On fire!' : rate >= 40 ? 'Getting stronger' : 'Keep practicing!') : 'Keep playing!';
    $('#playerXCard').classList.toggle('active-player', state.active && state.current === 'X');
    $('#playerOCard').classList.toggle('active-player', state.active && state.current === 'O');
    $('#headerMode').textContent = state.mode === 'ai' ? 'AI CHALLENGE' : 'FRIEND BATTLE';
    $('#playerXName').textContent = state.mode === 'ai' ? 'YOU' : 'PLAYER 1';
    $('#playerOName').textContent = state.mode === 'ai' ? 'AI BOT' : 'PLAYER 2';
    $('#playerXCard').querySelector('small').textContent = 'PLAYER ONE';
    $('#playerOCard').querySelector('small').textContent = 'PLAYER TWO';
    const badge = $('#turnBadge');
    if (!state.active) { badge.innerHTML = '<span class="turn-dot"></span> READY'; }
    else if (state.busy) { badge.innerHTML = '<span class="turn-dot o-dot"></span> AI THINKING'; }
    else { badge.innerHTML = `<span class="turn-dot ${state.current === 'O' ? 'o-dot' : ''}"></span> ${state.current === 'X' ? (state.mode === 'ai' ? 'YOUR TURN' : 'PLAYER 1') : (state.mode === 'ai' ? 'AI TURN' : 'PLAYER 2')}`; }
    const recent = $('#momentum'); recent.innerHTML = '';
    if (!state.history.length) recent.innerHTML = '<span class="momentum-empty">Your story starts here.</span>';
    else state.history.slice(-7).forEach(item => { const span = document.createElement('span'); span.className = `momentum-item ${item}`; span.textContent = item === 'win' ? '✓' : item === 'loss' ? '×' : '＝'; span.title = item; recent.appendChild(span); });
    if (!state.games) { $('#achievementTitle').textContent = 'First steps'; $('#achievementText').textContent = 'Play your first match to start your streak.'; }
    else if (state.scores.X >= 5) { $('#achievementTitle').textContent = 'Arcade legend'; $('#achievementText').textContent = 'Five wins in the bag. You are a force.'; }
    else if (state.scores.X > state.scores.O) { $('#achievementTitle').textContent = 'On a roll'; $('#achievementText').textContent = 'You are ahead. Keep the momentum going.'; }
    else { $('#achievementTitle').textContent = 'The comeback'; $('#achievementText').textContent = 'Every match is a fresh chance to shine.'; }
  }

  function startGame() {
    state.board = Array(9).fill(''); state.current = 'X'; state.active = true; state.busy = false; state.finished = false;
    $('#matchTitle').textContent = 'Your move, legend.';
    $('#gameStatus').innerHTML = '<span class="status-star">✦</span> Ready when you are';
    render();
  }
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-option').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    $('#difficultyGroup').hidden = mode !== 'ai';
    startGame();
    showToast(mode === 'ai' ? 'AI challenge selected. Good luck!' : 'Friend battle selected. Pass the device!');
  }
  function setDifficulty(level) {
    state.difficulty = level;
    document.querySelectorAll('.difficulty-option').forEach(btn => btn.classList.toggle('selected', btn.dataset.difficulty === level));
    $('#difficultyValue').textContent = ({ easy: 'BEGINNER', medium: 'INTERMEDIATE', hard: 'EXPERT' })[level];
    showToast(`${$('#difficultyValue').textContent.charAt(0) + $('#difficultyValue').textContent.slice(1).toLowerCase()} difficulty selected`);
  }
  function playMove(index, player) {
    if (!state.active || state.board[index]) return false;
    state.board[index] = player; sound(player); render();
    const result = getWinner();
    if (result) { finish(player, result.line); return true; }
    if (isFull()) { finish('draw'); return true; }
    state.current = player === 'X' ? 'O' : 'X';
    if (state.mode === 'ai' && state.current === 'O') {
      state.busy = true; $('#matchTitle').textContent = 'AI is thinking…'; $('#gameStatus').innerHTML = '<span class="status-star">✦</span> Calculating next move'; render();
      setTimeout(aiMove, state.difficulty === 'easy' ? 350 : state.difficulty === 'medium' ? 650 : 850);
    } else {
      $('#matchTitle').textContent = state.mode === 'ai' ? 'Your turn, legend.' : `${state.current === 'X' ? 'Player 1' : 'Player 2'}’s turn`;
      $('#gameStatus').innerHTML = `<span class="status-star">✦</span> ${state.mode === 'ai' ? 'Make it count' : `It’s ${state.current === 'X' ? 'Player 1' : 'Player 2'}’s move`}`;
      render();
    }
    return true;
  }
  function aiMove() {
    if (!state.active || state.mode !== 'ai') return;
    state.busy = false;
    let move;
    if (state.difficulty === 'easy') move = available().at(Math.floor(Math.random() * available().length));
    else if (state.difficulty === 'medium' && Math.random() < .38) { const moves = available(); move = moves[Math.floor(Math.random() * moves.length)]; }
    else move = bestMove();
    if (move !== undefined && move !== null) playMove(move, 'O');
  }
  function minimax(board, isMax, depth, alpha, beta) {
    const winner = getWinner(board);
    if (winner?.player === 'O') return 10 - depth;
    if (winner?.player === 'X') return depth - 10;
    if (isFull(board)) return 0;
    if (isMax) {
      let best = -Infinity;
      for (const i of available(board)) { board[i] = 'O'; best = Math.max(best, minimax(board, false, depth + 1, alpha, beta)); board[i] = ''; alpha = Math.max(alpha, best); if (beta <= alpha) break; }
      return best;
    }
    let best = Infinity;
    for (const i of available(board)) { board[i] = 'X'; best = Math.min(best, minimax(board, true, depth + 1, alpha, beta)); board[i] = ''; beta = Math.min(beta, best); if (beta <= alpha) break; }
    return best;
  }
  function bestMove() {
    let best = -Infinity, move = null;
    for (const i of available()) { state.board[i] = 'O'; const score = minimax(state.board, false, 0, -Infinity, Infinity); state.board[i] = ''; if (score > best) { best = score; move = i; } }
    return move;
  }
  function finish(result, line = []) {
    state.active = false; state.busy = false; state.finished = true; state.games++;
    if (result === 'draw') { state.scores.draw++; state.history.push('draw'); $('#matchTitle').textContent = 'A perfect stalemate.'; $('#gameStatus').innerHTML = '<span class="status-star">✦</span> Nobody takes the crown'; sound('draw'); showResult('draw'); }
    else {
      state.scores[result]++;
      const playerWon = result === 'X';
      state.history.push(playerWon ? 'win' : 'loss');
      $('#matchTitle').textContent = playerWon ? (state.mode === 'ai' ? 'You outplayed the AI!' : 'Player 1 takes it!') : (state.mode === 'ai' ? 'The AI takes this one.' : 'Player 2 takes it!');
      $('#gameStatus').innerHTML = `<span class="status-star">✦</span> ${playerWon ? 'Victory looks good on you' : 'Next round is yours'}`;
      sound('win');
      showResult(playerWon ? 'win' : 'loss');
    }
    line.forEach(i => cells[i].classList.add('winning'));
    render();
  }
  function showResult(result) {
    const titles = { win: ['🏆', 'Victory!', state.mode === 'ai' ? 'You beat the bot. That was smooth.' : 'A brilliant win. Well played!'], loss: ['🤖', state.mode === 'ai' ? 'The bot got you.' : 'Player 2 wins!', state.mode === 'ai' ? 'The rematch is calling your name.' : 'A little friendly rivalry never hurts.'], draw: ['🤝', 'Dead even!', 'Neither side gave an inch. Run it back?'] };
    const [emoji, title, subtitle] = titles[result];
    $('#resultEmoji').textContent = emoji; $('#resultTitle').textContent = title; $('#resultSubtitle').textContent = subtitle;
    $('#resultXLabel').textContent = state.mode === 'ai' ? 'YOU' : 'PLAYER 1'; $('#resultOLabel').textContent = state.mode === 'ai' ? 'AI BOT' : 'PLAYER 2';
    $('#resultXScore').textContent = state.scores.X; $('#resultOScore').textContent = state.scores.O;
    $('#resultOverlay').classList.remove('hidden');
  }
  function closeResult() { $('#resultOverlay').classList.add('hidden'); }
  function resetStats() {
    state.scores = { X: 0, O: 0, draw: 0 }; state.history = []; state.games = 0; render();
    showToast('Statistics cleared. A clean slate!');
  }

  cells.forEach(cell => cell.addEventListener('click', () => { if (!state.busy) playMove(Number(cell.dataset.index), state.current); }));
  document.querySelectorAll('.mode-option').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  document.querySelectorAll('.difficulty-option').forEach(btn => btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty)));
  $('#newGameBtn').addEventListener('click', () => { startGame(); sound('click'); showToast('Fresh board. Let’s play!'); });
  $('#playAgainBtn').addEventListener('click', () => { closeResult(); startGame(); sound('click'); });
  $('#keepPlayingBtn').addEventListener('click', showSessionSummary);
  $('#closeResult').addEventListener('click', () => { if (!$('#closeResult').hidden) closeResult(); });
  $('#resultOverlay').addEventListener('click', e => { if (e.target === $('#resultOverlay') && !$('#closeResult').hidden) closeResult(); });
  $('#resetStatsBtn').addEventListener('click', () => { if (confirm('Reset all match statistics? This cannot be undone.')) resetStats(); });
  $('#soundToggle').addEventListener('click', () => { state.sound = !state.sound; $('#soundState').textContent = state.sound ? 'ON' : 'OFF'; $('#soundToggle').style.color = state.sound ? '#c9c8ff' : '#777f9f'; showToast(state.sound ? 'Sound effects on' : 'Sound effects off'); if (state.sound) sound('click'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#closeResult').hidden) closeResult(); if ($('#resultOverlay').classList.contains('hidden') && /^[1-9]$/.test(e.key)) { const index = Number(e.key) - 1; if (!state.busy) playMove(index, state.current); } });
  setMode('ai'); setDifficulty('hard'); startGame();
})();