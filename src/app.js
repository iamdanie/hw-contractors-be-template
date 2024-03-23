const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const app = express()
const contracts = require('./contracts/routes')
const jobs = require('./jobs/routes')
const balances = require('./balances/routes')
const admin = require('./admin/routes')

app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use('/contracts', contracts)
app.use('/jobs', jobs)
app.use('/balances', balances)
app.use('/admin', admin)

module.exports = app
