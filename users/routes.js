const Router = require('express');
const router = Router();
const { getUsers, getStats, getStatsById, validateDate } = require('./controllers');

router.get('/users', getUsers, getStats);
router.get('/users/:id', validateDate, getStatsById);

module.exports = router;
