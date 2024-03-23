const createDeposit = async (req, res) => {
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
}

module.exports = { createDeposit }
