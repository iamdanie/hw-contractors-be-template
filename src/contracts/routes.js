const express = require('express')
const { getProfile } = require('../middleware/getProfile')
const { getContracts, getContractById } = require('./controller')
const router = express.Router()

/**
 *
 * @returns contracts from a corresponding profile
 */
router.get('/', getProfile, getContracts)

/**
 *
 * @returns contract by id
 */
router.get('/:id', getProfile, getContractById)

module.exports = router
