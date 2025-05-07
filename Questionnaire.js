const express = require('express');
const router = express.Router();
const { Answer } = require('../models');
//const { getLatestResult } = require('../api/questionnaire'); // ✅ fixed import
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001'; // Flask ML server


// Teen questionnaire submission
router.post('/submit_teen', async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !answers || answers.length !== 13) {
      return res.status(400).json({ error: 'Invalid teen submission' });
    }

    // Separate anxiety (Q1-Q7) and stress (Q8-Q13) inputs
    const anxietyData = {
      userId,
      role: 'teen',
      answers
    };

    const stressData = {
      userId,
      role: 'teen',
      answers
    };

    // Call Flask ML API for Anxiety and Stress
    const [anxietyRes, stressRes] = await Promise.all([
      axios.post(`${ML_SERVER_URL}/api/children/anxiety`, anxietyData),
      axios.post(`${ML_SERVER_URL}/api/children/stress`, stressData),
    ]);

    const anxietyScore = anxietyRes.data?.anxiety;
    const stressScore = stressRes.data?.stress;

    // Save to PostgreSQL (optional if Flask already saves, depends on design)
    await Answers.create({
      userId,
      role: 'teen',
      answers,
      stress: stressScore,
      anxiety: anxietyScore
    });

    return res.json({
      message: 'Teen questionnaire submitted successfully',
      anxietyScore,
      stressScore
    });

  } catch (error) {
    console.error('❌ Error submitting teen questionnaire:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Parent questionnaire submission
router.post('/submit_parent', async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !answers || answers.length !== 12) {
      return res.status(400).json({ error: 'Invalid parent submission' });
    }

    const anxietyData = {
      userId,
      role: 'parent',
      answers
    };

    const stressData = {
      userId,
      role: 'parent',
      answers
    };

    const [anxietyRes, stressRes] = await Promise.all([
      axios.post(`${ML_SERVER_URL}/api/parent/anxiety`, anxietyData),
      axios.post(`${ML_SERVER_URL}/api/parent/stress`, stressData),
    ]);

    const anxietyScore = anxietyRes.data?.anxiety;
    const stressScore = stressRes.data?.stress;

    await Answers.create({
      userId,
      role: 'parent',
      answers,
      stress: stressScore,
      anxiety: anxietyScore
    });

    return res.json({
      message: 'Parent questionnaire submitted successfully',
      anxietyScore,
      stressScore
    });

  } catch (error) {
    console.error('❌ Error submitting parent questionnaire:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;

// ✅ Get latest result for prescription
router.get('/latest/:userId', async (req, res) => {
  try {
    const latest = await Answer.findOne({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']]
    });

    if (!latest) {
      return res.status(404).json({ message: 'No answers found for this user.' });
    }

    res.json({
      stress: latest.stress,
      anxiety: latest.anxiety
    });
  } catch (err) {
    console.error('❌ Error fetching latest result:', err);
    res.status(500).json({ error: 'Failed to fetch latest results.' });
  }
});

// ✅ Get all results (for graphs, history, etc.)
router.get('/results', async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing userId or role' });
    }

    console.log('📥 Fetching results for:', { userId, role });

    const results = await Answer.findAll({
      where: {
        userId: parseInt(userId),
        role
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
});

module.exports = router;
