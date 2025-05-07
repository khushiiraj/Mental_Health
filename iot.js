const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const { IotData } = require('../models');


// Helper: Calculate average stats
function calculateInsights(data) {
  if (data.length === 0) return null;

  let totalHeartRate = 0;
  let totalSleep = 0;
  let count = 0;

  data.forEach(entry => {
    if (entry.heartRate != null) totalHeartRate += entry.heartRate;
    if (entry.sleepHours != null) totalSleep += entry.sleepHours;
    count++;
  });

  const avgHeartRate = totalHeartRate / count;
  const avgSleepHours = totalSleep / count;

  return {
    avgHeartRate: parseFloat(avgHeartRate.toFixed(2)),
    avgSleepHours: parseFloat(avgSleepHours.toFixed(2)),
    entriesCount: count
  };
}

// ✅ All IoT data + insights
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await IotData.findAll({
      where: { userId },
      order: [['timestamp', 'ASC']]
    });

    const insights = calculateInsights(data);

    res.json({ insights, data });
  } catch (err) {
    console.error('❌ Error fetching IoT data:', err);
    res.status(500).json({ error: 'Failed to fetch IoT data' });
  }
});

// ✅ Latest IoT entry for user
router.get('/latest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const latest = await IotData.findOne({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });

    if (!latest) {
      return res.status(404).json({ message: 'No IoT data found' });
    }

    res.json(latest);
  } catch (err) {
    console.error('❌ Error fetching latest IoT:', err);
    res.status(500).json({ error: 'Failed to fetch latest IoT data' });
  }
});

// ✅ Summary for past 7 days
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentData = await IotData.findAll({
      where: {
        userId,
        timestamp: {
          [Op.gte]: sevenDaysAgo
        }
      },
      order: [['timestamp', 'ASC']]
    });

    const insights = calculateInsights(recentData);

    res.json({ insights, data: recentData });
  } catch (err) {
    console.error('❌ Error fetching weekly summary:', err);
    res.status(500).json({ error: 'Failed to fetch 7-day summary' });
  }
});

module.exports = router;
