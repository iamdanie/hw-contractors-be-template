const { Op } = require('sequelize')
const { sequelize } = require('../model')

const getBestProfession = async (req, res) => {
  const { Contract, Job, Profile } = req.app.get('models')
  const { start, end } = req.query || {}
  const dateQueries = []
  if (start) {
    dateQueries.push({ paymentDate: { [Op.gte]: new Date(start) } })
  }
  if (end) {
    dateQueries.push({ paymentDate: { [Op.lte]: new Date(end) } })
  }

  const sum = await Profile.findAll({
    attributes: ['profession'],
    where: { type: 'contractor' },
    include: {
      model: Contract,
      as: 'Contractor',
      attributes: ['contractorId'],
      include: {
        model: Job,
        where: { [Op.and]: [{ paid: true }, ...dateQueries] },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('price')), 'totalPaid'],
        ],
      },
    },
    group: ['profession'],
  })

  const max = sum.reduce((acc, curr) => {
    const currentEarned =
      curr.Contractor?.[0]?.Jobs?.[0]?.dataValues?.totalPaid ?? 0
    if (!acc?.profession || currentEarned > acc?.totalEarned) {
      return {
        profession: curr.profession,
        totalEarned: currentEarned,
      }
    }

    return acc
  }, {})

  res.json(max)
}

const getBestClients = async (req, res) => {
  const { Contract, Job, Profile } = req.app.get('models')
  const { start, end, limit = 2 } = req.query || { limit: 2 }
  const dateQueries = []
  if (start) {
    dateQueries.push({ paymentDate: { [Op.gte]: new Date(start) } })
  }
  if (end) {
    dateQueries.push({ paymentDate: { [Op.lte]: new Date(end) } })
  }

  const sum = await Profile.findAll({
    attributes: [['id', 'userId'], 'firstName', 'lastName'],
    where: { type: 'client' },
    include: {
      model: Contract,
      as: 'Client',
      attributes: ['clientId'],
      include: {
        model: Job,
        where: { [Op.and]: [{ paid: true }, ...dateQueries] },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('price')), 'totalPaid'],
        ],
      },
    },
    order: [[{ model: Contract, as: 'Client' }, Job, 'price', 'DESC']],
    group: ['userId'],
  })

  res.json(sum.slice(0, limit))
}

module.exports = { getBestProfession, getBestClients }
