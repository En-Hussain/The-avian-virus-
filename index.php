<?php
// إعداد قاعدة البيانات البسيطة
$scores_file = 'scores.json';

// قراءة النتائج
function getScores() {
    global $scores_file;
    if (file_exists($scores_file)) {
        $data = file_get_contents($scores_file);
        return json_decode($data, true) ?: [];
    }
    return [];
}

// حفظ النتيجة
function saveScore($name, $score) {
    global $scores_file;
    $scores = getScores();
    $scores[] = [
        'name' => $name,
        'score' => $score,
        'timestamp' => time()
    ];
    
    // ترتيب النتائج من الأعلى للأقل
    usort($scores, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    // الاحتفاظ بأفضل 10 نتائج فقط
    $scores = array_slice($scores, 0, 10);
    
    file_put_contents($scores_file, json_encode($scores, JSON_PRETTY_PRINT));
}

// معالجة إرسال النتيجة
if ($_POST && isset($_POST['name']) && isset($_POST['score'])) {
    saveScore($_POST['name'], (int)$_POST['score']);
    header('Location: index.php');
    exit;
}

$scores = getScores();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لعبة الفيروس الطائر - Flappy Virus</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="game-container">
        <header>
            <h1>🦠 الفيروس الطائر 🦠</h1>
            <p>تجنب العقبات واجمع أكبر عدد من النقاط!</p>
            <div class="controls-info">
                <span class="control-key">مسطرة</span> للقفز • 
                <span class="control-key">W</span> للقفز • 
                <span class="control-key">↑</span> للقفز
            </div>
        </header>

        <div class="game-area">
            <div class="game-board" id="gameBoard">
                <div class="virus" id="virus">
                    <div class="virus-body">🦠</div>
                </div>
                <div class="obstacles" id="obstacles"></div>
                <div class="score" id="score">النقاط: 0</div>
                <div class="energy-bar" id="energyBar">
                    <div class="energy-fill" id="energyFill"></div>
                    <span class="energy-text">طاقة الفيروس</span>
                </div>
                <div class="power-ups" id="powerUps"></div>
                <div class="virus-count" id="virusCount">🦠 x1</div>
                <div class="level-indicator" id="levelIndicator">المرحلة 1</div>
                <div class="gravity-indicator" id="gravityIndicator">الجاذبية: عادية</div>
                <div class="game-over" id="gameOver" style="display: none;">
                    <h2>انتهت اللعبة!</h2>
                    <p>نقاطك: <span id="finalScore">0</span></p>
                    <form method="POST" class="score-form">
                        <input type="text" name="name" placeholder="أدخل اسمك" required>
                        <input type="hidden" name="score" id="hiddenScore">
                        <button type="submit">حفظ النتيجة</button>
                    </form>
                    <button onclick="restartGame()">العب مرة أخرى</button>
                </div>
            </div>

            <div class="controls">
                <button id="startBtn" onclick="startGame()">ابدأ اللعبة</button>
                <button id="jumpBtn" onclick="jump()" disabled>قفز!</button>
                <div class="audio-controls">
                    <button id="musicBtn" onclick="toggleMusic()" title="الموسيقى">🎵</button>
                    <button id="soundBtn" onclick="toggleSound()" title="الأصوات">🔊</button>
                </div>
            </div>
        </div>

        <div class="leaderboard">
            <h3>🏆 أفضل النتائج</h3>
            <div class="scores-list">
                <?php if (empty($scores)): ?>
                    <p>لا توجد نتائج بعد</p>
                <?php else: ?>
                    <?php foreach ($scores as $index => $score): ?>
                        <div class="score-item">
                            <span class="rank"><?= $index + 1 ?></span>
                            <span class="name"><?= htmlspecialchars($score['name']) ?></span>
                            <span class="points"><?= $score['score'] ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            
            <div class="daily-challenges">
                <h4>🎯 التحديات اليومية</h4>
                <div class="challenge-list" id="challengeList">
                    <div class="challenge-item">
                        <span class="challenge-icon">🦠</span>
                        <span class="challenge-text">اجمع 100 نقطة</span>
                        <span class="challenge-reward">+50 طاقة</span>
                    </div>
                    <div class="challenge-item">
                        <span class="challenge-icon">⚡</span>
                        <span class="challenge-text">استخدم 5 قوى خارقة</span>
                        <span class="challenge-reward">+100 طاقة</span>
                    </div>
                    <div class="challenge-item">
                        <span class="challenge-icon">🏆</span>
                        <span class="challenge-text">وصل للمرحلة 5</span>
                        <span class="challenge-reward">+200 طاقة</span>
                    </div>
                </div>
            </div>
            
            <div class="achievements">
                <h4>🏅 الإنجازات</h4>
                <div class="achievement-list" id="achievementList">
                    <div class="achievement-item locked">
                        <span class="achievement-icon">🥇</span>
                        <span class="achievement-text">أول 100 نقطة</span>
                    </div>
                    <div class="achievement-item locked">
                        <span class="achievement-icon">🔥</span>
                        <span class="achievement-text">10 قوى خارقة</span>
                    </div>
                    <div class="achievement-item locked">
                        <span class="achievement-icon">👑</span>
                        <span class="achievement-text">ملك الفيروسات</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
