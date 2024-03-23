const express = require('express')
const { getProfile } = require('../middleware/getProfile')
const { getBestProfession, getBestClients } = require('./controller')
const router = express.Router()

/**
 *
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range
 */
router.get('/best-profession', getProfile, getBestProfession)

/**
 *
 * @returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2
 */
router.get('/best-clients', getProfile, getBestClients)

module.exports = router
