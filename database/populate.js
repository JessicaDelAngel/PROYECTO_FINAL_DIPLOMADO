const pool = require('./conexion')
const bcrypt = require('bcrypt')
const path = require('path')
const util = require('util')
const fs = require('fs')

// https://stackoverflow.com/questions/54730641/node-js-how-to-apply-util-promisify-to-mysql-pool-in-its-simplest-way
const query = util.promisify(pool.query).bind(pool)
const release = util.promisify(pool.releaseConnection).bind(pool)

function crearTablas () {
    const uri = path.join(__dirname, '..', 'sql', 'script.sql')
    return fs.readFileSync(uri, { encoding: 'utf-8' }).toString().trim()
}

function poblarTablas () {
    const uriPoblar = path.join(__dirname, '..', 'sql', 'poblar.sql')
    const uriDummies = path.join(__dirname, '..', 'sql', 'personasDummy.sql')
    const scriptPoblar =  fs.readFileSync(uriPoblar, { encoding: 'utf-8' }).toString().trim()
    const scriptDummies =  fs.readFileSync(uriDummies, { encoding: 'utf-8' }).toString().trim()
    return scriptPoblar.toString() + scriptDummies.toString()
}

function crearPersonal () {
    let queryPersonal = ''
    const usuarios = [{
        usuarioId: 'doc1', nombres: 'Pedro', apellidos: 'Armendáriz Jr.', password: 'drpedroparaustedsimplemortal', tipo: 'DOCTOR'
    }, {
        usuarioId: 'doc2', nombres: 'Roberto', apellidos: 'Gómez Bolaños', password: '1234', tipo: 'DOCTOR'
    }, {
        usuarioId: 'enf1', nombres: 'Julia', apellidos: 'Torres Espinoza', password: 'qwerty1234', tipo: 'ENFERMERO'
    }, {
        usuarioId: 'enf2', nombres: 'Teresa', apellidos: 'Flores Hernández', password: 'contraseña', tipo: 'ENFERMERO'
    }, {
        usuarioId: 'lab1', nombres: 'Sergio', apellidos: 'Meneses Méndez', password: 'billsforever', tipo: 'LABORATORISTA'
    }, {
        usuarioId: 'lab2', nombres: 'Pedro', apellidos: 'González Ramírez', password: '49ersforever', tipo: 'LABORATORISTA'
    }]
    usuarios.forEach(async function ({ usuarioId, nombres, apellidos, password, tipo }) {
        const hashedPass = bcrypt.hashSync(password, 10)
        const qUsuario = `INSERT IGNORE INTO ${ tipo } (${ tipo }_ID, ${ tipo }_NOMBRES, ${ tipo }_APELLIDOS, ${ tipo }_PASSWORD, ADMINISTRADOR_ID)
        VALUES ("${usuarioId}", "${nombres}", "${apellidos}", "${hashedPass}", "adm001");\n`
        queryPersonal += qUsuario
    })
    return queryPersonal
}

function insertAdmin (hashedPass) {
    return `INSERT IGNORE INTO ADMINISTRADOR (
        ADMINISTRADOR_ID,
        ADMINISTRADOR_NOMBRES,
        ADMINISTRADOR_APELLIDOS,
        ADMINISTRADOR_PASSWORD
    ) VALUES (
        "adm001",
        "Primer Admin",
        "Bot",
        "${ hashedPass }"
    );\n`
}

async function init() {
    let queryFinal = ''
    try {
        queryFinal += crearTablas()
        // https://www.npmjs.com/package/bcrypt#usage
        const hashedPass = bcrypt.hashSync(process.env.FIRST_ADMIN_PASSWORD, 10)
        // https://www.w3schools.com/nodejs/nodejs_mysql_insert.asp
        queryFinal += insertAdmin(hashedPass)
        queryFinal += crearPersonal()
        queryFinal += poblarTablas()
        const res = await query(queryFinal)
        const resNums = res.map(function (obj) { return obj.affectedRows })
        const total = resNums.reduce(function (total, num) { return total + num })
        console.log('Filas insertadas:', total)
    } catch (error) {
        console.error(error)
        console.error('No se pudo poblar la tabla.', error.message)
    } finally {
        release()
        console.log('Terminada conexión de populate')
    }
}

init()
