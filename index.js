const Express = require('express')
const app = Express()
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const favicon = require('serve-favicon')
require('dotenv').config()

require('./database/populate')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(Express.static(path.join(__dirname, 'public')))
if (process.env.NODE_ENV !== 'production') {
    app.use(require('./utils/docs'))
    app.use(morgan('dev'))
} else {
    // https://www.npmjs.com/package/morgan#skip
    app.use(morgan('combined', {skip: function (req, res) { return res.statusCode < 400 }}))
}

app.use(require('./routes'))

app.listen(process.env.PORT || 8080, function() {
    console.log('Servidor en puerto', process.env.PORT)
})
