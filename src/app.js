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
 *
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Contract, Job } = req.app.get('models')
  const { id: profileId, type } = req?.profile ?? {}
  const profileCondition =
    type === 'client' ? { ClientId: profileId } : { ContractorId: profileId }
  const jobs = await Job.findAll({
    include: {
      model: Contract,
      where: { [Op.and]: [profileCondition, { status: 'in_progress' }] },
    },
    where: {
      paid: null,
    },
  })
  if (!jobs) return res.status(404).end()
  res.json(jobs)
})
module.exports = app

/**
 * Pays for a given job id the amount within the payload
 * @returns paid job
 */
app.post('/jobs/:id/pay', getProfile, async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const { Contract, Job, Profile } = req.app.get('models')
      const { id: profileId, type, balance } = req?.profile ?? {}
      const { id: jobId } = req.params
      const { amount } = req?.body ?? { amount: 0 }

      if (type === 'contractor') {
        return { status: 403 }
      }
      if (!amount) {
        return { hasError: true, status: 400 }
      }
      const job = await Job.findOne({
        include: {
          model: Contract,
          where: {
            [Op.and]: [{ ClientId: profileId }, { status: 'in_progress' }],
          },
        },
        where: { id: jobId },
      })

      if (!job) return { hasError: true, status: 404 }

      if (balance < amount || amount !== job.price) {
        return { hasError: true, status: 400 }
      }

      job.paid = true
      job.paymentDate = new Date()
      await job.save({ transaction: t })

      await Profile.update(
        {
          balance: Number(balance) - amount,
        },
        {
          where: { id: profileId },
          transaction: t,
        },
      )

      const contractor = await Profile.findOne({
        where: { id: job.Contract.ContractorId },
      })

      contractor.balance = Number(contractor.balance) + amount
      await contractor.save({ transaction: t })

      return job
    })

    if (result.status && result.hasError) {
      res.status(result.status).end()
    } else {
      res.json(result)
    }
  } catch (e) {
    console.error(e, e.message)
    res.status(500).end()
  }
})

/**
 * Deposits money into the the the balance of a client
 * @returns user who received the deposit
 */
app.post('/balances/deposit/:id', getProfile, async (req, res) => {
  try {
    const { Contract, Job, Profile } = req.app.get('models')
    const { id: recipientId } = req.params
    const { amount } = req?.body ?? { amount: 0 }

    if (!amount) {
      res.status(400).end()
      return
    }

    const unpaidAmount = await Job.sum('price', {
      include: {
        model: Contract,
        where: { ClientId: recipientId },
      },
      where: {
        paid: null,
      },
    })

    if (amount > unpaidAmount * 0.25) {
      res.status(400).end()
      return
    }

    const user = await Profile.findOne({
      where: { id: recipientId },
    })

    user.balance = user.balance + amount
    await user.save()
    res.json(user)
  } catch (e) {
    console.error(e, e.message)
    res.status(500).end()
  }
})
module.exports = app
