const express = require('express')
const { getProfile } = require('../middleware/getProfile')
const { createDeposit } = require('./controller')
const router = express.Router()

/**
 * Deposits money into the the the balance of a client
 * @returns user who received the deposit
 */
router.post('/deposit/:id', getProfile, createDeposit)

module.exports = router
