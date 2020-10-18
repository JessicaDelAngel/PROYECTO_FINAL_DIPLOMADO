const app = require('express')()
// https://www.npmjs.com/package/swagger-ui-express#usage
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('../swagger.json')

const options = {
    explorer: true
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options))

module.exports = app
