// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use this in server.jsconst axios = require('axios');
const he = require('he'); // HTML entity decoder
app.use(cors());
app.use(bodyParser.json());

// In-memory database for scores
let scores = [];
let highestScores = [];

// Funny name generator based on first name
const funnyNames = {
    prefixes: ['Captain', 'Doctor', 'Professor', 'The Amazing', 'Super', 'Master', 'Lord', 'Queen', 'King'],
    adjectives: ['Funny', 'Clever', 'Silly', 'Brave', 'Clumsy', 'Wise', 'Mighty', 'Jolly', 'Crazy'],
    suffixes: ['Banana', 'Pickle', 'Noodle', 'Potato', 'Unicorn', 'Wizard', 'Ninja', 'Pirate', 'Detective']
};

function generateFunnyName(firstName) {
    const randomPrefix = funnyNames.prefixes[Math.floor(Math.random() * funnyNames.prefixes.length)];
    const randomAdjective = funnyNames.adjectives[Math.floor(Math.random() * funnyNames.adjectives.length)];
    const randomSuffix = funnyNames.suffixes[Math.floor(Math.random() * funnyNames.suffixes.length)];
    
    const patterns = [
        `${randomPrefix} ${firstName}`,
        `${firstName} the ${randomAdjective}`,
        `${randomAdjective} ${randomSuffix}`,
        `${firstName} ${randomSuffix}`,
        `${randomPrefix} ${randomSuffix}`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
}

app.get('/api/questions', async (req, res) => {
    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=10');
        const questions = response.data.results.map(q => ({
            question: he.decode(q.question), // Decode HTML entities
            options: [...q.incorrect_answers.map(a => he.decode(a)), he.decode(q.correct_answer)].sort(() => Math.random() - 0.5),
            correctAnswer: he.decode(q.correct_answer) // Decode correct answer
        }));
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

// Endpoint to submit a score
app.post('/api/scores', (req, res) => {
    const { playerName, funnyName, score } = req.body;
    
    if (!playerName || !funnyName || typeof score !== 'number') {
        return res.status(400).json({ error: "Invalid data" });
    }
    
    const playerScore = {
        playerName,
        funnyName,
        score,
        date: new Date().toISOString()
    };
    
    scores.push(playerScore);
    
    // Update highest scores
    highestScores.push(playerScore);
    highestScores.sort((a, b) => b.score - a.score);
    highestScores = highestScores.slice(0, 10); // Keep top 10
    
    res.json({ success: true, highestScores });
});

// Endpoint to get highest scores
app.get('/api/high-scores', (req, res) => {
    res.json(highestScores);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
