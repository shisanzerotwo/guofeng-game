class Game {
    constructor() {
        this.currentChapter = null;
        this.currentLevel = 0;
        this.score = 0;
        this.streak = 0;
        this.completedLevels = {};
        this.hintCount = 0;
        this.weakPoints = {};
        this.selectedItems = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.initAuth();
        this.loadData();
        this.setupEventListeners();
        this.createParticles();
        this.hideLoading();
    }

    initAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.hideLogin();
            this.showUserInfo();
        } else {
            this.initDefaultUsers();
            this.showLogin();
        }
    }

    initDefaultUsers() {
        let users = localStorage.getItem('gameUsers');
        if (!users) {
            users = JSON.stringify({
                'player': '123456'
            });
            localStorage.setItem('gameUsers', users);
        }
    }

    setupAuthListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegister());
        document.getElementById('submitRegister').addEventListener('click', () => this.register());
        document.getElementById('registerClose').addEventListener('click', () => this.hideRegister());
        document.getElementById('loginErrorBtn').addEventListener('click', () => this.hideLoginError());
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.id = 'logoutBtn';
        logoutBtn.textContent = '退出';
        logoutBtn.addEventListener('click', () => this.logout());
        document.querySelector('.game-header').appendChild(logoutBtn);
        logoutBtn.style.display = 'none';
    }

    login() {
        const username = document.getElementById('usernameInput').value.trim();
        const password = document.getElementById('passwordInput').value;
        
        const users = JSON.parse(localStorage.getItem('gameUsers') || '{}');
        
        if (users[username] && users[username] === password) {
            this.currentUser = { username };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.hideLogin();
            this.showUserInfo();
        } else {
            this.showLoginError('用户名或密码错误，请重新输入！');
        }
    }

    showLoginError(message) {
        document.getElementById('loginErrorMessage').textContent = message;
        document.getElementById('loginErrorModal').classList.add('show');
    }

    hideLoginError() {
        document.getElementById('loginErrorModal').classList.remove('show');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        document.getElementById('logoutBtn').style.display = 'none';
        document.querySelector('.user-info')?.remove();
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameArea').style.display = 'none';
    }

    hideLogin() {
        const loginScreen = document.getElementById('loginScreen');
        loginScreen.style.opacity = '0';
        loginScreen.style.transform = 'scale(0.9) translateY(20px)';
        
        setTimeout(() => {
            loginScreen.style.display = 'none';
            loginScreen.style.opacity = '1';
            loginScreen.style.transform = 'scale(1) translateY(0)';
            document.getElementById('mainMenu').style.display = 'block';
        }, 500);
    }

    showRegister() {
        document.getElementById('registerModal').classList.add('show');
        document.getElementById('registerSuccess').textContent = '';
        document.getElementById('registerError').textContent = '';
    }

    hideRegister() {
        document.getElementById('registerModal').classList.remove('show');
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
        document.getElementById('registerSuccess').textContent = '';
        document.getElementById('registerError').textContent = '';
    }

    register() {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        const successEl = document.getElementById('registerSuccess');
        const errorEl = document.getElementById('registerError');
        
        successEl.textContent = '';
        errorEl.textContent = '';
        
        if (!username || !password) {
            errorEl.textContent = '用户名和密码不能为空';
            return;
        }
        
        if (password.length < 4) {
            errorEl.textContent = '密码至少需要4个字符';
            return;
        }
        
        if (password !== confirmPassword) {
            errorEl.textContent = '两次输入的密码不一致';
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('gameUsers') || '{}');
        
        if (users[username]) {
            errorEl.textContent = '该用户名已存在';
            return;
        }
        
        users[username] = password;
        localStorage.setItem('gameUsers', JSON.stringify(users));
        
        successEl.textContent = '注册成功！请登录';
        
        setTimeout(() => {
            this.hideRegister();
            document.getElementById('usernameInput').value = username;
            document.getElementById('passwordInput').value = '';
        }, 1500);
    }

    showUserInfo() {
        const header = document.querySelector('.game-header');
        
        let userInfo = document.querySelector('.user-info');
        if (!userInfo) {
            userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            header.appendChild(userInfo);
        }
        
        const initial = this.currentUser.username.charAt(0).toUpperCase();
        userInfo.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <span>${this.currentUser.username}</span>
        `;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    }

    loadData() {
        const saved = localStorage.getItem('guofengGameData');
        if (saved) {
            const data = JSON.parse(saved);
            this.score = data.score || 0;
            this.streak = data.streak || 0;
            this.completedLevels = data.completedLevels || {};
            this.weakPoints = data.weakPoints || {};
        }
        this.updateStats();
        this.updateProgress();
    }

    saveData() {
        localStorage.setItem('guofengGameData', JSON.stringify({
            score: this.score,
            streak: this.streak,
            completedLevels: this.completedLevels,
            weakPoints: this.weakPoints
        }));
    }

    updateStats() {
        document.getElementById('totalScore').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        
        let totalCompleted = 0;
        Object.values(this.completedLevels).forEach(chapter => {
            totalCompleted += chapter.length;
        });
        document.getElementById('completedLevels').textContent = totalCompleted;
    }

    setupEventListeners() {
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chapter = e.currentTarget.dataset.chapter;
                this.startChapter(chapter);
            });
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.backToMenu();
        });

        document.getElementById('homeBtn').addEventListener('click', () => {
            this.backToMenu();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextLevel();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            this.retryLevel();
        });
    }

    createParticles() {
        const container = document.querySelector('.ink-particles');
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'ink-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
            container.appendChild(particle);
        }
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 1000);
    }

    startChapter(chapter) {
        this.currentChapter = chapter;
        this.currentLevel = 0;
        this.hintCount = 0;
        this.shuffledIndices = this.shuffleArray([...Array(gameData[chapter].length).keys()]);
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        document.getElementById('backBtn').style.display = 'block';
        this.loadLevel();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    backToMenu() {
        document.getElementById('gameArea').style.display = 'none';
        document.getElementById('levelResult').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('backBtn').style.display = 'none';
        this.currentChapter = null;
        this.currentLevel = 0;
        this.updateProgress();
    }

    loadLevel() {
        const levelData = this.getLevelData();
        if (!levelData) {
            this.showChapterComplete();
            return;
        }

        this.hintCount = 0;
        document.getElementById('hintContent').style.display = 'none';
        document.getElementById('feedbackArea').innerHTML = '';
        document.getElementById('levelResult').style.display = 'none';

        const progress = this.getChapterProgress();
        document.getElementById('levelProgressFill').style.width = (progress * 100) + '%';
        document.getElementById('levelTitle').textContent = levelData.title;

        this.renderQuestion(levelData);
    }

    getLevelData() {
        const levels = this.getChapterLevels();
        const shuffledIndex = this.shuffledIndices?.[this.currentLevel];
        return levels[shuffledIndex] || null;
    }

    getChapterLevels() {
        return gameData[this.currentChapter] || [];
    }

    getChapterProgress() {
        const levels = this.getChapterLevels();
        return (this.currentLevel) / levels.length;
    }

    renderQuestion(levelData) {
        const questionArea = document.getElementById('questionArea');
        const optionsArea = document.getElementById('optionsArea');
        
        questionArea.innerHTML = `
            <div class="question-text">${levelData.question}</div>
            ${levelData.hintText ? `<div class="question-hint">提示: ${levelData.hintText}</div>` : ''}
        `;

        optionsArea.innerHTML = '';

        if (levelData.type === 'pattern') {
            this.renderPatternPuzzle(levelData);
        } else if (levelData.type === 'matching') {
            this.renderMatchingGame(levelData);
        } else if (levelData.type === 'fillblank') {
            this.renderFillBlank(levelData);
        } else {
            this.renderMultipleChoice(levelData);
        }
    }

    renderMultipleChoice(levelData) {
        const optionsArea = document.getElementById('optionsArea');
        this.selectedAnswer = null;
        
        levelData.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option.text;
            btn.dataset.index = index;
            btn.addEventListener('click', () => {
                this.selectOption(index);
            });
            optionsArea.appendChild(btn);
        });
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '确认答案';
        confirmBtn.id = 'confirmBtn';
        confirmBtn.disabled = true;
        confirmBtn.addEventListener('click', () => {
            if (this.selectedAnswer !== null) {
                this.checkAnswer(this.selectedAnswer, levelData);
            }
        });
        optionsArea.appendChild(confirmBtn);
    }

    selectOption(index) {
        document.querySelectorAll('.option-btn').forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('selected');
                this.selectedAnswer = index;
            } else {
                btn.classList.remove('selected');
            }
        });
        
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = this.selectedAnswer === null;
        }
    }

    renderPatternPuzzle(levelData) {
        const optionsArea = document.getElementById('optionsArea');
        optionsArea.className = 'pattern-puzzle';
        
        const shuffled = [...levelData.patterns].sort(() => Math.random() - 0.5);
        
        shuffled.forEach((pattern, index) => {
            const piece = document.createElement('div');
            piece.className = 'pattern-piece';
            piece.textContent = pattern;
            piece.dataset.index = index;
            piece.dataset.correctIndex = levelData.patterns.indexOf(pattern);
            piece.addEventListener('click', () => this.selectPatternPiece(piece, levelData));
            optionsArea.appendChild(piece);
        });
    }

    selectPatternPiece(piece, levelData) {
        if (piece.classList.contains('selected')) {
            piece.classList.remove('selected');
            const idx = this.selectedItems.indexOf(piece.dataset.index);
            if (idx > -1) this.selectedItems.splice(idx, 1);
        } else {
            piece.classList.add('selected');
            this.selectedItems.push(piece.dataset.index);
        }

        if (this.selectedItems.length === levelData.patterns.length) {
            this.checkPatternAnswer(levelData);
        }
    }

    checkPatternAnswer(levelData) {
        const pieces = document.querySelectorAll('.pattern-piece');
        let correct = true;
        
        this.selectedItems.forEach((selectedIdx, targetPos) => {
            const piece = pieces[selectedIdx];
            if (parseInt(piece.dataset.correctIndex) !== targetPos) {
                correct = false;
            }
        });

        if (correct) {
            this.showFeedback('correct', '拼接正确！');
            setTimeout(() => this.showLevelResult(true), 1000);
        } else {
            this.showFeedback('wrong', '顺序不正确，请重试');
            pieces.forEach(p => p.classList.remove('selected'));
            this.selectedItems = [];
            this.recordWeakPoint();
            setTimeout(() => this.showLevelResult(false), 1000);
        }
    }

    renderMatchingGame(levelData) {
        const optionsArea = document.getElementById('optionsArea');
        optionsArea.className = 'matching-grid';
        
        const allItems = [...levelData.pairs.map((p, i) => ({ text: p[0], pairIndex: i, isLeft: true })),
                         ...levelData.pairs.map((p, i) => ({ text: p[1], pairIndex: i, isLeft: false }))]
                         .sort(() => Math.random() - 0.5);

        allItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'match-item';
            div.textContent = item.text;
            div.dataset.pairIndex = item.pairIndex;
            div.dataset.isLeft = item.isLeft;
            div.dataset.originalIndex = index;
            div.addEventListener('click', () => this.selectMatchItem(div));
            optionsArea.appendChild(div);
        });
    }

    selectMatchItem(item) {
        if (item.classList.contains('matched')) return;

        if (this.selectedItems.length === 0) {
            item.classList.add('selected');
            this.selectedItems.push(item);
        } else if (this.selectedItems.length === 1) {
            const first = this.selectedItems[0];
            
            if (first.dataset.originalIndex === item.dataset.originalIndex) {
                first.classList.remove('selected');
                this.selectedItems = [];
                return;
            }

            item.classList.add('selected');
            this.selectedItems.push(item);

            if (first.dataset.pairIndex === item.dataset.pairIndex && 
                first.dataset.isLeft !== item.dataset.isLeft) {
                setTimeout(() => {
                    first.classList.add('matched');
                    item.classList.add('matched');
                    first.classList.remove('selected');
                    item.classList.remove('selected');
                    this.selectedItems = [];
                    
                    if (document.querySelectorAll('.match-item.matched').length === 
                        document.querySelectorAll('.match-item').length) {
                        this.showFeedback('correct', '全部匹配成功！');
                        setTimeout(() => this.showLevelResult(true), 1000);
                    }
                }, 500);
            } else {
                setTimeout(() => {
                    first.classList.remove('selected');
                    item.classList.remove('selected');
                    this.selectedItems = [];
                    this.showFeedback('wrong', '匹配不正确');
                    this.recordWeakPoint();
                    setTimeout(() => this.showLevelResult(false), 1000);
                }, 500);
            }
        }
    }

    renderFillBlank(levelData) {
        const optionsArea = document.getElementById('optionsArea');
        optionsArea.className = 'options-area';
        
        const blanks = levelData.question.match(/__/g) || [];
        const shuffledOptions = [...levelData.correctAnswers].sort(() => Math.random() - 0.5);
        
        let selectedIndex = -1;
        
        blanks.forEach((_, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `[空${idx + 1}]`;
            btn.dataset.blankIndex = idx;
            btn.addEventListener('click', () => {
                selectedIndex = idx;
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            optionsArea.appendChild(btn);
        });

        shuffledOptions.forEach((option, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.dataset.optionIndex = idx;
            btn.addEventListener('click', () => {
                if (selectedIndex >= 0) {
                    this.checkFillBlank(selectedIndex, idx, levelData);
                }
            });
            optionsArea.appendChild(btn);
        });
    }

    checkFillBlank(blankIndex, optionIndex, levelData) {
        if (levelData.correctAnswers[blankIndex] === levelData.correctAnswers[optionIndex]) {
            this.showFeedback('correct', '回答正确！');
            this.showLevelResult(true);
        } else {
            this.showFeedback('wrong', '回答错误，请重试');
            this.recordWeakPoint();
            setTimeout(() => this.showLevelResult(false), 1000);
        }
    }

    checkAnswer(index, levelData) {
        const options = document.querySelectorAll('.option-btn');
        
        if (index === levelData.correctAnswer) {
            options[index].classList.add('correct');
            this.showFeedback('correct', levelData.feedbackCorrect || '回答正确！');
            setTimeout(() => this.showLevelResult(true), 1000);
        } else {
            options[index].classList.add('wrong');
            options[levelData.correctAnswer].classList.add('correct');
            this.showFeedback('wrong', levelData.feedbackWrong || '回答错误');
            this.recordWeakPoint();
            setTimeout(() => this.showLevelResult(false), 1000);
        }

        options.forEach(opt => opt.style.pointerEvents = 'none');
    }

    showFeedback(type, message) {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.innerHTML = `<div class="feedback-text ${type}">${message}</div>`;
    }

    showHint() {
        const levelData = this.getLevelData();
        const hintContent = document.getElementById('hintContent');
        
        if (!levelData.hints || this.hintCount >= levelData.hints.length) {
            hintContent.textContent = '已无更多提示';
            hintContent.style.display = 'block';
            return;
        }

        hintContent.textContent = levelData.hints[this.hintCount];
        hintContent.style.display = 'block';
        this.hintCount++;
        
        this.score = Math.max(0, this.score - 5);
        this.saveData();
        this.updateStats();
    }

    showLevelResult(success) {
        const result = document.getElementById('levelResult');
        const icon = document.getElementById('resultIcon');
        const text = document.getElementById('resultText');
        const score = document.getElementById('resultScore');

        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('retryBtn').style.display = 'inline-block';

        if (success) {
            icon.textContent = '🎉';
            icon.className = 'result-icon success';
            text.textContent = '恭喜过关！';
            const earnedScore = 100 + (3 - this.hintCount) * 20;
            score.textContent = `获得积分: +${earnedScore}`;
            
            this.score += earnedScore;
            this.streak++;
            
            if (!this.completedLevels[this.currentChapter]) {
                this.completedLevels[this.currentChapter] = [];
            }
            const originalIndex = this.shuffledIndices[this.currentLevel];
            if (!this.completedLevels[this.currentChapter].includes(originalIndex)) {
                this.completedLevels[this.currentChapter].push(originalIndex);
            }
            
            delete this.weakPoints[`${this.currentChapter}_${originalIndex}`];
        } else {
            icon.textContent = '😢';
            icon.className = 'result-icon fail';
            text.textContent = '闯关失败';
            score.textContent = '再接再厉！';
            this.streak = 0;
            
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('retryBtn').style.display = 'inline-block';
        }

        this.saveData();
        this.updateStats();
        this.updateProgress();
        result.style.display = 'block';
    }

    showChapterComplete() {
        const result = document.getElementById('levelResult');
        const icon = document.getElementById('resultIcon');
        const text = document.getElementById('resultText');
        const score = document.getElementById('resultScore');

        icon.textContent = '🏆';
        icon.className = 'result-icon success';
        text.textContent = '章节完成！';
        score.textContent = `恭喜完成「${this.getChapterName()}」全部关卡！`;
        
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('retryBtn').style.display = 'none';
        result.style.display = 'block';
    }

    getChapterName() {
        const names = {
            poetry: '诗词文脉',
            craft: '非遗工艺',
            folk: '传统民俗',
            pattern: '古典纹样',
            artifact: '传统器物',
            xinjiang: '新疆风情'
        };
        return names[this.currentChapter] || '';
    }

    nextLevel() {
        this.currentLevel++;
        this.selectedItems = [];
        this.selectedAnswer = null;
        this.hintCount = 0;
        document.getElementById('levelResult').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('hintContent').style.display = 'none';
        document.getElementById('feedbackArea').innerHTML = '';
        
        const optionsArea = document.getElementById('optionsArea');
        optionsArea.innerHTML = '';
        
        this.loadLevel();
    }

    retryLevel() {
        this.selectedItems = [];
        this.selectedAnswer = null;
        this.hintCount = 0;
        document.getElementById('levelResult').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('hintContent').style.display = 'none';
        document.getElementById('feedbackArea').innerHTML = '';
        
        const optionsArea = document.getElementById('optionsArea');
        optionsArea.innerHTML = '';
        
        this.loadLevel();
    }

    recordWeakPoint() {
        const originalIndex = this.shuffledIndices[this.currentLevel];
        const key = `${this.currentChapter}_${originalIndex}`;
        this.weakPoints[key] = (this.weakPoints[key] || 0) + 1;
        this.saveData();
    }

    updateProgress() {
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            const chapter = btn.dataset.chapter;
            const completed = this.completedLevels[chapter]?.length || 0;
            const total = gameData[chapter]?.length || 0;
            btn.querySelector('.chapter-progress').textContent = `进度: ${completed}/${total}`;
        });
    }
}

const gameData = {
    poetry: [
        {
            title: '诗词填空 - 静夜思',
            question: '床前明月光，疑是地上霜。举头望明月，______。',
            type: 'choice',
            options: [
                { text: '低头思故乡' },
                { text: '举头望明月' },
                { text: '月是故乡明' },
                { text: '千里共婵娟' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是李白的《静夜思》',
            feedbackWrong: '再想想，这是表达思乡之情的诗句',
            hints: ['这是唐代诗人李白的名作', '表达的是思乡之情', '最后一句是"低头思故乡"']
        },
        {
            title: '诗词作者匹配',
            question: '请将诗词与作者进行匹配',
            type: 'matching',
            pairs: [['《春晓》', '孟浩然'], ['《登鹳雀楼》', '王之涣'], ['《望庐山瀑布》', '李白'], ['《悯农》', '李绅']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['《春晓》是描写春天的诗', '《登鹳雀楼》有"欲穷千里目"的名句']
        },
        {
            title: '诗词意境理解',
            question: '"春风又绿江南岸，明月何时照我还"表达了诗人怎样的情感？',
            type: 'choice',
            options: [
                { text: '对春天景色的赞美' },
                { text: '对故乡的思念之情' },
                { text: '对官场生活的厌倦' },
                { text: '对友人的离别之情' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！这是王安石的思乡之作',
            feedbackWrong: '再想想，"照我还"暗示了归乡的愿望',
            hints: ['关键词是"照我还"', '表达的是思乡之情']
        },
        {
            title: '诗人典故',
            question: '"推敲"这个典故与哪位诗人有关？',
            type: 'choice',
            options: [
                { text: '李白' },
                { text: '杜甫' },
                { text: '贾岛' },
                { text: '白居易' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！贾岛骑驴作诗，斟酌"推"与"敲"',
            feedbackWrong: '不是这位诗人，想想"僧推月下门"的典故',
            hints: ['与"僧推月下门"有关', '这位诗人以苦吟著称']
        },
        {
            title: '诗词填空 - 登鹳雀楼',
            question: '白日依山尽，黄河入海流。欲穷千里目，______。',
            type: 'choice',
            options: [
                { text: '更上一层楼' },
                { text: '黄河入海流' },
                { text: '一览众山小' },
                { text: '手可摘星辰' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王之涣的《登鹳雀楼》',
            feedbackWrong: '再想想，这是表达追求更高境界的诗句',
            hints: ['需要再登高', '最后一句是"更上一层楼"', '五个字']
        },
        {
            title: '词牌名识别',
            question: '"明月几时有，把酒问青天"出自哪个词牌？',
            type: 'choice',
            options: [
                { text: '念奴娇' },
                { text: '水调歌头' },
                { text: '蝶恋花' },
                { text: '如梦令' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！这是苏轼的《水调歌头·明月几时有》',
            feedbackWrong: '不是这个词牌，这首词是中秋赏月之作',
            hints: ['这个词牌常用来写中秋', '苏轼的代表作']
        },
        {
            title: '诗词季节匹配',
            question: '请将诗句与对应的季节匹配',
            type: 'matching',
            pairs: [['"小荷才露尖尖角"', '夏季'], ['"霜叶红于二月花"', '秋季'], ['"凌寒独自开"', '冬季'], ['"春风得意马蹄疾"', '春季']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['荷花在夏天开放', '霜叶指秋天的枫叶']
        },
        {
            title: '古诗体裁',
            question: '"两个黄鹂鸣翠柳，一行白鹭上青天"属于哪种诗体？',
            type: 'choice',
            options: [
                { text: '律诗' },
                { text: '绝句' },
                { text: '古风' },
                { text: '乐府' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！这是杜甫的七言绝句',
            feedbackWrong: '不是这种诗体，这首诗只有四句',
            hints: ['这首诗只有四句', '每句七个字']
        },
        {
            title: '诗词填空 - 悯农',
            question: '锄禾日当午，汗滴禾下土。谁知盘中餐，______。',
            type: 'choice',
            options: [
                { text: '粒粒皆辛苦' },
                { text: '汗滴禾下土' },
                { text: '秋收万颗子' },
                { text: '四海无闲田' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是李绅的《悯农》',
            feedbackWrong: '再想想，表达珍惜粮食的诗句',
            hints: ['提醒人们珍惜粮食', '最后一句是"粒粒皆辛苦"', '五个字']
        },
        {
            title: '诗词名句出处',
            question: '"海内存知己，天涯若比邻"出自哪位诗人？',
            type: 'choice',
            options: [
                { text: '王勃' },
                { text: '王维' },
                { text: '高适' },
                { text: '岑参' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王勃的《送杜少府之任蜀州》',
            feedbackWrong: '不是这位诗人，这是一首送别诗',
            hints: ['初唐四杰之一', '《送杜少府之任蜀州》']
        },
        {
            title: '诗词填空 - 望庐山瀑布',
            question: '日照香炉生紫烟，遥看瀑布挂前川。______，疑是银河落九天。',
            type: 'choice',
            options: [
                { text: '飞流直下三千尺' },
                { text: '遥看瀑布挂前川' },
                { text: '两岸青山相对出' },
                { text: '孤帆一片日边来' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是李白的《望庐山瀑布》',
            feedbackWrong: '再想想，形容瀑布壮观的诗句',
            hints: ['描写瀑布的壮观', '最后一句是"飞流直下三千尺"', '七个字']
        },
        {
            title: '诗词作者匹配二',
            question: '请将诗词与作者进行匹配',
            type: 'matching',
            pairs: [['《静夜思》', '李白'], ['《出塞》', '王昌龄'], ['《江雪》', '柳宗元'], ['《枫桥夜泊》', '张继']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['《江雪》是柳宗元的名作', '《枫桥夜泊》描写夜景']
        },
        {
            title: '诗词情感理解',
            question: '"独在异乡为异客，每逢佳节倍思亲"表达的情感是？',
            type: 'choice',
            options: [
                { text: '思乡之情' },
                { text: '爱国之情' },
                { text: '友情' },
                { text: '爱情' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王维的《九月九日忆山东兄弟》',
            feedbackWrong: '再想想，"倍思亲"表达的是什么',
            hints: ['关键词是"思亲"', '思念家乡亲人']
        },
        {
            title: '诗词填空 - 早发白帝城',
            question: '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，______。',
            type: 'choice',
            options: [
                { text: '轻舟已过万重山' },
                { text: '千里江陵一日还' },
                { text: '两岸猿声啼不住' },
                { text: '两岸青山相对出' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是李白的《早发白帝城》',
            feedbackWrong: '再想想，描写船快的诗句',
            hints: ['船行速度很快', '最后一句是"轻舟已过万重山"', '七个字']
        },
        {
            title: '词牌名识别二',
            question: '"念去去，千里烟波"出自哪个词牌？',
            type: 'choice',
            options: [
                { text: '鹊桥仙' },
                { text: '雨霖铃' },
                { text: '声声慢' },
                { text: '破阵子' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！这是柳永的《雨霖铃》',
            feedbackWrong: '不是这个词牌，这首词是送别之作',
            hints: ['与离别有关', '柳永的代表作']
        },
        {
            title: '诗词季节匹配二',
            question: '请将诗句与对应的季节匹配',
            type: 'matching',
            pairs: [['"接天莲叶无穷碧"', '夏季'], ['"停车坐爱枫林晚"', '秋季'], ['"忽如一夜春风来"', '冬季'], ['"草长莺飞二月天"', '春季']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['莲叶在夏天', '枫林在秋天']
        },
        {
            title: '古诗体裁二',
            question: '"春眠不觉晓，处处闻啼鸟"属于哪种诗体？',
            type: 'choice',
            options: [
                { text: '律诗' },
                { text: '绝句' },
                { text: '古风' },
                { text: '乐府' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！这是孟浩然的五言绝句',
            feedbackWrong: '不是这种诗体，这首诗只有四句',
            hints: ['这首诗只有四句', '每句五个字']
        },
        {
            title: '诗人并称',
            question: '"李杜"指的是哪两位诗人？',
            type: 'choice',
            options: [
                { text: '李白和杜甫' },
                { text: '李商隐和杜牧' },
                { text: '李贺和杜荀鹤' },
                { text: '李绅和杜光庭' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！李杜指李白和杜甫',
            feedbackWrong: '不是这两位，想想唐代最著名的诗人',
            hints: ['诗仙和诗圣', '唐代两大诗人']
        },
        {
            title: '诗词典故',
            question: '"推敲"典故中，诗人最终选择了哪个字？',
            type: 'choice',
            options: [
                { text: '推' },
                { text: '敲' },
                { text: '打' },
                { text: '击' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！最终选择了"敲"字',
            feedbackWrong: '不是这个字，想想哪个字更有礼貌',
            hints: ['"僧敲月下门"', '更有礼貌']
        },
        {
            title: '诗词填空 - 相思',
            question: '红豆生南国，春来发几枝。愿君多采撷，______。',
            type: 'choice',
            options: [
                { text: '此物最相思' },
                { text: '红豆生南国' },
                { text: '春来发几枝' },
                { text: '愿君多采撷' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王维的《相思》',
            feedbackWrong: '再想想，表达相思之情的诗句',
            hints: ['红豆象征相思', '最后一句是"此物最相思"', '五个字']
        },
        {
            title: '诗词填空 - 游子吟',
            question: '慈母手中线，游子身上衣。临行密密缝，______。',
            type: 'choice',
            options: [
                { text: '意恐迟迟归' },
                { text: '游子身上衣' },
                { text: '慈母手中线' },
                { text: '谁言寸草心' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是孟郊的《游子吟》',
            feedbackWrong: '再想想，表达母亲担忧的诗句',
            hints: ['母亲的担忧', '最后一句是"意恐迟迟归"', '五个字']
        },
        {
            title: '诗词填空 - 江雪',
            question: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，______。',
            type: 'choice',
            options: [
                { text: '独钓寒江雪' },
                { text: '万径人踪灭' },
                { text: '千山鸟飞绝' },
                { text: '孤舟蓑笠翁' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是柳宗元的《江雪》',
            feedbackWrong: '再想想，描写垂钓的诗句',
            hints: ['独自垂钓', '最后一句是"独钓寒江雪"', '五个字']
        },
        {
            title: '诗词填空 - 春晓',
            question: '春眠不觉晓，处处闻啼鸟。夜来风雨声，______。',
            type: 'choice',
            options: [
                { text: '花落知多少' },
                { text: '处处闻啼鸟' },
                { text: '春眠不觉晓' },
                { text: '夜来风雨声' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是孟浩然的《春晓》',
            feedbackWrong: '再想想，表达惜春之情的诗句',
            hints: ['花落', '最后一句是"花落知多少"', '五个字']
        },
        {
            title: '诗词填空 - 绝句',
            question: '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，______。',
            type: 'choice',
            options: [
                { text: '门泊东吴万里船' },
                { text: '一行白鹭上青天' },
                { text: '两个黄鹂鸣翠柳' },
                { text: '窗含西岭千秋雪' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是杜甫的《绝句》',
            feedbackWrong: '再想想，描写船只的诗句',
            hints: ['船只', '最后一句是"门泊东吴万里船"', '七个字']
        },
        {
            title: '诗词填空 - 出塞',
            question: '秦时明月汉时关，万里长征人未还。但使龙城飞将在，______。',
            type: 'choice',
            options: [
                { text: '不教胡马度阴山' },
                { text: '万里长征人未还' },
                { text: '秦时明月汉时关' },
                { text: '但使龙城飞将在' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王昌龄的《出塞》',
            feedbackWrong: '再想想，表达保家卫国的诗句',
            hints: ['保卫边疆', '最后一句是"不教胡马度阴山"', '七个字']
        },
        {
            title: '诗词填空 - 枫桥夜泊',
            question: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，______。',
            type: 'choice',
            options: [
                { text: '夜半钟声到客船' },
                { text: '江枫渔火对愁眠' },
                { text: '月落乌啼霜满天' },
                { text: '姑苏城外寒山寺' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是张继的《枫桥夜泊》',
            feedbackWrong: '再想想，描写钟声的诗句',
            hints: ['钟声', '最后一句是"夜半钟声到客船"', '七个字']
        },
        {
            title: '诗词填空 - 望天门山',
            question: '天门中断楚江开，碧水东流至此回。两岸青山相对出，______。',
            type: 'choice',
            options: [
                { text: '孤帆一片日边来' },
                { text: '碧水东流至此回' },
                { text: '天门中断楚江开' },
                { text: '两岸青山相对出' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是李白的《望天门山》',
            feedbackWrong: '再想想，描写孤帆的诗句',
            hints: ['孤帆', '最后一句是"孤帆一片日边来"', '七个字']
        },
        {
            title: '诗词填空 - 送元二使安西',
            question: '渭城朝雨浥轻尘，客舍青青柳色新。劝君更尽一杯酒，______。',
            type: 'choice',
            options: [
                { text: '西出阳关无故人' },
                { text: '客舍青青柳色新' },
                { text: '渭城朝雨浥轻尘' },
                { text: '劝君更尽一杯酒' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王维的《送元二使安西》',
            feedbackWrong: '再想想，表达送别之情的诗句',
            hints: ['送别友人', '最后一句是"西出阳关无故人"', '七个字']
        },
        {
            title: '诗词填空 - 九月九日忆山东兄弟',
            question: '独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，______。',
            type: 'choice',
            options: [
                { text: '遍插茱萸少一人' },
                { text: '每逢佳节倍思亲' },
                { text: '独在异乡为异客' },
                { text: '遥知兄弟登高处' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！这是王维的《九月九日忆山东兄弟》',
            feedbackWrong: '再想想，描写重阳节的诗句',
            hints: ['重阳节', '茱萸', '最后一句是"遍插茱萸少一人"', '七个字']
        }
    ],
    craft: [
        {
            title: '剪纸工艺',
            question: '剪纸艺术中，哪种技法是将纸折叠后剪制，展开后形成对称图案？',
            type: 'choice',
            options: [
                { text: '阴刻' },
                { text: '阳刻' },
                { text: '折叠剪' },
                { text: '套色' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！折叠剪是剪纸的基本技法之一',
            feedbackWrong: '不是这种技法，想想对称图案是如何制作的',
            hints: ['与"折叠"有关', '展开后图案对称']
        },
        {
            title: '皮影戏步骤',
            question: '皮影戏的表演步骤正确顺序是？',
            type: 'pattern',
            patterns: ['制皮', '描样', '雕刻', '着色', '装订'],
            feedbackCorrect: '正确！这是皮影制作的完整流程',
            feedbackWrong: '顺序不对，请重新排列',
            hints: ['先有皮料才能加工', '最后需要组装']
        },
        {
            title: '活字印刷',
            question: '活字印刷术的发明者是谁？',
            type: 'choice',
            options: [
                { text: '蔡伦' },
                { text: '毕昇' },
                { text: '沈括' },
                { text: '张衡' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！毕昇发明了活字印刷术',
            feedbackWrong: '不是这位，蔡伦改进的是造纸术',
            hints: ['北宋时期的发明家', '不是改进造纸术的那位']
        },
        {
            title: '刺绣流派',
            question: '请将刺绣流派与其特点匹配',
            type: 'matching',
            pairs: [['苏绣', '精细雅洁'], ['湘绣', '豪放写实'], ['粤绣', '富丽堂皇'], ['蜀绣', '色彩鲜艳']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['苏绣以精细著称', '湘绣擅长狮虎题材']
        },
        {
            title: '陶艺工艺',
            question: '陶瓷制作中，哪个步骤是为了让器物更光滑？',
            type: 'choice',
            options: [
                { text: '成型' },
                { text: '修坯' },
                { text: '上釉' },
                { text: '烧制' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！修坯让器物表面更光滑',
            feedbackWrong: '不是这个步骤，想想哪个步骤处理表面',
            hints: ['处理坯体表面', '让表面更平整']
        },
        {
            title: '木雕工艺',
            question: '木雕中，哪种技法是在木材表面雕刻凹陷图案？',
            type: 'choice',
            options: [
                { text: '圆雕' },
                { text: '浮雕' },
                { text: '透雕' },
                { text: '阴雕' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！阴雕是雕刻凹陷图案',
            feedbackWrong: '不是这种技法，凹陷的是阴',
            hints: ['凹陷进去的雕刻', '与阳雕相对']
        },
        {
            title: '景泰蓝制作',
            question: '景泰蓝的主要制作步骤正确顺序是？',
            type: 'pattern',
            patterns: ['制胎', '掐丝', '点蓝', '烧蓝', '磨光'],
            feedbackCorrect: '正确！这是景泰蓝的制作流程',
            feedbackWrong: '顺序不对，请重新排列',
            hints: ['先做胎体', '最后需要打磨']
        },
        {
            title: '玉雕工艺',
            question: '玉雕中"相玉"指的是什么？',
            type: 'choice',
            options: [
                { text: '挑选玉石' },
                { text: '设计图案' },
                { text: '打磨抛光' },
                { text: '雕刻技法' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！相玉就是观察和挑选玉石',
            feedbackWrong: '不是这个，"相"在这里是观察的意思',
            hints: ['相是观察、审视的意思', '挑选合适的玉料']
        },
        {
            title: '苏绣特点',
            question: '苏绣的主要特点是什么？',
            type: 'choice',
            options: [
                { text: '粗犷豪放' },
                { text: '精细雅洁' },
                { text: '色彩浓艳' },
                { text: '立体感强' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！苏绣以精细雅洁著称',
            feedbackWrong: '不是这个特点，苏绣以精细闻名',
            hints: ['精细是苏绣的特点', '江南风格']
        },
        {
            title: '景泰蓝步骤',
            question: '景泰蓝制作中，哪个步骤是将珐琅釉料填充到丝纹中？',
            type: 'choice',
            options: [
                { text: '制胎' },
                { text: '掐丝' },
                { text: '点蓝' },
                { text: '烧蓝' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！点蓝是填充珐琅釉料',
            feedbackWrong: '不是这个步骤，想想哪个步骤与填充有关',
            hints: ['"点"就是填充的意思', '填入釉料']
        },
        {
            title: '宣纸制作',
            question: '宣纸的主要原料是什么？',
            type: 'choice',
            options: [
                { text: '竹子' },
                { text: '稻草' },
                { text: '檀皮和稻草' },
                { text: '树皮' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！宣纸以檀皮和稻草为原料',
            feedbackWrong: '不是单一原料，是两种原料混合',
            hints: ['安徽泾县特产', '两种原料']
        },
        {
            title: '木雕流派',
            question: '请将木雕流派与特点匹配',
            type: 'matching',
            pairs: [['东阳木雕', '精美细腻'], ['黄杨木雕', '古朴典雅'], ['龙眼木雕', '粗犷豪放'], ['金漆木雕', '金碧辉煌']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['东阳木雕很精美', '金漆木雕有金色']
        },
        {
            title: '剪纸流派',
            question: '北方剪纸的主要特点是什么？',
            type: 'choice',
            options: [
                { text: '细腻秀丽' },
                { text: '粗犷豪放' },
                { text: '色彩丰富' },
                { text: '写实逼真' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！北方剪纸粗犷豪放',
            feedbackWrong: '不是这个特点，北方风格比较大气',
            hints: ['北方风格', '豪放大气']
        },
        {
            title: '陶瓷烧制',
            question: '陶瓷烧制中，哪个温度范围属于高温瓷？',
            type: 'choice',
            options: [
                { text: '800℃以下' },
                { text: '800-1200℃' },
                { text: '1200℃以上' },
                { text: '600-800℃' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！高温瓷需要1200℃以上',
            feedbackWrong: '不是这个温度，高温瓷温度很高',
            hints: ['温度很高', '超过1200℃']
        },
        {
            title: '刺绣针法',
            question: '苏绣中最常用的针法是什么？',
            type: 'choice',
            options: [
                { text: '平针' },
                { text: '乱针' },
                { text: '套针' },
                { text: '打籽针' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！套针是苏绣常用针法',
            feedbackWrong: '不是这种针法，苏绣常用套针',
            hints: ['层层套叠', '苏绣特色针法']
        },
        {
            title: '漆器工艺',
            question: '漆器工艺中，"剔红"指的是什么？',
            type: 'choice',
            options: [
                { text: '红色漆料' },
                { text: '雕刻红漆' },
                { text: '红色颜料' },
                { text: '红色木材' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！剔红是在红漆上雕刻',
            feedbackWrong: '不是这个，"剔"是雕刻的意思',
            hints: ['"剔"是雕刻', '在漆层上雕刻']
        }
    ],
    folk: [
        {
            title: '春节习俗',
            question: '春节贴春联的习俗与哪个传说有关？',
            type: 'choice',
            options: [
                { text: '年兽' },
                { text: '嫦娥' },
                { text: '门神' },
                { text: '灶王爷' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！贴春联是为了驱赶年兽',
            feedbackWrong: '不是这个传说，想想红色的作用',
            hints: ['与过年有关', '传说中的怪兽']
        },
        {
            title: '端午节习俗',
            question: '端午节吃粽子是为了纪念哪位诗人？',
            type: 'choice',
            options: [
                { text: '李白' },
                { text: '屈原' },
                { text: '杜甫' },
                { text: '白居易' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！吃粽子纪念屈原',
            feedbackWrong: '不是这位诗人，与汨罗江有关',
            hints: ['投江自尽的诗人', '汨罗江']
        },
        {
            title: '中秋节',
            question: '中秋节的主要习俗不包括？',
            type: 'choice',
            options: [
                { text: '赏月' },
                { text: '吃月饼' },
                { text: '赛龙舟' },
                { text: '祭月' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！赛龙舟是端午节的习俗',
            feedbackWrong: '这个是中秋节习俗，想想哪个是其他节日的',
            hints: ['哪个是水上活动？', '与龙有关的节日']
        },
        {
            title: '二十四节气',
            question: '请将节气与季节匹配',
            type: 'matching',
            pairs: [['立春', '春季'], ['夏至', '夏季'], ['立秋', '秋季'], ['冬至', '冬季']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['立春是春天开始', '冬至是白天最短的一天']
        },
        {
            title: '元宵节',
            question: '元宵节的传统食物是什么？',
            type: 'choice',
            options: [
                { text: '粽子' },
                { text: '汤圆' },
                { text: '月饼' },
                { text: '饺子' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！元宵节吃汤圆',
            feedbackWrong: '不是这个，想想圆形的食物',
            hints: ['圆形的食物', '象征团圆']
        },
        {
            title: '清明节',
            question: '清明节的主要活动不包括？',
            type: 'choice',
            options: [
                { text: '扫墓' },
                { text: '踏青' },
                { text: '登高' },
                { text: '植树' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！登高是重阳节的习俗',
            feedbackWrong: '这个是清明节活动，想想哪个是重阳的',
            hints: ['哪个节日需要爬山？', '九月初九']
        },
        {
            title: '七夕节',
            question: '七夕节与哪对传说人物有关？',
            type: 'choice',
            options: [
                { text: '牛郎织女' },
                { text: '梁山伯祝英台' },
                { text: '许仙白娘子' },
                { text: '董永七仙女' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！七夕是牛郎织女相会的日子',
            feedbackWrong: '不是这对，与鹊桥有关',
            hints: ['鹊桥相会', '银河两岸']
        },
        {
            title: '重阳节',
            question: '重阳节的传统习俗不包括？',
            type: 'choice',
            options: [
                { text: '登高' },
                { text: '赏菊' },
                { text: '佩茱萸' },
                { text: '吃元宵' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！吃元宵是元宵节的习俗',
            feedbackWrong: '这个是重阳节习俗，想想哪个是正月十五的',
            hints: ['哪个是正月十五吃的？', '元宵节的食物']
        },
        {
            title: '腊八节',
            question: '腊八节喝的腊八粥通常有几种食材？',
            type: 'choice',
            options: [
                { text: '五种' },
                { text: '七种' },
                { text: '八种' },
                { text: '十种' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！腊八粥通常用八种食材',
            feedbackWrong: '不是这个数量，"腊八"暗示了数量',
            hints: ['与"八"有关', '八种谷物熬制']
        },
        {
            title: '冬至',
            question: '冬至北方传统吃什么？',
            type: 'choice',
            options: [
                { text: '汤圆' },
                { text: '饺子' },
                { text: '粽子' },
                { text: '月饼' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！北方冬至吃饺子',
            feedbackWrong: '不是这个，想想北方的习俗',
            hints: ['北方冬至必吃', '防止冻耳朵']
        },
        {
            title: '寒食节',
            question: '寒食节与哪位忠臣有关？',
            type: 'choice',
            options: [
                { text: '岳飞' },
                { text: '介子推' },
                { text: '文天祥' },
                { text: '屈原' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！寒食节纪念介子推',
            feedbackWrong: '不是这位，与晋文公有关',
            hints: ['跟随晋文公流亡', '被火烧死在山上']
        },
        {
            title: '中元节',
            question: '中元节俗称什么？',
            type: 'choice',
            options: [
                { text: '鬼节' },
                { text: '财神节' },
                { text: '花朝节' },
                { text: '上巳节' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！中元节俗称鬼节',
            feedbackWrong: '不是这个，与祭祀祖先有关',
            hints: ['与鬼神有关', '农历七月十五']
        },
        {
            title: '春节习俗二',
            question: '春节吃饺子的习俗寓意是什么？',
            type: 'choice',
            options: [
                { text: '团圆美满' },
                { text: '招财进宝' },
                { text: '吉祥如意' },
                { text: '年年有余' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！饺子形状像元宝，寓意招财进宝',
            feedbackWrong: '不是这个寓意，想想饺子的形状',
            hints: ['形状像元宝', '财富']
        },
        {
            title: '端午节习俗二',
            question: '端午节挂艾草和菖蒲的目的是什么？',
            type: 'choice',
            options: [
                { text: '装饰美化' },
                { text: '驱邪避瘟' },
                { text: '纪念屈原' },
                { text: '庆祝丰收' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！艾草和菖蒲可以驱邪避瘟',
            feedbackWrong: '不是这个目的，与健康有关',
            hints: ['草药', '辟邪']
        },
        {
            title: '二十四节气二',
            question: '请将节气与含义匹配',
            type: 'matching',
            pairs: [['清明', '天气晴朗'], ['谷雨', '雨水增多'], ['小满', '麦类饱满'], ['芒种', '忙于耕种']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['谷雨与雨水有关', '芒种要耕种']
        },
        {
            title: '重阳节习俗二',
            question: '重阳节为什么要登高？',
            type: 'choice',
            options: [
                { text: '锻炼身体' },
                { text: '避灾祈福' },
                { text: '欣赏风景' },
                { text: '祭拜山神' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！登高是为了避灾祈福',
            feedbackWrong: '不是这个原因，与传统信仰有关',
            hints: ['传统习俗', '避灾']
        },
        {
            title: '七夕节习俗',
            question: '七夕节有什么传统习俗？',
            type: 'choice',
            options: [
                { text: '吃月饼' },
                { text: '乞巧' },
                { text: '赛龙舟' },
                { text: '放烟花' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！七夕节有乞巧的习俗',
            feedbackWrong: '不是这个习俗，七夕与织女有关',
            hints: ['向织女祈求', '心灵手巧']
        },
        {
            title: '中秋节习俗二',
            question: '中秋节为什么要赏月？',
            type: 'choice',
            options: [
                { text: '月亮最圆' },
                { text: '纪念嫦娥' },
                { text: '祈求丰收' },
                { text: '团圆象征' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！月亮象征团圆',
            feedbackWrong: '不是这个原因，与家人团聚有关',
            hints: ['团圆', '家人相聚']
        },
        {
            title: '腊八节习俗',
            question: '腊八节除了喝粥还有什么习俗？',
            type: 'choice',
            options: [
                { text: '贴春联' },
                { text: '祭祀祖先' },
                { text: '吃粽子' },
                { text: '赏月' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！腊八节有祭祀祖先的习俗',
            feedbackWrong: '不是这个习俗，与祭祀有关',
            hints: ['祭祀', '祖先']
        },
        {
            title: '冬至习俗',
            question: '冬至为什么要吃饺子？',
            type: 'choice',
            options: [
                { text: '纪念张仲景' },
                { text: '团圆' },
                { text: '庆祝丰收' },
                { text: '驱寒' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！纪念医圣张仲景',
            feedbackWrong: '不是这个原因，与名医有关',
            hints: ['医圣', '张仲景']
        },
        {
            title: '元宵节习俗',
            question: '元宵节为什么要赏花灯？',
            type: 'choice',
            options: [
                { text: '照亮道路' },
                { text: '祈福求子' },
                { text: '庆祝丰收' },
                { text: '驱赶野兽' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！赏花灯有祈福求子的寓意',
            feedbackWrong: '不是这个原因，与祈福有关',
            hints: ['祈福', '美好愿望']
        }
    ],
    pattern: [
        {
            title: '祥云纹样',
            question: '祥云纹样通常象征什么？',
            type: 'choice',
            options: [
                { text: '吉祥如意' },
                { text: '勇猛威武' },
                { text: '富贵荣华' },
                { text: '长寿安康' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！祥云象征吉祥如意',
            feedbackWrong: '不是这个寓意，想想云的吉祥含义',
            hints: ['吉祥的云朵', '好运气的象征']
        },
        {
            title: '回纹',
            question: '回纹的特点是什么？',
            type: 'choice',
            options: [
                { text: '曲线流畅' },
                { text: '方正回旋' },
                { text: '对称对称' },
                { text: '自然写实' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！回纹方正回旋，连绵不断',
            feedbackWrong: '不是这个特点，想想"回"字的形状',
            hints: ['像"回"字一样', '线条回旋']
        },
        {
            title: '饕餮纹',
            question: '饕餮纹常见于哪种古代器物？',
            type: 'choice',
            options: [
                { text: '瓷器' },
                { text: '青铜器' },
                { text: '玉器' },
                { text: '丝织品' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！饕餮纹常见于青铜器',
            feedbackWrong: '不是这种器物，与古代礼器有关',
            hints: ['古代青铜礼器', '商周时期常见']
        },
        {
            title: '传统花纹匹配',
            question: '请将花纹名称与寓意匹配',
            type: 'matching',
            pairs: [['蝙蝠纹', '福气'], ['莲花纹', '纯洁'], ['龙纹', '尊贵'], ['凤纹', '吉祥']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['蝙蝠的"蝠"谐音"福"', '莲花出淤泥而不染']
        },
        {
            title: '云雷纹',
            question: '云雷纹主要由什么线条组成？',
            type: 'choice',
            options: [
                { text: '直线' },
                { text: '曲线和折线' },
                { text: '波浪线' },
                { text: '同心圆' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！云雷纹由曲线和折线组成',
            feedbackWrong: '不是这种线条，想想云和雷的形状',
            hints: ['像云和雷的形状', '弯曲和转折']
        },
        {
            title: '缠枝纹',
            question: '缠枝纹的特点是什么？',
            type: 'choice',
            options: [
                { text: '线条缠绕' },
                { text: '几何对称' },
                { text: '写实描绘' },
                { text: '抽象简洁' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！缠枝纹线条缠绕连绵',
            feedbackWrong: '不是这个特点，"缠枝"已经提示了',
            hints: ['枝条缠绕', '连绵不断']
        },
        {
            title: '夔龙纹',
            question: '夔龙纹是一种什么样的纹样？',
            type: 'choice',
            options: [
                { text: '完整的龙' },
                { text: '一种神兽' },
                { text: '龙的侧面单足形象' },
                { text: '龙和凤的结合' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！夔龙纹是龙的侧面单足形象',
            feedbackWrong: '不是这个描述，想想"夔"的特征',
            hints: ['只有一只脚', '传说中的怪兽']
        },
        {
            title: '如意纹',
            question: '如意纹的形状来源于什么器物？',
            type: 'choice',
            options: [
                { text: '宝剑' },
                { text: '如意' },
                { text: '扇子' },
                { text: '玉佩' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！如意纹来源于如意器物',
            feedbackWrong: '不是这个器物，纹样名称已经提示',
            hints: ['与纹样同名的器物', '象征吉祥如意']
        },
        {
            title: '云纹',
            question: '云纹在传统装饰中的主要寓意是什么？',
            type: 'choice',
            options: [
                { text: '力量' },
                { text: '吉祥' },
                { text: '财富' },
                { text: '长寿' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！云纹象征吉祥',
            feedbackWrong: '不是这个寓意，云纹很吉祥',
            hints: ['吉祥', '好运']
        },
        {
            title: '龙纹',
            question: '龙纹在古代主要用于什么场合？',
            type: 'choice',
            options: [
                { text: '民间装饰' },
                { text: '皇家装饰' },
                { text: '宗教仪式' },
                { text: '商业标志' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！龙纹是皇家专用',
            feedbackWrong: '不是这个场合，龙是皇家象征',
            hints: ['皇帝', '皇家']
        },
        {
            title: '凤纹',
            question: '凤纹通常与什么图案搭配使用？',
            type: 'choice',
            options: [
                { text: '虎纹' },
                { text: '龙纹' },
                { text: '豹纹' },
                { text: '鹿纹' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！龙凤呈祥是经典搭配',
            feedbackWrong: '不是这个搭配，龙凤常常一起出现',
            hints: ['龙凤呈祥', '一对']
        },
        {
            title: '纹样寓意匹配',
            question: '请将纹样与寓意匹配',
            type: 'matching',
            pairs: [['麒麟纹', '祥瑞'], ['鱼纹', '年年有余'], ['牡丹纹', '富贵'], ['松鹤纹', '长寿']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['鱼谐音"余"', '松鹤象征长寿']
        },
        {
            title: '几何纹样',
            question: '以下哪种不是几何纹样？',
            type: 'choice',
            options: [
                { text: '回纹' },
                { text: '云雷纹' },
                { text: '缠枝纹' },
                { text: '万字纹' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！缠枝纹是植物纹样',
            feedbackWrong: '这个是几何纹样，找出植物纹样',
            hints: ['哪个是植物？', '缠枝是植物']
        },
        {
            title: '植物纹样',
            question: '牡丹纹象征什么？',
            type: 'choice',
            options: [
                { text: '纯洁' },
                { text: '富贵' },
                { text: '长寿' },
                { text: '吉祥' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！牡丹象征富贵',
            feedbackWrong: '不是这个寓意，牡丹是花中之王',
            hints: ['花中之王', '富贵']
        },
        {
            title: '动物纹样',
            question: '蝙蝠纹为什么象征福气？',
            type: 'choice',
            options: [
                { text: '长相可爱' },
                { text: '谐音"福"' },
                { text: '数量多' },
                { text: '颜色吉祥' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！蝙蝠的"蝠"谐音"福"',
            feedbackWrong: '不是这个原因，与读音有关',
            hints: ['谐音', '蝠=福']
        },
        {
            title: '水波纹',
            question: '水波纹在传统装饰中的寓意是什么？',
            type: 'choice',
            options: [
                { text: '平静' },
                { text: '财源滚滚' },
                { text: '力量' },
                { text: '智慧' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！水波纹寓意财源滚滚',
            feedbackWrong: '不是这个寓意，水与财富有关',
            hints: ['水=财', '滚滚']
        }
    ],
    artifact: [
        {
            title: '古琴',
            question: '古琴通常有几根弦？',
            type: 'choice',
            options: [
                { text: '五根' },
                { text: '六根' },
                { text: '七根' },
                { text: '八根' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！古琴有七根弦',
            feedbackWrong: '不是这个数量，想想"七弦琴"',
            hints: ['又称七弦琴', '古老的弹拨乐器']
        },
        {
            title: '古筝',
            question: '古筝通常有几根弦？',
            type: 'choice',
            options: [
                { text: '16根' },
                { text: '21根' },
                { text: '25根' },
                { text: '28根' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！现代古筝通常有21根弦',
            feedbackWrong: '不是这个数量，常见的古筝弦数',
            hints: ['现代标准配置', '21根弦']
        },
        {
            title: '传统茶具',
            question: '请将茶具名称与用途匹配',
            type: 'matching',
            pairs: [['茶壶', '泡茶'], ['茶杯', '饮茶'], ['茶盘', '承托'], ['茶盏', '品茗']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['茶壶用来泡茶', '茶杯用来喝茶']
        },
        {
            title: '编钟',
            question: '编钟是什么时期的代表性乐器？',
            type: 'choice',
            options: [
                { text: '夏商' },
                { text: '商周' },
                { text: '秦汉' },
                { text: '唐宋' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！编钟是商周时期的代表性乐器',
            feedbackWrong: '不是这个时期，曾侯乙编钟很有名',
            hints: ['曾侯乙编钟', '春秋战国时期']
        },
        {
            title: '青花瓷',
            question: '青花瓷最早出现于哪个朝代？',
            type: 'choice',
            options: [
                { text: '唐代' },
                { text: '宋代' },
                { text: '元代' },
                { text: '明代' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！青花瓷最早出现于唐代',
            feedbackWrong: '不是这个朝代，唐代就有原始青花',
            hints: ['最早在唐代', '成熟于元代']
        },
        {
            title: '紫砂壶',
            question: '紫砂壶的主要产地是哪里？',
            type: 'choice',
            options: [
                { text: '景德镇' },
                { text: '宜兴' },
                { text: '龙泉' },
                { text: '德化' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！紫砂壶产自江苏宜兴',
            feedbackWrong: '不是这个地方，宜兴紫砂壶最有名',
            hints: ['江苏宜兴', '紫砂之都']
        },
        {
            title: '青铜鼎',
            question: '青铜鼎最初的用途是什么？',
            type: 'choice',
            options: [
                { text: '祭祀礼器' },
                { text: '烹饪器具' },
                { text: '装饰摆件' },
                { text: '兵器' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！青铜鼎最初是祭祀礼器',
            feedbackWrong: '不是这个用途，与祭祀有关',
            hints: ['国之重器', '祭祀用']
        },
        {
            title: '书法工具',
            question: '文房四宝不包括？',
            type: 'choice',
            options: [
                { text: '笔' },
                { text: '墨' },
                { text: '纸' },
                { text: '砚台' },
                { text: '印章' }
            ],
            correctAnswer: 4,
            feedbackCorrect: '正确！文房四宝是笔墨纸砚',
            feedbackWrong: '这个是文房四宝之一，找出不属于的',
            hints: ['笔墨纸砚是文房四宝', '哪个不在其中？']
        },
        {
            title: '琵琶',
            question: '琵琶属于哪种类型的乐器？',
            type: 'choice',
            options: [
                { text: '吹奏乐器' },
                { text: '弹拨乐器' },
                { text: '打击乐器' },
                { text: '拉弦乐器' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！琵琶是弹拨乐器',
            feedbackWrong: '不是这种类型，用手拨弦演奏',
            hints: ['用手拨弦', '弹拨乐器']
        },
        {
            title: '玉器',
            question: '古代玉器的主要用途不包括？',
            type: 'choice',
            options: [
                { text: '祭祀' },
                { text: '礼仪' },
                { text: '装饰' },
                { text: '烹饪' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！玉器不用来烹饪',
            feedbackWrong: '这个是玉器的用途，找出不是的',
            hints: ['哪个与吃有关？', '玉器不能加热']
        },
        {
            title: '青铜器',
            question: '青铜器的主要成分是什么？',
            type: 'choice',
            options: [
                { text: '铜和铁' },
                { text: '铜和锡' },
                { text: '铜和铝' },
                { text: '铜和铅' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！青铜器主要由铜和锡组成',
            feedbackWrong: '不是这个成分，青铜是铜合金',
            hints: ['铜和锡', '合金']
        },
        {
            title: '瓷器',
            question: '瓷器和陶器的主要区别是什么？',
            type: 'choice',
            options: [
                { text: '颜色' },
                { text: '烧制温度' },
                { text: '用途' },
                { text: '产地' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！瓷器烧制温度更高',
            feedbackWrong: '不是这个区别，与温度有关',
            hints: ['温度', '高温']
        },
        {
            title: '漆器',
            question: '漆器的主要特点是什么？',
            type: 'choice',
            options: [
                { text: '坚硬耐用' },
                { text: '光亮美观' },
                { text: '重量轻' },
                { text: '价格便宜' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！漆器光亮美观',
            feedbackWrong: '不是这个特点，漆器很光亮',
            hints: ['光亮', '美观']
        },
        {
            title: '传统乐器匹配',
            question: '请将乐器与类别匹配',
            type: 'matching',
            pairs: [['古筝', '弹拨乐器'], ['二胡', '拉弦乐器'], ['笛子', '吹奏乐器'], ['鼓', '打击乐器']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['古筝用手弹', '二胡用弓拉']
        },
        {
            title: '书法工具',
            question: '毛笔的笔头通常用什么材料制作？',
            type: 'choice',
            options: [
                { text: '羊毛' },
                { text: '狼毫' },
                { text: '鼠须' },
                { text: '以上都对' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！毛笔笔头材料多样',
            feedbackWrong: '不止一种材料',
            hints: ['多种材料', '都可以']
        },
        {
            title: '古代兵器',
            question: '以下哪种不是古代兵器？',
            type: 'choice',
            options: [
                { text: '剑' },
                { text: '戟' },
                { text: '矛' },
                { text: '砚' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！砚是文房四宝之一',
            feedbackWrong: '这个是兵器，找出不是兵器的',
            hints: ['文房四宝', '写字用的']
        },
        {
            title: '丝绸',
            question: '丝绸的主要原料是什么？',
            type: 'choice',
            options: [
                { text: '棉花' },
                { text: '蚕丝' },
                { text: '羊毛' },
                { text: '麻' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！丝绸由蚕丝制成',
            feedbackWrong: '不是这个原料，丝绸来自蚕',
            hints: ['蚕', '丝']
        },
        {
            title: '古代建筑',
            question: '斗拱在古代建筑中的作用是什么？',
            type: 'choice',
            options: [
                { text: '装饰' },
                { text: '承重' },
                { text: '排水' },
                { text: '通风' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！斗拱主要用于承重',
            feedbackWrong: '不是这个作用，斗拱很重要',
            hints: ['支撑', '结构']
        },
        {
            title: '古代灯具',
            question: '古代油灯通常用什么作为燃料？',
            type: 'choice',
            options: [
                { text: '汽油' },
                { text: '植物油' },
                { text: '煤油' },
                { text: '天然气' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！古代油灯用植物油',
            feedbackWrong: '不是这个燃料，古代没有汽油',
            hints: ['植物', '油']
        }
    ],
    xinjiang: [
        {
            title: '新疆全称',
            question: '新疆维吾尔自治区的全称是什么？',
            type: 'choice',
            options: [
                { text: '新疆自治区' },
                { text: '新疆维吾尔自治区' },
                { text: '新疆省' },
                { text: '西域自治区' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！新疆的全称是新疆维吾尔自治区',
            feedbackWrong: '不是这个，新疆是维吾尔自治区',
            hints: ['维吾尔', '自治区']
        },
        {
            title: '新疆首府',
            question: '新疆维吾尔自治区的首府是哪个城市？',
            type: 'choice',
            options: [
                { text: '喀什' },
                { text: '伊宁' },
                { text: '乌鲁木齐' },
                { text: '库尔勒' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！乌鲁木齐是新疆的首府',
            feedbackWrong: '不是这个城市，想想新疆最大的城市',
            hints: ['乌市', '首府']
        },
        {
            title: '新疆民族',
            question: '新疆是多民族聚居地区，主要民族不包括？',
            type: 'choice',
            options: [
                { text: '维吾尔族' },
                { text: '汉族' },
                { text: '哈萨克族' },
                { text: '朝鲜族' }
            ],
            correctAnswer: 3,
            feedbackCorrect: '正确！朝鲜族主要分布在东北地区',
            feedbackWrong: '这个民族在新疆有分布，朝鲜族主要在东北',
            hints: ['东北', '延边']
        },
        {
            title: '新疆美食',
            question: '新疆著名的特色美食"烤包子"的维吾尔语名称是什么？',
            type: 'choice',
            options: [
                { text: '馕' },
                { text: '萨依布' },
                { text: '薄皮包子' },
                { text: '喀尔瓦克' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！烤包子的维吾尔语是"萨依布"',
            feedbackWrong: '不是这个，馕是另一种食物',
            hints: ['萨依布', '烤包子']
        },
        {
            title: '新疆水果',
            question: '新疆被誉为"瓜果之乡"，以下哪种水果不是新疆特产？',
            type: 'choice',
            options: [
                { text: '哈密瓜' },
                { text: '阿克苏苹果' },
                { text: '沙田柚' },
                { text: '库尔勒香梨' }
            ],
            correctAnswer: 2,
            feedbackCorrect: '正确！沙田柚是广西特产',
            feedbackWrong: '这个是新疆特产，想想哪个是南方水果',
            hints: ['南方', '柚子']
        },
        {
            title: '新疆舞蹈',
            question: '新疆维吾尔族最具代表性的舞蹈是什么？',
            type: 'choice',
            options: [
                { text: '锅庄舞' },
                { text: '麦西来甫' },
                { text: '安代舞' },
                { text: '摆手舞' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！麦西来甫是维吾尔族传统舞蹈',
            feedbackWrong: '不是这个，锅庄舞是藏族的',
            hints: ['维吾尔族', '麦西来甫']
        },
        {
            title: '新疆建筑',
            question: '新疆具有特色的传统建筑是什么？',
            type: 'choice',
            options: [
                { text: '窑洞' },
                { text: '阿以旺' },
                { text: '吊脚楼' },
                { text: '四合院' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！阿以旺是新疆传统民居',
            feedbackWrong: '不是这个，窑洞在陕北',
            hints: ['维吾尔族', '民居']
        },
        {
            title: '新疆音乐',
            question: '新疆维吾尔族的传统弹拨乐器是什么？',
            type: 'choice',
            options: [
                { text: '马头琴' },
                { text: '热瓦普' },
                { text: '冬不拉' },
                { text: '月琴' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！热瓦普是维吾尔族弹拨乐器',
            feedbackWrong: '不是这个，马头琴是蒙古族的',
            hints: ['维吾尔族', '弹拨乐器']
        },
        {
            title: '新疆节日',
            question: '维吾尔族最重要的传统节日是什么？',
            type: 'choice',
            options: [
                { text: '泼水节' },
                { text: '古尔邦节' },
                { text: '那达慕' },
                { text: '三月三' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！古尔邦节是维吾尔族重要节日',
            feedbackWrong: '不是这个，泼水节是傣族的',
            hints: ['宰牲节', '重要节日']
        },
        {
            title: '新疆地理',
            question: '新疆最大的沙漠是什么？',
            type: 'choice',
            options: [
                { text: '塔克拉玛干沙漠' },
                { text: '古尔班通古特沙漠' },
                { text: '巴丹吉林沙漠' },
                { text: '腾格里沙漠' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！塔克拉玛干是中国最大的沙漠',
            feedbackWrong: '不是这个，塔克拉玛干在新疆南部',
            hints: ['最大', '沙漠']
        },
        {
            title: '新疆特产匹配',
            question: '请将新疆特产与产地匹配',
            type: 'matching',
            pairs: [['哈密瓜', '哈密'], ['香梨', '库尔勒'], ['葡萄', '吐鲁番'], ['大枣', '和田']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['哈密的哈密瓜', '库尔勒的香梨']
        },
        {
            title: '新疆文化',
            question: '新疆各民族文化是中华文化的重要组成部分，以下说法正确的是？',
            type: 'choice',
            options: [
                { text: '新疆文化与中华文化无关' },
                { text: '新疆各民族文化是中华文化的一部分' },
                { text: '新疆文化独立于中华文化' },
                { text: '新疆文化不属于中华文化' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！新疆各民族文化是中华文化的重要组成部分',
            feedbackWrong: '这种说法错误，新疆文化是中华文化的一部分',
            hints: ['中华文化', '组成部分']
        },
        {
            title: '新疆历史',
            question: '新疆正式纳入中国版图是在哪个朝代？',
            type: 'choice',
            options: [
                { text: '唐朝' },
                { text: '汉朝' },
                { text: '元朝' },
                { text: '清朝' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！汉朝时期新疆正式纳入中国版图',
            feedbackWrong: '不是这个朝代，汉朝设立西域都护府',
            hints: ['西域都护府', '汉朝']
        },
        {
            title: '新疆风景',
            question: '新疆著名的"天池"位于哪里？',
            type: 'choice',
            options: [
                { text: '伊犁' },
                { text: '乌鲁木齐' },
                { text: '喀什' },
                { text: '吐鲁番' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！天池位于乌鲁木齐附近的天山',
            feedbackWrong: '不是这个地方，天池在天山',
            hints: ['天山', '乌鲁木齐']
        },
        {
            title: '新疆民族乐器',
            question: '请将乐器与民族匹配',
            type: 'matching',
            pairs: [['热瓦普', '维吾尔族'], ['冬不拉', '哈萨克族'], ['马头琴', '蒙古族'], ['都塔尔', '维吾尔族']],
            feedbackCorrect: '匹配正确！',
            feedbackWrong: '匹配有误，请重试',
            hints: ['冬不拉是哈萨克族的', '马头琴是蒙古族的']
        },
        {
            title: '新疆美食',
            question: '新疆的"大盘鸡"起源于哪个城市？',
            type: 'choice',
            options: [
                { text: '乌鲁木齐' },
                { text: '沙湾' },
                { text: '喀什' },
                { text: '伊宁' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！大盘鸡起源于沙湾',
            feedbackWrong: '不是这个城市，大盘鸡起源于沙湾县',
            hints: ['沙湾', '大盘鸡']
        },
        {
            title: '新疆服饰',
            question: '维吾尔族传统服饰的特点是什么？',
            type: 'choice',
            options: [
                { text: '长袍宽袖' },
                { text: '色彩鲜艳' },
                { text: '紧身短衣' },
                { text: '黑色为主' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！维吾尔族服饰色彩鲜艳',
            feedbackWrong: '不是这个特点，维吾尔族服饰很鲜艳',
            hints: ['鲜艳', '多彩']
        },
        {
            title: '新疆地理',
            question: '新疆的地形特点被称为？',
            type: 'choice',
            options: [
                { text: '三山夹两盆' },
                { text: '高原盆地' },
                { text: '平原丘陵' },
                { text: '山地高原' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！新疆地形是三山夹两盆',
            feedbackWrong: '不是这个描述，想想阿尔泰山、天山、昆仑山',
            hints: ['三座山', '两个盆地']
        },
        {
            title: '新疆特产',
            question: '新疆的"和田玉"闻名天下，和田玉主要产自哪里？',
            type: 'choice',
            options: [
                { text: '和田地区' },
                { text: '喀什地区' },
                { text: '阿克苏地区' },
                { text: '伊犁地区' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！和田玉主要产自和田地区',
            feedbackWrong: '不是这个地区，和田玉以产地命名',
            hints: ['和田', '玉']
        },
        {
            title: '新疆文化',
            question: '以下哪项是新疆非物质文化遗产？',
            type: 'choice',
            options: [
                { text: '京剧' },
                { text: '木卡姆艺术' },
                { text: '昆曲' },
                { text: '粤剧' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！木卡姆是新疆的非物质文化遗产',
            feedbackWrong: '不是这个，木卡姆是维吾尔族的',
            hints: ['维吾尔族', '音乐']
        },
        {
            title: '新疆节日',
            question: '维吾尔族的开斋节又叫什么？',
            type: 'choice',
            options: [
                { text: '肉孜节' },
                { text: '古尔邦节' },
                { text: '那吾鲁孜节' },
                { text: '圣姑太节' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！开斋节又叫肉孜节',
            feedbackWrong: '不是这个，古尔邦节是另一个节日',
            hints: ['肉孜节', '开斋节']
        },
        {
            title: '新疆水果',
            question: '新疆吐鲁番的葡萄为什么特别甜？',
            type: 'choice',
            options: [
                { text: '品种好' },
                { text: '日照充足，昼夜温差大' },
                { text: '浇水多' },
                { text: '施肥多' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！日照充足、昼夜温差大让葡萄更甜',
            feedbackWrong: '不是这个原因，与气候有关',
            hints: ['日照', '温差']
        },
        {
            title: '新疆民族',
            question: '新疆人口最多的少数民族是？',
            type: 'choice',
            options: [
                { text: '哈萨克族' },
                { text: '维吾尔族' },
                { text: '回族' },
                { text: '柯尔克孜族' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！维吾尔族是新疆人口最多的少数民族',
            feedbackWrong: '不是这个民族，维吾尔族人口最多',
            hints: ['人口最多', '维吾尔族']
        },
        {
            title: '新疆旅游',
            question: '新疆的"喀纳斯湖"以什么闻名？',
            type: 'choice',
            options: [
                { text: '高山湖泊美景' },
                { text: '沙漠风光' },
                { text: '古城遗址' },
                { text: '温泉' }
            ],
            correctAnswer: 0,
            feedbackCorrect: '正确！喀纳斯湖以高山湖泊美景闻名',
            feedbackWrong: '不是这个，喀纳斯是湖泊',
            hints: ['湖泊', '美景']
        },
        {
            title: '新疆文化',
            question: '新疆各民族始终保持着怎样的文化关系？',
            type: 'choice',
            options: [
                { text: '相互隔绝' },
                { text: '相互交融、共同发展' },
                { text: '相互排斥' },
                { text: '各自独立' }
            ],
            correctAnswer: 1,
            feedbackCorrect: '正确！新疆各民族文化相互交融、共同发展',
            feedbackWrong: '这种说法错误，各民族文化相互交融',
            hints: ['交融', '发展']
        }
    ]
};

class AIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('aiToggleBtn').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('aiCloseBtn').addEventListener('click', () => {
            this.hideChat();
        });

        document.getElementById('aiSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('aiInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const container = document.getElementById('aiAssistantContainer');
        if (container.style.display === 'none' || container.style.display === '') {
            this.showChat();
        } else {
            this.hideChat();
        }
    }

    showChat() {
        document.getElementById('aiAssistantContainer').style.display = 'flex';
        document.getElementById('aiToggleBtn').textContent = '✕';
    }

    hideChat() {
        document.getElementById('aiAssistantContainer').style.display = 'none';
        document.getElementById('aiToggleBtn').textContent = '🤖';
    }

    sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;

        this.addMessage(message, 'user');
        input.value = '';
        this.isTyping = true;
        
        this.addTypingIndicator();
        
        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
            this.isTyping = false;
        }, 800 + Math.random() * 500);
    }

    addMessage(content, sender) {
        const chatArea = document.getElementById('aiChatArea');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-msg-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-msg-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        chatArea.appendChild(messageDiv);
        
        this.chatHistory.push({ sender, content });
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    addTypingIndicator() {
        const chatArea = document.getElementById('aiChatArea');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-typing';
        typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        chatArea.appendChild(typingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    removeTypingIndicator() {
        const typingDiv = document.querySelector('.ai-typing');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (this.isGreeting(lowerMessage)) {
            return this.getGreetingResponse(lowerMessage);
        }
        
        if (this.isGoodbye(lowerMessage)) {
            return this.getGoodbyeResponse();
        }
        
        if (this.isSmallTalk(lowerMessage)) {
            return this.getSmallTalkResponse(lowerMessage);
        }
        
        const culturalAnswer = this.getCulturalAnswer(lowerMessage);
        if (culturalAnswer) {
            return culturalAnswer;
        }
        
        return this.getDefaultResponse();
    }

    isGreeting(message) {
        return /你好|您好|嗨|hello|hi|哈喽/.test(message);
    }

    getGreetingResponse(message) {
        const responses = [
            '你好呀！我是你的AI文化助手，有什么想了解的传统文化知识吗？',
            '您好！很高兴为您服务，请问有什么可以帮助您的？',
            '嗨！我可以帮您解答关于诗词、非遗、民俗等传统文化问题哦~'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    isGoodbye(message) {
        return /再见|拜拜|再见了|88/.test(message);
    }

    getGoodbyeResponse() {
        const responses = [
            '再见！希望下次还能帮到您~',
            '拜拜！祝您学习愉快！',
            '再见啦，继续加油闯关哦！'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    isSmallTalk(message) {
        return /你好吗|你是谁|你叫什么|开心|快乐|天气|吃饭/.test(message);
    }

    getSmallTalkResponse(message) {
        if (/你是谁|你叫什么/.test(message)) {
            return '我是您的AI文化助手，专门为您解答中华传统文化相关的问题哦！';
        }
        if (/你好吗/.test(message)) {
            return '我很好呀！感谢您的关心~ 您有什么问题想问我吗？';
        }
        if (/开心|快乐/.test(message)) {
            return '看到您开心我也很开心！让我们一起探索传统文化的魅力吧~';
        }
        return '哈哈，我们来聊聊传统文化吧！您想了解诗词、非遗还是民俗呢？';
    }

    getCulturalAnswer(message) {
        const knowledgeBase = [
            {
                keywords: ['静夜思', '李白'],
                answer: '《静夜思》是唐代诗人李白的著名诗作，全诗为：床前明月光，疑是地上霜。举头望明月，低头思故乡。这首诗表达了诗人的思乡之情。'
            },
            {
                keywords: ['登鹳雀楼', '王之涣'],
                answer: '《登鹳雀楼》是唐代诗人王之涣的作品，全诗为：白日依山尽，黄河入海流。欲穷千里目，更上一层楼。诗中蕴含着"站得高，看得远"的哲理。'
            },
            {
                keywords: ['剪纸', '非遗'],
                answer: '剪纸是中国传统民间艺术，2006年被列入第一批国家级非物质文化遗产名录。剪纸艺术历史悠久，题材广泛，包括花鸟虫鱼、人物故事、吉祥图案等。'
            },
            {
                keywords: ['春节', '新年'],
                answer: '春节是中国最重要的传统节日，农历正月初一为新年第一天。传统习俗包括贴春联、放鞭炮、吃年夜饭、拜年、发红包等。'
            },
            {
                keywords: ['端午节', '粽子'],
                answer: '端午节在农历五月初五，是纪念屈原的传统节日。主要习俗有吃粽子、赛龙舟、挂艾草菖蒲、佩香囊等。'
            },
            {
                keywords: ['中秋节', '月饼'],
                answer: '中秋节在农历八月十五，是团圆的节日。传统习俗包括赏月、吃月饼、提灯笼等。月饼象征着团圆美满。'
            },
            {
                keywords: ['祥云', '纹样'],
                answer: '祥云纹是中国传统吉祥纹样之一，象征吉祥、喜庆、好运。祥云纹常出现在古代建筑、服饰、瓷器等艺术品上。'
            },
            {
                keywords: ['古琴', '乐器'],
                answer: '古琴是中国传统弹拨乐器，有三千多年的历史。古琴音域宽广，音色深沉，余音悠远，是中国古代文人修身养性的重要工具。'
            },
            {
                keywords: ['青花瓷', '瓷器'],
                answer: '青花瓷是中国传统瓷器工艺，以钴蓝料在白瓷上绘制图案，再经高温烧成。青花瓷始于唐代，成熟于元代，是中国瓷器的代表之一。'
            },
            {
                keywords: ['二十四节气', '节气'],
                answer: '二十四节气是中国古代订立的一种用来指导农事的补充历法，包括立春、雨水、惊蛰、春分、清明、谷雨等二十四个节气。'
            },
            {
                keywords: ['活字印刷', '毕昇'],
                answer: '活字印刷术是北宋毕昇发明的，是中国古代四大发明之一。活字印刷的出现大大提高了印刷效率，对人类文明的传播做出了巨大贡献。'
            },
            {
                keywords: ['皮影戏', '皮影'],
                answer: '皮影戏是中国传统民间戏剧形式，用兽皮或纸板做成人物剪影，在灯光照射下用隔亮布进行表演。2011年入选人类非物质文化遗产代表作名录。'
            },
            {
                keywords: ['刺绣', '苏绣'],
                answer: '刺绣是中国传统工艺，苏绣、湘绣、粤绣、蜀绣并称为中国四大名绣。苏绣以精细雅洁著称，针法丰富多变。'
            },
            {
                keywords: ['陶瓷', '景德镇'],
                answer: '景德镇是中国著名的瓷都，以生产精美瓷器闻名于世。景德镇瓷器工艺精湛，品种繁多，青花瓷、粉彩瓷、玲珑瓷等尤为著名。'
            },
            {
                keywords: ['书法', '毛笔'],
                answer: '书法是中国传统艺术形式，使用毛笔书写汉字。书法讲究笔法、结构和章法，是中华民族文化的重要组成部分。'
            }
        ];

        for (const item of knowledgeBase) {
            for (const keyword of item.keywords) {
                if (message.includes(keyword)) {
                    return item.answer;
                }
            }
        }

        return null;
    }

    getDefaultResponse() {
        const responses = [
            '这个问题我还在学习中呢！不过我可以帮您解答诗词、非遗、民俗等方面的问题哦~',
            '抱歉，这个问题我暂时不太了解。您可以问问我关于传统文化的问题！',
            '有意思的问题！让我们一起学习更多传统文化知识吧~',
            '您的问题很有趣！我会努力学习更多知识来回答您~'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

const game = new Game();
const aiAssistant = new AIAssistant();