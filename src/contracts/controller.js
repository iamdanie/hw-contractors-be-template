const { Op } = require('sequelize')

const getContracts = async (req, res) => {
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
}

const getContractById = async (req, res) => {
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
}

module.exports = { getContracts, getContractById }
