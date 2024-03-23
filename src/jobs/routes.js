const express = require('express')
const { Op } = require('sequelize')
const { sequelize } = require('../model')
const { getProfile } = require('../middleware/getProfile')
const router = express.Router()

/**
 *
 * @returns unpaid jobs
 *
 */
router.get('/unpaid', getProfile, async (req, res) => {
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

/**
 * Pays for a given job id the amount within the payload
 * @returns paid job
 */
router.post('/:id/pay', getProfile, async (req, res) => {
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
    console.error(e)
    res.status(500).end()
  }
})

module.exports = router
