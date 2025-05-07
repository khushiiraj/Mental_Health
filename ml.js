const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/predict', async (req, res) => {
  const { responses, role, type } = req.body;

  const roleMap = { teen: 'c', parent: 'p' }; // teen → child, parent → parent
  const expectedLengths = { teen: 13, parent: 12 };
  const modelPrefix = roleMap[role];

  // Validate role
  if (!modelPrefix) {
    return res.status(400).json({ error: 'Invalid role. Must be "teen" or "parent".' });
  }

  // Validate responses array
  if (!Array.isArray(responses)) {
    return res.status(400).json({ error: 'Responses must be an array.' });
  }

  if (responses.length !== expectedLengths[role]) {
    return res.status(400).json({
      error: `Expected ${expectedLengths[role]} responses for role "${role}", but got ${responses.length}.`
    });
  }

  const modelKey = `${modelPrefix}_${type}`;

  console.log('🔍 Sending prediction request with:');
  console.log('Model:', modelKey);
  console.log('Responses:', responses);

  try {
    const predictionRes = await axios.post('http://localhost:5001/api/predict', {
      model: modelKey,
      input_data: responses
    });

    res.json(predictionRes.data);
  } catch (err) {
    console.error('❌ Prediction failed:', err.response?.data || err.message);
    res.status(500).json({
      error: 'ML prediction failed',
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
