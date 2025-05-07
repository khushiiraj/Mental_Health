const express = require('express');
const router = express.Router();
const { Answer } = require('../models');

// Helper: Generate prescription based on scores
function generatePrescription(stress, anxiety) {
  if (stress >= 6 || anxiety >= 6) {
    return 'You are experiencing high levels of stress or anxiety. We recommend speaking with a mental health professional and practicing daily relaxation techniques.';
  } else if (stress >= 3 || anxiety >= 3) {
    return 'You show moderate signs of stress/anxiety. Try mindfulness exercises, journaling, and regular physical activity.';
  } else {
    return 'Your responses suggest low stress and anxiety. Keep up the healthy habits!';
  }
}

// ✅ Get prescription based on latest result
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const latest = await Answer.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    if (!latest) {
      return res.status(404).json({ error: 'No answers found for this user.' });
    }

    const { stress, anxiety } = latest;
    const prescription = generatePrescription(stress, anxiety);

    res.status(200).json({
      stress,
      anxiety,
      prescription
    });
  } catch (err) {
    console.error('❌ Error generating prescription:', err);
    res.status(500).json({ error: 'Server error while fetching prescription' });
  }
});

module.exports = router;
