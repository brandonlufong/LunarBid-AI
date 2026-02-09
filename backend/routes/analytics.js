const express = require('express');
const router = express.Router();
const ProposalAnalytics = require('../models/ProposalAnalytics');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkFeatureAccess = require('../middleware/checkFeatureAccess');

// ===============================
// Get analytics dashboard
// ===============================
router.get('/dashboard', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    // Get win rate
    const winRateData = await ProposalAnalytics.getWinRate(user._id, filters);
    
    // Get performance by tone
    const performanceByTone = await ProposalAnalytics.getPerformanceByTone(user._id);
    
    // Get revenue stats
    const revenueStats = await ProposalAnalytics.getRevenueStats(user._id, filters);
    
    // Get recent trends
    const recentProposals = await ProposalAnalytics.find({
      user: user._id,
      dateSubmitted: { $exists: true }
    })
    .sort({ dateSubmitted: -1 })
    .limit(30)
    .select('status dateSubmitted actualRevenue');
    
    // Calculate monthly trends
    const monthlyTrends = calculateMonthlyTrends(recentProposals);
    
    // Get average response time
    const avgResponseTime = await ProposalAnalytics.aggregate([
      {
        $match: {
          user: user._id,
          responseTime: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    res.json({
      overview: {
        ...winRateData,
        ...revenueStats,
        avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0
      },
      performanceByTone,
      monthlyTrends,
      recentProposals: recentProposals.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get win rate analytics
// ===============================
router.get('/win-rate', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { period = '30', groupBy = 'day' } = req.query;
    
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const analytics = await ProposalAnalytics.find({
      user: user._id,
      dateSubmitted: { $gte: startDate },
      status: { $in: ['accepted', 'rejected'] }
    }).sort({ dateSubmitted: 1 });
    
    // Group by specified period
    const grouped = groupAnalyticsByPeriod(analytics, groupBy);
    
    res.json({
      period: daysAgo,
      groupBy,
      data: grouped,
      overall: await ProposalAnalytics.getWinRate(user._id, { startDate })
    });
  } catch (error) {
    console.error('Error fetching win rate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get performance by industry
// ===============================
router.get('/industry-performance', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const performanceByIndustry = await ProposalAnalytics.aggregate([
      {
        $match: {
          user: user._id,
          industry: { $exists: true, $ne: '' },
          status: { $in: ['accepted', 'rejected'] }
        }
      },
      {
        $group: {
          _id: '$industry',
          total: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$actualRevenue' }
        }
      },
      {
        $project: {
          industry: '$_id',
          total: 1,
          won: 1,
          lost: { $subtract: ['$total', '$won'] },
          winRate: {
            $multiply: [
              { $divide: ['$won', '$total'] },
              100
            ]
          },
          totalRevenue: 1,
          avgRevenue: { $divide: ['$totalRevenue', '$won'] }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json(performanceByIndustry);
  } catch (error) {
    console.error('Error fetching industry performance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get proposal length analysis
// ===============================
router.get('/length-analysis', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const lengthAnalysis = await ProposalAnalytics.aggregate([
      {
        $match: {
          user: user._id,
          status: { $in: ['accepted', 'rejected'] },
          proposalLength: { $exists: true }
        }
      },
      {
        $bucket: {
          groupBy: '$proposalLength',
          boundaries: [0, 100, 200, 400, 800, 10000],
          default: 'other',
          output: {
            count: { $sum: 1 },
            won: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
            },
            avgLength: { $avg: '$proposalLength' }
          }
        }
      },
      {
        $project: {
          range: '$_id',
          count: 1,
          won: 1,
          winRate: {
            $multiply: [
              { $divide: ['$won', '$count'] },
              100
            ]
          },
          avgLength: 1
        }
      }
    ]);
    
    res.json(lengthAnalysis);
  } catch (error) {
    console.error('Error fetching length analysis:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get revenue trends
// ===============================
router.get('/revenue-trends', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { months = 6 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const revenueTrends = await ProposalAnalytics.aggregate([
      {
        $match: {
          user: user._id,
          status: 'accepted',
          dateResponded: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateResponded' },
            month: { $month: '$dateResponded' }
          },
          totalRevenue: { $sum: '$actualRevenue' },
          count: { $sum: 1 },
          avgRevenue: { $avg: '$actualRevenue' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json(revenueTrends);
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Get response time analysis
// ===============================
router.get('/response-time', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const responseTimeData = await ProposalAnalytics.aggregate([
      {
        $match: {
          user: user._id,
          responseTime: { $exists: true, $ne: null }
        }
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTime' },
                minResponseTime: { $min: '$responseTime' },
                maxResponseTime: { $max: '$responseTime' }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                avgResponseTime: { $avg: '$responseTime' },
                count: { $sum: 1 }
              }
            }
          ],
          distribution: [
            {
              $bucket: {
                groupBy: '$responseTime',
                boundaries: [0, 24, 48, 72, 168, 10000], // hours
                default: 'other',
                output: {
                  count: { $sum: 1 },
                  won: {
                    $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
                  }
                }
              }
            }
          ]
        }
      }
    ]);
    
    res.json(responseTimeData[0]);
  } catch (error) {
    console.error('Error fetching response time:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Export analytics data (CSV)
// ===============================
router.get('/export', auth, checkFeatureAccess('analytics'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { format = 'csv', startDate, endDate } = req.query;
    
    const query = { user: user._id };
    if (startDate) query.dateSubmitted = { $gte: new Date(startDate) };
    if (endDate) {
      query.dateSubmitted = { ...query.dateSubmitted, $lte: new Date(endDate) };
    }
    
    const analytics = await ProposalAnalytics.find(query)
      .sort({ dateSubmitted: -1 })
      .populate('proposal', 'jobTitle')
      .lean();
    
    if (format === 'csv') {
      const csv = convertToCSV(analytics);
      res.header('Content-Type', 'text/csv');
      res.attachment('analytics-export.csv');
      res.send(csv);
    } else {
      res.json(analytics);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===============================
// Helper Functions
// ===============================

function calculateMonthlyTrends(proposals) {
  const trends = {};
  
  proposals.forEach(p => {
    const month = new Date(p.dateSubmitted).toISOString().slice(0, 7); // YYYY-MM
    
    if (!trends[month]) {
      trends[month] = { total: 0, won: 0, revenue: 0 };
    }
    
    trends[month].total++;
    if (p.status === 'accepted') {
      trends[month].won++;
      trends[month].revenue += p.actualRevenue || 0;
    }
  });
  
  return Object.entries(trends).map(([month, data]) => ({
    month,
    ...data,
    winRate: data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : 0
  }));
}

function groupAnalyticsByPeriod(analytics, groupBy) {
  const grouped = {};
  
  analytics.forEach(item => {
    let key;
    const date = new Date(item.dateSubmitted);
    
    if (groupBy === 'day') {
      key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const week = getWeekNumber(date);
      key = `${date.getFullYear()}-W${week}`;
    } else if (groupBy === 'month') {
      key = date.toISOString().slice(0, 7); // YYYY-MM
    }
    
    if (!grouped[key]) {
      grouped[key] = { total: 0, won: 0, lost: 0 };
    }
    
    grouped[key].total++;
    if (item.status === 'accepted') {
      grouped[key].won++;
    } else {
      grouped[key].lost++;
    }
  });
  
  return Object.entries(grouped).map(([period, data]) => ({
    period,
    ...data,
    winRate: data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : 0
  }));
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function convertToCSV(data) {
  const headers = [
    'Date', 'Job Title', 'Client', 'Status', 'Tone', 'Style',
    'Length', 'Response Time (hrs)', 'Revenue', 'Industry'
  ];
  
  const rows = data.map(item => [
    item.dateSubmitted ? new Date(item.dateSubmitted).toISOString().slice(0, 10) : '',
    item.jobTitle || '',
    item.clientName || '',
    item.status || '',
    item.toneUsed || '',
    item.styleUsed || '',
    item.proposalLength || '',
    item.responseTime || '',
    item.actualRevenue || 0,
    item.industry || ''
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

module.exports = router;