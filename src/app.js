const express = require('express')
const bodyParser = require('body-parser')
const { sequelize, Job } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const { Op, where } = require('sequelize')
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
/**
 *
 * @returns contracts from a corresponding profile
 */
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

/**
 *
 * @returns unpaid jobs
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileId, type } = req?.profile ?? {}
  const profileCondition =
    type === 'client' ? { ClientId: profileId } : { ContractorId: profileId }
  const jobs = await Job.findAll({
    include: { model: Contract, where: profileCondition },
    where: {
      paid: null,
    },
  })
  if (!jobs) return res.status(404).end()
  res.json(jobs)
})
module.exports = app
