/**
 * https://www.w3schools.com/nodejs/nodejs_mysql.asp
 */
const mysql = require('mysql')

// https://www.npmjs.com/package/mysql#pooling-connections
const conexion = mysql.createPool({
    host: process.env.BD_HOST || 'localhost',
    port: process.env.BD_PORT || 3306,
    user: process.env.BD_USERNAME,
    password: process.env.BD_PASSWORD,
    database: process.env.BD_NAME,
    multipleStatements: true,
    connectionLimit: 20,
    // https://www.npmjs.com/package/mysql#custom-format
    queryFormat: function (query, values) {
        if (!values) return query
        return query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key])
            }
            return txt
        }.bind(this))
    }
})

module.exports = conexion
