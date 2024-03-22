const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const { Op } = require('sequelize')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 *
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
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

app.get('/contracts', getProfile, async (req, res) => {
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
module.exports = app
