const express = require('express')
const { Op } = require('sequelize')
const { getProfile } = require('../middleware/getProfile')
const router = express.Router()

/**
 *
 * @returns contracts from a corresponding profile
 */
router.get('/', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileId, type } = req?.profile ?? {}
  const profileCondition =
    type === 'client' ? { ClientId: profileId } : { ContractorId: profileId }
  const contract = await Contract.findAll({
    where: {
      [Op.and]: [profileCondition, { status: { [Op.ne]: 'terminated' } }],
    },
  })
  if (!contract) return res.status(404).end()
  res.json(contract)
})

/**
 *
 * @returns contract by id
 */
router.get('/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileId, type } = req?.profile ?? {}
  const { id } = req.params
  const profileCondition =
    type === 'client' ? { ClientId: profileId } : { ContractorId: profileId }
  const contract = await Contract.findOne({
    where: {
      [Op.and]: [{ id }, profileCondition],
    },
  })
  if (!contract) return res.status(404).end()
  res.json(contract)
})

module.exports = router
