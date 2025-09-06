class FlappyVirusGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.virus = document.getElementById('virus');
        this.obstacles = document.getElementById('obstacles');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.hiddenScoreElement = document.getElementById('hiddenScore');
        this.startBtn = document.getElementById('startBtn');
        this.jumpBtn = document.getElementById('jumpBtn');
        this.energyBar = document.getElementById('energyBar');
        this.energyFill = document.getElementById('energyFill');
        this.powerUps = document.getElementById('powerUps');
        this.virusCount = document.getElementById('virusCount');
        this.levelIndicator = document.getElementById('levelIndicator');
        this.gravityIndicator = document.getElementById('gravityIndicator');
        
        this.gameRunning = false;
        this.score = 0;
        this.virusY = 50;
        this.virusVelocity = 0;
        this.gravity = 0.3; // جاذبية أقل
        this.jumpPower = -2.5; // قوة قفز صغيرة جداً
        this.obstacleSpeed = 2;
        this.obstacleGap = 180; // فجوة أكبر بين العواميد
        this.obstacleWidth = 60;
        this.obstacleFrequency = 120;
        this.frameCount = 0;
        this.animationId = null;
        
        // الميزات الجديدة
        this.energy = 100;
        this.maxEnergy = 100;
        this.level = 1;
        this.virusClones = [];
        this.activePowerUps = [];
        this.specialAbilities = {
            infection: false,
            energyBurst: false,
            timeSlow: false,
            shield: false
        };
        this.abilityCooldowns = {
            infection: 0,
            energyBurst: 0,
            timeSlow: 0,
            shield: 0
        };
        this.lastJumpTime = 0;
        this.jumpCooldown = 50; // منع القفز المتكرر السريع
        this.infectionRadius = 0;
        this.shieldActive = false;
        this.timeSlowActive = false;
        this.slowFactor = 1;
        
        // نظام التحديات والإنجازات
        this.challenges = {
            score100: { completed: false, progress: 0, target: 100, reward: 50 },
            powerUps5: { completed: false, progress: 0, target: 5, reward: 100 },
            level5: { completed: false, progress: 0, target: 5, reward: 200 }
        };
        this.achievements = {
            first100: { unlocked: false, condition: 'score', value: 100 },
            powerMaster: { unlocked: false, condition: 'powerUps', value: 10 },
            virusKing: { unlocked: false, condition: 'level', value: 10 }
        };
        this.stats = {
            totalScore: 0,
            totalPowerUps: 0,
            maxLevel: 1,
            gamesPlayed: 0,
            totalTime: 0
        };
        
        this.setupEventListeners();
        this.createParticles();
        this.initializePowerUps();
        this.setupSpecialEffects();
        this.loadGameData();
        this.initializeAudio();
    }
    
    setupEventListeners() {
        // زر القفز
        this.jumpBtn.addEventListener('click', () => this.jump());
        
        // لوحة المفاتيح - تحسين استجابة مفتاح المسافة
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                if (this.gameRunning) {
                    this.jump();
                } else if (e.code === 'Space') {
                    // بدء اللعبة بمفتاح المسافة إذا لم تكن تعمل
                    this.startGame();
                }
            }
        });
        
        // منع التمرير عند الضغط على المسافة
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        // اللمس للهواتف
        this.gameBoard.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.jump();
            } else {
                this.startGame();
            }
        });
        
        // النقر للهواتف
        this.gameBoard.addEventListener('click', (e) => {
            if (this.gameRunning) {
                this.jump();
            } else {
                this.startGame();
            }
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.virusY = 50;
        this.virusVelocity = 0;
        this.frameCount = 0;
        this.energy = 100;
        this.level = 1;
        this.virusClones = [];
        this.stats.gamesPlayed++;
        
        // إعادة تعيين الإعدادات
        this.obstacleSpeed = 2;
        this.obstacleFrequency = 120;
        this.gravity = 0.3; // جاذبية أقل
        this.jumpPower = -2.5; // قوة قفز صغيرة جداً
        this.slowFactor = 1;
        
        // إخفاء شاشة انتهاء اللعبة
        this.gameOverElement.style.display = 'none';
        
        // تفعيل أزرار التحكم
        this.startBtn.disabled = true;
        this.jumpBtn.disabled = false;
        
        // مسح العقبات والفيروسات المستنسخة
        this.obstacles.innerHTML = '';
        this.virusClones.forEach(clone => clone.remove());
        this.virusClones = [];
        
        // تحديث الواجهة
        this.updateScore();
        this.updateEnergyBar();
        this.updateVirusCount();
        this.updateLevel();
        this.updateGravityIndicator();
        this.updateChallengeUI();
        
        // إضافة لوحة الإحصائيات
        this.createStatsPanel();
        
        // بدء الموسيقى
        this.startBackgroundMusic();
        
        // بدء حلقة اللعبة
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        // تطبيق عامل الإبطاء
        if (this.timeSlowActive) {
            if (this.frameCount % Math.ceil(1 / this.slowFactor) === 0) {
                this.updateVirus();
                this.updateObstacles();
                this.checkCollisions();
            }
        } else {
            this.updateVirus();
            this.updateObstacles();
            this.checkCollisions();
        }
        
        this.updateScore();
        this.updateEnergy();
        this.updateLevel();
        this.updateCooldowns();
        this.updateStats();
        
        this.frameCount++;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    updateVirus() {
        // تطبيق الجاذبية مع تعديل حسب المرحلة
        const currentGravity = this.calculateGravity();
        this.virusVelocity += currentGravity;
        this.virusY += this.virusVelocity;
        
        // تحديث موقع الفيروس
        this.virus.style.top = this.virusY + '%';
        
        // دوران الفيروس حسب السرعة مع تأثير محسن
        const rotation = Math.min(Math.max(this.virusVelocity * 4, -30), 30);
        this.virus.style.transform = `translateY(-50%) rotate(${rotation}deg)`;
        
        // تأثير بصري للجاذبية (تغيير حجم الفيروس حسب السرعة)
        const scale = 1 + Math.abs(this.virusVelocity) * 0.02;
        this.virus.style.transform += ` scale(${Math.min(scale, 1.3)})`;
        
        // تأثير جسيمات الجاذبية
        if (this.virusVelocity > 2 && Math.random() < 0.1) {
            this.createGravityParticles();
        }
        
        // التأكد من أن الفيروس لا يخرج من الشاشة
        if (this.virusY < 0) {
            this.virusY = 0;
            this.virusVelocity = 0;
        } else if (this.virusY > 100) {
            this.gameOver();
        }
    }
    
    calculateGravity() {
        // جاذبية متدرجة حسب المرحلة والطاقة
        let baseGravity = this.gravity;
        
        // زيادة الجاذبية تدريجياً مع كل مرحلة (أقل من السابق)
        const levelMultiplier = 1 + (this.level - 1) * 0.03;
        baseGravity *= levelMultiplier;
        
        // تقليل الجاذبية عند انخفاض الطاقة (صعوبة إضافية)
        const energyMultiplier = this.energy < 20 ? 1.05 : 1.0;
        baseGravity *= energyMultiplier;
        
        // تأثير إبطاء الوقت
        if (this.timeSlowActive) {
            baseGravity *= this.slowFactor;
        }
        
        return baseGravity;
    }
    
    updateObstacles() {
        // إنشاء عقبات جديدة
        if (this.frameCount % this.obstacleFrequency === 0) {
            this.createObstacle();
        }
        
        // تحريك العقبات
        const obstacleElements = this.obstacles.querySelectorAll('.obstacle');
        obstacleElements.forEach(obstacle => {
            const currentLeft = parseFloat(obstacle.style.left);
            obstacle.style.left = (currentLeft - this.obstacleSpeed) + 'px';
            
            // حذف العقبات التي خرجت من الشاشة
            if (currentLeft < -this.obstacleWidth) {
                obstacle.remove();
                this.score++;
                this.createParticleEffect(obstacle.offsetLeft, obstacle.offsetTop);
            }
        });
    }
    
    createObstacle() {
        const gameBoardHeight = this.gameBoard.offsetHeight;
        const gapPosition = Math.random() * (70 - 20) + 20; // موقع الفجوة بين 20% و 70%
        
        // العقبة العلوية
        const topObstacle = document.createElement('div');
        topObstacle.className = 'obstacle top';
        topObstacle.style.left = this.gameBoard.offsetWidth + 'px';
        topObstacle.style.height = (gapPosition * gameBoardHeight / 100) + 'px';
        topObstacle.style.width = this.obstacleWidth + 'px';
        
        // العقبة السفلية
        const bottomObstacle = document.createElement('div');
        bottomObstacle.className = 'obstacle bottom';
        bottomObstacle.style.left = this.gameBoard.offsetWidth + 'px';
        bottomObstacle.style.height = ((100 - gapPosition - this.obstacleGap / gameBoardHeight * 100) * gameBoardHeight / 100) + 'px';
        bottomObstacle.style.width = this.obstacleWidth + 'px';
        bottomObstacle.style.bottom = '0';
        
        this.obstacles.appendChild(topObstacle);
        this.obstacles.appendChild(bottomObstacle);
    }
    
    checkCollisions() {
        const virusRect = this.virus.getBoundingClientRect();
        const gameBoardRect = this.gameBoard.getBoundingClientRect();
        
        const virusLeft = virusRect.left - gameBoardRect.left;
        const virusTop = virusRect.top - gameBoardRect.top;
        const virusRight = virusLeft + virusRect.width;
        const virusBottom = virusTop + virusRect.height;
        
        const obstacles = this.obstacles.querySelectorAll('.obstacle');
        
        obstacles.forEach(obstacle => {
            const obstacleRect = obstacle.getBoundingClientRect();
            const obstacleLeft = obstacleRect.left - gameBoardRect.left;
            const obstacleTop = obstacleRect.top - gameBoardRect.top;
            const obstacleRight = obstacleLeft + obstacleRect.width;
            const obstacleBottom = obstacleTop + obstacleRect.height;
            
            // فحص التصادم
            if (virusLeft < obstacleRight && 
                virusRight > obstacleLeft && 
                virusTop < obstacleBottom && 
                virusBottom > obstacleTop) {
                
                // فحص الدرع
                if (this.shieldActive) {
                    // كسر الدرع بدلاً من انتهاء اللعبة
                    this.shieldActive = false;
                    this.specialAbilities.shield = false;
                    this.createShieldBreakEffect();
                    obstacle.remove(); // تدمير العقبة
                    this.score += 10; // نقاط إضافية
                } else {
                    this.gameOver();
                }
            }
        });
        
        // فحص تصادم مع الفيروسات المستنسخة
        this.virusClones.forEach(clone => {
            const cloneRect = clone.getBoundingClientRect();
            const cloneLeft = cloneRect.left - gameBoardRect.left;
            const cloneTop = cloneRect.top - gameBoardRect.top;
            const cloneRight = cloneLeft + cloneRect.width;
            const cloneBottom = cloneTop + cloneRect.height;
            
            if (virusLeft < cloneRight && 
                virusRight > cloneLeft && 
                virusTop < cloneBottom && 
                virusBottom > cloneTop) {
                // دمج الفيروسات المستنسخة
                clone.remove();
                this.virusClones = this.virusClones.filter(c => c !== clone);
                this.updateVirusCount();
                this.score += 20; // نقاط إضافية للدمج
                this.energy = Math.min(this.maxEnergy, this.energy + 10);
                this.updateEnergyBar();
                this.createVirusMergeEffect(cloneLeft, cloneTop);
            }
        });
    }
    
    createShieldBreakEffect() {
        // تأثير كسر الدرع
        for (let i = 0; i < 10; i++) {
            const fragment = document.createElement('div');
            fragment.style.position = 'absolute';
            fragment.style.width = '4px';
            fragment.style.height = '4px';
            fragment.style.background = '#4ecdc4';
            fragment.style.left = (this.virus.offsetLeft + this.virus.offsetWidth / 2) + 'px';
            fragment.style.top = (this.virus.offsetTop + this.virus.offsetHeight / 2) + 'px';
            fragment.style.animation = `energyBurst 1s ease-out forwards`;
            fragment.style.transform = `rotate(${i * 36}deg) translateX(30px)`;
            this.gameBoard.appendChild(fragment);
            
            setTimeout(() => fragment.remove(), 1000);
        }
    }
    
    createVirusMergeEffect(x, y) {
        // تأثير دمج الفيروسات
        const mergeEffect = document.createElement('div');
        mergeEffect.style.position = 'absolute';
        mergeEffect.style.left = x + 'px';
        mergeEffect.style.top = y + 'px';
        mergeEffect.style.width = '50px';
        mergeEffect.style.height = '50px';
        mergeEffect.style.background = 'radial-gradient(circle, #ff6b6b, transparent)';
        mergeEffect.style.borderRadius = '50%';
        mergeEffect.style.animation = 'energyBurst 0.8s ease-out forwards';
        mergeEffect.style.pointerEvents = 'none';
        this.gameBoard.appendChild(mergeEffect);
        
        setTimeout(() => mergeEffect.remove(), 800);
    }
    
    jump() {
        if (!this.gameRunning) return;
        
        // منع القفز المتكرر السريع
        const currentTime = Date.now();
        if (currentTime - this.lastJumpTime < this.jumpCooldown) {
            return;
        }
        this.lastJumpTime = currentTime;
        
        // تحسين استجابة القفز
        this.virusVelocity = this.jumpPower;
        this.virus.classList.remove('falling');
        
        // تأثير بصري محسن للقفز
        this.createJumpEffect();
        
        // تأثير صوتي
        this.playSound('jump');
        
        // إضافة تأثير جسيمات للقفز
        this.createJumpParticles();
        
        // تحديث الطاقة عند القفز
        if (this.energy > 0) {
            this.energy = Math.max(0, this.energy - 0.5);
            this.updateEnergyBar();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        cancelAnimationFrame(this.animationId);
        
        // صوت انتهاء اللعبة
        this.playSound('gameOver');
        this.stopBackgroundMusic();
        
        // حفظ البيانات
        this.saveGameData();
        
        // إظهار شاشة انتهاء اللعبة
        this.gameOverElement.style.display = 'block';
        this.finalScoreElement.textContent = this.score;
        this.hiddenScoreElement.value = this.score;
        
        // تحديث الأزرار
        this.startBtn.disabled = false;
        this.jumpBtn.disabled = true;
        
        // تأثير انتهاء اللعبة
        this.virus.classList.add('falling');
        this.createGameOverEffect();
        
        // إزالة لوحة الإحصائيات
        const statsPanel = this.gameBoard.querySelector('.stats-panel');
        if (statsPanel) {
            statsPanel.remove();
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = `النقاط: ${this.score}`;
    }
    
    updateEnergy() {
        // استهلاك الطاقة تدريجياً
        if (this.frameCount % 60 === 0) { // كل ثانية
            this.energy = Math.max(0, this.energy - 1);
            this.updateEnergyBar();
        }
        
        // إضافة طاقة عند تجاوز العقبات
        if (this.score > 0 && this.frameCount % 120 === 0) {
            this.energy = Math.min(this.maxEnergy, this.energy + 2);
            this.updateEnergyBar();
        }
    }
    
    updateCooldowns() {
        // تحديث أوقات الانتظار للقدرات
        Object.keys(this.abilityCooldowns).forEach(ability => {
            if (this.abilityCooldowns[ability] > 0) {
                this.abilityCooldowns[ability]--;
            }
        });
    }
    
    createParticleEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.1) + 's';
            this.gameBoard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    createJumpEffect() {
        // تأثير بصري محسن للقفز (أقل دراماتيكية)
        this.virus.style.transform = 'translateY(-50%) scale(1.1) rotate(-5deg)';
        this.virus.style.transition = 'transform 0.1s ease-out';
        
        setTimeout(() => {
            this.virus.style.transform = 'translateY(-50%) scale(1) rotate(0deg)';
        }, 120);
        
        // إضافة تأثير اهتزاز خفيف
        this.virus.style.animation = 'jumpShake 0.15s ease-out';
        setTimeout(() => {
            this.virus.style.animation = '';
        }, 150);
    }
    
    createJumpParticles() {
        // إنشاء جسيمات للقفز
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'jump-particle';
            particle.style.position = 'absolute';
            particle.style.left = (this.virus.offsetLeft + this.virus.offsetWidth / 2) + 'px';
            particle.style.top = (this.virus.offsetTop + this.virus.offsetHeight / 2) + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = 'radial-gradient(circle, #ffd700, #ff6b6b)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '15';
            
            // توزيع الجسيمات في اتجاهات مختلفة
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            particle.style.animation = `jumpParticle 0.8s ease-out forwards`;
            particle.style.setProperty('--end-x', endX + 'px');
            particle.style.setProperty('--end-y', endY + 'px');
            
            this.gameBoard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 800);
        }
    }
    
    createGravityParticles() {
        // إنشاء جسيمات للجاذبية
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement('div');
            particle.className = 'gravity-particle';
            particle.style.position = 'absolute';
            particle.style.left = (this.virus.offsetLeft + Math.random() * this.virus.offsetWidth) + 'px';
            particle.style.top = (this.virus.offsetTop + this.virus.offsetHeight) + 'px';
            particle.style.width = '3px';
            particle.style.height = '3px';
            particle.style.background = 'rgba(255, 255, 255, 0.6)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '5';
            
            // حركة الجسيمات نحو الأسفل
            const fallDistance = 20 + Math.random() * 30;
            particle.style.animation = `gravityParticle 1s ease-out forwards`;
            particle.style.setProperty('--fall-distance', fallDistance + 'px');
            
            this.gameBoard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    createGameOverEffect() {
        // تأثير اهتزاز عند انتهاء اللعبة
        this.gameBoard.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.gameBoard.style.animation = '';
        }, 500);
    }
    
    createParticles() {
        // إضافة جسيمات متحركة في الخلفية
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = 'rgba(255, 255, 255, 0.3)';
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animation = `float ${2 + Math.random() * 3}s ease-in-out infinite`;
            particle.style.animationDelay = Math.random() * 2 + 's';
            this.gameBoard.appendChild(particle);
        }
    }
    
    // الميزات الجديدة
    initializePowerUps() {
        const powerUpTypes = [
            { icon: '🦠', name: 'عدوى', cost: 20, ability: 'infection' },
            { icon: '⚡', name: 'انفجار طاقة', cost: 30, ability: 'energyBurst' },
            { icon: '⏰', name: 'إبطاء الوقت', cost: 25, ability: 'timeSlow' },
            { icon: '🛡️', name: 'درع', cost: 40, ability: 'shield' }
        ];
        
        powerUpTypes.forEach((powerUp, index) => {
            const powerUpElement = document.createElement('div');
            powerUpElement.className = 'power-up';
            powerUpElement.innerHTML = powerUp.icon;
            powerUpElement.title = `${powerUp.name} (${powerUp.cost} طاقة)`;
            powerUpElement.addEventListener('click', () => this.activatePowerUp(powerUp));
            this.powerUps.appendChild(powerUpElement);
        });
    }
    
    setupSpecialEffects() {
        // إضافة تأثيرات خاصة للعبة
        this.createSpecialBackground();
    }
    
    createSpecialBackground() {
        // إضافة خلفية ديناميكية
        const background = document.createElement('div');
        background.style.position = 'absolute';
        background.style.top = '0';
        background.style.left = '0';
        background.style.width = '100%';
        background.style.height = '100%';
        background.style.background = 'radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(78, 205, 196, 0.1) 0%, transparent 50%)';
        background.style.pointerEvents = 'none';
        background.style.animation = 'float 10s ease-in-out infinite';
        this.gameBoard.appendChild(background);
    }
    
    activatePowerUp(powerUp) {
        if (this.energy < powerUp.cost || this.abilityCooldowns[powerUp.ability] > 0) {
            return;
        }
        
        this.energy -= powerUp.cost;
        this.abilityCooldowns[powerUp.ability] = 300; // 5 ثواني
        this.stats.totalPowerUps++;
        
        // تحديث تحديث القوى الخارقة
        this.updateChallengeProgress('powerUps5', this.stats.totalPowerUps);
        
        switch (powerUp.ability) {
            case 'infection':
                this.activateInfection();
                break;
            case 'energyBurst':
                this.activateEnergyBurst();
                break;
            case 'timeSlow':
                this.activateTimeSlow();
                break;
            case 'shield':
                this.activateShield();
                break;
        }
        
        this.updateEnergyBar();
        this.createPowerUpEffect();
        this.playSound('powerUp');
    }
    
    activateInfection() {
        this.specialAbilities.infection = true;
        this.infectionRadius = 100;
        
        // إنشاء موجة عدوى
        const infectionWave = document.createElement('div');
        infectionWave.className = 'infection-wave';
        infectionWave.style.left = (this.virus.offsetLeft + this.virus.offsetWidth / 2 - 50) + 'px';
        infectionWave.style.top = (this.virus.offsetTop + this.virus.offsetHeight / 2 - 50) + 'px';
        this.gameBoard.appendChild(infectionWave);
        
        // تحويل العقبات القريبة إلى فيروسات
        this.infectNearbyObstacles();
        
        // صوت العدوى
        this.playSound('infection');
        
        setTimeout(() => {
            this.specialAbilities.infection = false;
            infectionWave.remove();
        }, 1000);
    }
    
    infectNearbyObstacles() {
        const obstacles = this.obstacles.querySelectorAll('.obstacle');
        const virusRect = this.virus.getBoundingClientRect();
        const gameBoardRect = this.gameBoard.getBoundingClientRect();
        
        obstacles.forEach(obstacle => {
            const obstacleRect = obstacle.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(virusRect.left - obstacleRect.left, 2) + 
                Math.pow(virusRect.top - obstacleRect.top, 2)
            );
            
            if (distance < this.infectionRadius) {
                // تحويل العقبة إلى فيروس
                obstacle.style.background = 'linear-gradient(180deg, #ff6b6b, #ee5a24)';
                obstacle.innerHTML = '🦠';
                obstacle.style.display = 'flex';
                obstacle.style.alignItems = 'center';
                obstacle.style.justifyContent = 'center';
                obstacle.style.fontSize = '2rem';
                
        // إضافة نقاط إضافية
        this.score += 5;
        this.playSound('score');
            }
        });
    }
    
    activateEnergyBurst() {
        this.specialAbilities.energyBurst = true;
        
        // إنشاء انفجار طاقة
        for (let i = 0; i < 8; i++) {
            const burst = document.createElement('div');
            burst.className = 'energy-burst';
            burst.style.left = (this.virus.offsetLeft + this.virus.offsetWidth / 2) + 'px';
            burst.style.top = (this.virus.offsetTop + this.virus.offsetHeight / 2) + 'px';
            burst.style.transform = `rotate(${i * 45}deg) translateX(50px)`;
            this.gameBoard.appendChild(burst);
            
            setTimeout(() => burst.remove(), 500);
        }
        
        // زيادة الطاقة
        this.energy = Math.min(this.maxEnergy, this.energy + 50);
        
        setTimeout(() => {
            this.specialAbilities.energyBurst = false;
        }, 2000);
    }
    
    activateTimeSlow() {
        this.specialAbilities.timeSlow = true;
        this.timeSlowActive = true;
        this.slowFactor = 0.3;
        
        // تأثير بصري لإبطاء الوقت
        this.gameBoard.style.filter = 'hue-rotate(180deg) saturate(1.5)';
        
        setTimeout(() => {
            this.specialAbilities.timeSlow = false;
            this.timeSlowActive = false;
            this.slowFactor = 1;
            this.gameBoard.style.filter = 'none';
        }, 3000);
    }
    
    activateShield() {
        this.specialAbilities.shield = true;
        this.shieldActive = true;
        
        // إضافة درع حول الفيروس
        const shield = document.createElement('div');
        shield.style.position = 'absolute';
        shield.style.left = '-10px';
        shield.style.top = '-10px';
        shield.style.width = '60px';
        shield.style.height = '60px';
        shield.style.border = '3px solid #4ecdc4';
        shield.style.borderRadius = '50%';
        shield.style.animation = 'glow 0.5s infinite alternate';
        shield.style.pointerEvents = 'none';
        this.virus.appendChild(shield);
        
        setTimeout(() => {
            this.specialAbilities.shield = false;
            this.shieldActive = false;
            shield.remove();
        }, 5000);
    }
    
    createPowerUpEffect() {
        // تأثير بصري عند تفعيل القوة
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = (this.virus.offsetLeft + this.virus.offsetWidth / 2 - 25) + 'px';
        effect.style.top = (this.virus.offsetTop + this.virus.offsetHeight / 2 - 25) + 'px';
        effect.style.width = '50px';
        effect.style.height = '50px';
        effect.style.background = 'radial-gradient(circle, #ffd700, transparent)';
        effect.style.borderRadius = '50%';
        effect.style.animation = 'energyBurst 0.5s ease-out forwards';
        effect.style.pointerEvents = 'none';
        this.gameBoard.appendChild(effect);
        
        setTimeout(() => effect.remove(), 500);
    }
    
    updateEnergyBar() {
        const percentage = (this.energy / this.maxEnergy) * 100;
        this.energyFill.style.width = percentage + '%';
        
        // تغيير لون شريط الطاقة حسب المستوى
        if (percentage > 70) {
            this.energyFill.style.background = 'linear-gradient(90deg, #4ecdc4, #44a08d)';
        } else if (percentage > 30) {
            this.energyFill.style.background = 'linear-gradient(90deg, #ffd700, #ffed4e)';
        } else {
            this.energyFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a24)';
        }
    }
    
    updateVirusCount() {
        const totalViruses = 1 + this.virusClones.length;
        this.virusCount.textContent = `🦠 x${totalViruses}`;
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.score / 50) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelIndicator.textContent = `المرحلة ${this.level}`;
            this.showLevelUpEffect();
            this.increaseDifficulty();
        }
        this.updateGravityIndicator();
    }
    
    updateGravityIndicator() {
        const currentGravity = this.calculateGravity();
        const gravityLevel = currentGravity / this.gravity;
        
        if (gravityLevel <= 1.05) {
            this.gravityIndicator.textContent = 'الجاذبية: خفيفة';
            this.gravityIndicator.className = 'gravity-indicator';
        } else if (gravityLevel <= 1.15) {
            this.gravityIndicator.textContent = 'الجاذبية: عادية';
            this.gravityIndicator.className = 'gravity-indicator';
        } else {
            this.gravityIndicator.textContent = 'الجاذبية: متوسطة';
            this.gravityIndicator.className = 'gravity-indicator high';
        }
    }
    
    showLevelUpEffect() {
        const effect = document.createElement('div');
        effect.className = 'level-up-effect';
        effect.textContent = `المرحلة ${this.level}!`;
        this.gameBoard.appendChild(effect);
        
        // صوت المرحلة الجديدة
        this.playSound('levelUp');
        
        setTimeout(() => effect.remove(), 2000);
    }
    
    increaseDifficulty() {
        // زيادة صعوبة اللعبة مع كل مرحلة
        this.obstacleSpeed += 0.08; // زيادة أبطأ للسرعة
        this.obstacleFrequency = Math.max(100, this.obstacleFrequency - 3); // تقليل التردد تدريجياً
        
        // زيادة الجاذبية تدريجياً (أقل من السابق)
        this.gravity += 0.005;
        
        // تحسين قوة القفز مع المراحل المتقدمة (أقل من السابق)
        if (this.level % 4 === 0) {
            this.jumpPower -= 0.05; // قوة قفز أقوى قليلاً
        }
        
        // إضافة فيروس جديد كل 5 مراحل (أقل تكراراً)
        if (this.level % 5 === 0) {
            this.createVirusClone();
        }
        
        // إضافة طاقة إضافية عند الوصول لمرحلة جديدة
        this.energy = Math.min(this.maxEnergy, this.energy + 20);
        this.updateEnergyBar();
    }
    
    createVirusClone() {
        const clone = document.createElement('div');
        clone.className = 'virus-clone';
        clone.innerHTML = '🦠';
        clone.style.left = (Math.random() * (this.gameBoard.offsetWidth - 50)) + 'px';
        clone.style.top = (Math.random() * (this.gameBoard.offsetHeight - 50)) + 'px';
        this.gameBoard.appendChild(clone);
        
        this.virusClones.push(clone);
        this.updateVirusCount();
        
        // تحريك الفيروس المستنسخ
        this.animateVirusClone(clone);
    }
    
    animateVirusClone(clone) {
        const moveClone = () => {
            if (!this.gameRunning) return;
            
            const currentLeft = parseFloat(clone.style.left);
            const currentTop = parseFloat(clone.style.top);
            
            clone.style.left = (currentLeft + (Math.random() - 0.5) * 2) + 'px';
            clone.style.top = (currentTop + (Math.random() - 0.5) * 2) + 'px';
            
            // التأكد من أن الفيروس يبقى داخل الشاشة
            if (currentLeft < 0 || currentLeft > this.gameBoard.offsetWidth - 50) {
                clone.style.left = Math.max(0, Math.min(this.gameBoard.offsetWidth - 50, currentLeft)) + 'px';
            }
            if (currentTop < 0 || currentTop > this.gameBoard.offsetHeight - 50) {
                clone.style.top = Math.max(0, Math.min(this.gameBoard.offsetHeight - 50, currentTop)) + 'px';
            }
            
            requestAnimationFrame(moveClone);
        };
        
        moveClone();
    }
    
    // نظام التحديات والإنجازات
    loadGameData() {
        const savedData = localStorage.getItem('flappyVirusData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.challenges = { ...this.challenges, ...data.challenges };
            this.achievements = { ...this.achievements, ...data.achievements };
            this.stats = { ...this.stats, ...data.stats };
        }
        this.updateChallengeUI();
        this.updateAchievementUI();
    }
    
    saveGameData() {
        const data = {
            challenges: this.challenges,
            achievements: this.achievements,
            stats: this.stats
        };
        localStorage.setItem('flappyVirusData', JSON.stringify(data));
    }
    
    updateChallengeProgress(type, value) {
        if (this.challenges[type] && !this.challenges[type].completed) {
            this.challenges[type].progress = Math.min(this.challenges[type].target, value);
            
            if (this.challenges[type].progress >= this.challenges[type].target) {
                this.completeChallenge(type);
            }
        }
    }
    
    completeChallenge(type) {
        if (this.challenges[type] && !this.challenges[type].completed) {
            this.challenges[type].completed = true;
            this.energy = Math.min(this.maxEnergy, this.energy + this.challenges[type].reward);
            this.updateEnergyBar();
            this.showNotification(`تم إكمال التحدي! +${this.challenges[type].reward} طاقة`, 'success');
            this.updateChallengeUI();
            this.saveGameData();
        }
    }
    
    checkAchievements() {
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            if (!achievement.unlocked) {
                let conditionMet = false;
                
                switch (achievement.condition) {
                    case 'score':
                        conditionMet = this.stats.totalScore >= achievement.value;
                        break;
                    case 'powerUps':
                        conditionMet = this.stats.totalPowerUps >= achievement.value;
                        break;
                    case 'level':
                        conditionMet = this.stats.maxLevel >= achievement.value;
                        break;
                }
                
                if (conditionMet) {
                    this.unlockAchievement(key);
                }
            }
        });
    }
    
    unlockAchievement(key) {
        if (this.achievements[key] && !this.achievements[key].unlocked) {
            this.achievements[key].unlocked = true;
            this.showNotification(`إنجاز جديد: ${this.getAchievementName(key)}!`, 'achievement');
            this.updateAchievementUI();
            this.saveGameData();
        }
    }
    
    getAchievementName(key) {
        const names = {
            first100: 'أول 100 نقطة',
            powerMaster: 'سيد القوى الخارقة',
            virusKing: 'ملك الفيروسات'
        };
        return names[key] || 'إنجاز';
    }
    
    updateChallengeUI() {
        const challengeItems = document.querySelectorAll('.challenge-item');
        const challengeKeys = ['score100', 'powerUps5', 'level5'];
        
        challengeKeys.forEach((key, index) => {
            if (challengeItems[index]) {
                const challenge = this.challenges[key];
                const progress = (challenge.progress / challenge.target) * 100;
                
                if (challenge.completed) {
                    challengeItems[index].classList.add('completed');
                } else {
                    challengeItems[index].classList.remove('completed');
                }
                
                // إضافة شريط التقدم
                let progressBar = challengeItems[index].querySelector('.challenge-progress');
                if (!progressBar) {
                    progressBar = document.createElement('div');
                    progressBar.className = 'challenge-progress';
                    challengeItems[index].appendChild(progressBar);
                }
                progressBar.style.width = progress + '%';
            }
        });
    }
    
    updateAchievementUI() {
        const achievementItems = document.querySelectorAll('.achievement-item');
        const achievementKeys = ['first100', 'powerMaster', 'virusKing'];
        
        achievementKeys.forEach((key, index) => {
            if (achievementItems[index]) {
                const achievement = this.achievements[key];
                
                if (achievement.unlocked) {
                    achievementItems[index].classList.remove('locked');
                    achievementItems[index].classList.add('unlocked');
                } else {
                    achievementItems[index].classList.add('locked');
                    achievementItems[index].classList.remove('unlocked');
                }
            }
        });
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    updateStats() {
        this.stats.totalScore = Math.max(this.stats.totalScore, this.score);
        this.stats.maxLevel = Math.max(this.stats.maxLevel, this.level);
        
        // تحديث التحديات
        this.updateChallengeProgress('score100', this.score);
        this.updateChallengeProgress('level5', this.level);
        
        // فحص الإنجازات
        this.checkAchievements();
    }
    
    // إضافة إحصائيات متقدمة
    createStatsPanel() {
        const statsPanel = document.createElement('div');
        statsPanel.className = 'stats-panel';
        statsPanel.innerHTML = `
            <h4>📊 الإحصائيات</h4>
            <div class="stat-item">
                <span class="stat-label">أعلى نتيجة:</span>
                <span class="stat-value">${this.stats.totalScore}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أعلى مرحلة:</span>
                <span class="stat-value">${this.stats.maxLevel}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">عدد الألعاب:</span>
                <span class="stat-value">${this.stats.gamesPlayed}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">القوى المستخدمة:</span>
                <span class="stat-value">${this.stats.totalPowerUps}</span>
            </div>
        `;
        this.gameBoard.appendChild(statsPanel);
    }
    
    // نظام الأصوات والموسيقى
    initializeAudio() {
        this.audioContext = null;
        this.sounds = {};
        this.musicEnabled = true;
        this.soundEnabled = true;
        
        // إنشاء سياق الصوت
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // صوت القفز
        this.sounds.jump = this.createTone(440, 0.1, 'sine');
        
        // صوت تجاوز العقبة
        this.sounds.score = this.createTone(660, 0.2, 'square');
        
        // صوت انتهاء اللعبة
        this.sounds.gameOver = this.createTone(220, 0.5, 'sawtooth');
        
        // صوت تفعيل القوة
        this.sounds.powerUp = this.createTone(880, 0.3, 'triangle');
        
        // صوت العدوى
        this.sounds.infection = this.createTone(330, 0.4, 'sawtooth');
        
        // صوت المرحلة الجديدة
        this.sounds.levelUp = this.createMelody([440, 554, 659, 880], 0.2);
        
        // موسيقى الخلفية
        this.backgroundMusic = this.createBackgroundMusic();
    }
    
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    createMelody(frequencies, noteDuration) {
        return () => {
            if (!this.soundEnabled || !this.audioContext) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    this.createTone(freq, noteDuration, 'sine')();
                }, index * noteDuration * 1000);
            });
        };
    }
    
    createBackgroundMusic() {
        if (!this.audioContext) return null;
        
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        const playMelody = () => {
            if (!this.musicEnabled || !this.audioContext) return;
            
            const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            const currentTime = this.audioContext.currentTime;
            
            melody.forEach((freq, index) => {
                playNote(freq, currentTime + index * 0.5, 0.4);
            });
            
            // تكرار الموسيقى
            setTimeout(playMelody, melody.length * 500);
        };
        
        return playMelody;
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    startBackgroundMusic() {
        if (this.backgroundMusic && this.musicEnabled) {
            this.backgroundMusic();
        }
    }
    
    stopBackgroundMusic() {
        if (this.audioContext) {
            this.audioContext.suspend();
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
    }
}

// إضافة تأثير الاهتزاز في CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// تهيئة اللعبة
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new FlappyVirusGame();
});

// دالة إعادة تشغيل اللعبة
function restartGame() {
    if (game) {
        game.startGame();
    }
}

// دوال التحكم في الصوت
function toggleMusic() {
    if (game) {
        game.toggleMusic();
        const musicBtn = document.getElementById('musicBtn');
        musicBtn.classList.toggle('active', game.musicEnabled);
        musicBtn.textContent = game.musicEnabled ? '🎵' : '🔇';
    }
}

function toggleSound() {
    if (game) {
        game.toggleSound();
        const soundBtn = document.getElementById('soundBtn');
        soundBtn.classList.toggle('active', game.soundEnabled);
        soundBtn.textContent = game.soundEnabled ? '🔊' : '🔇';
    }
}

// دالة القفز (للاستخدام من HTML)
function jump() {
    if (game) {
        game.jump();
    }
}

// دالة بدء اللعبة (للاستخدام من HTML)
function startGame() {
    if (game) {
        game.startGame();
    }
}

// تحسين الأداء
window.addEventListener('resize', () => {
    // إعادة حساب مواقع العناصر عند تغيير حجم النافذة
    if (game && game.gameRunning) {
        // يمكن إضافة منطق إعادة الحساب هنا إذا لزم الأمر
    }
});

// منع التمرير عند الضغط على المسافة
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// تحسين للهواتف المحمولة
if ('ontouchstart' in window) {
    document.body.style.touchAction = 'manipulation';
}
