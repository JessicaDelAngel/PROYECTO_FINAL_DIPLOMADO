const jwt = require('jsonwebtoken')
const util = require('util')
const { Readable } = require('stream')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const pool = require('../database/conexion')
const path = require('path')
const fs = require('fs')
const pdf = require('pdfjs')

function generarToken (data) {
    return jwt.sign(data, process.env.SECRET_KEY, { expiresIn: '5d' })
}

async function insertarTurno (tipoUsuario, { usuarioId, horario, habitaciones, adminId }) {
    const queryArr = habitaciones.map(function (hab) {
        return `INSERT INTO TURNO_${ tipoUsuario } (TURNO_HORARIO, HABITACION_ID, ${ tipoUsuario }_ID, ADMINISTRADOR_ID) 
        VALUES ("${horario}", "${hab}", "${usuarioId}", "${adminId}");`
    })
    try {
        const insertarTurno = await poolQuery(queryArr.join(' '))
        return { ok: true, message: `Registrados ${ insertarTurno.response.affectedRows } turnos` }
    } catch (error) {
        return { ok: false, message: error.message, status: error.status }
    }
}

async function poolQuery (q, data) {
    const regEx = /DATABASE|DELETE|DROP|TABLE|SELECT|INSERT|ALTER|\;/gi
    if (data) {
        Object.keys(data).forEach(function (o) {
            if (regEx.test(data[o])) {
                data[o] = data[o].replace(regEx, '')
            }
        })
    }
    const query = util.promisify(pool.query).bind(pool)
    const release = util.promisify(pool.releaseConnection).bind(pool)
    try {
        const response = await query(q, data)
        return { ok: true, message: 'Se hizo el query', response }
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(error)
        }
        let datos = { message: '', status: 500 }
        datos = { message: String(error.code).includes('ER_NO_REFERENCED_ROW_2') ? 'Datos mal enviados' : error.sqlMessage, status: 400 }
        throw new QueryError(datos)
    } finally {
        release()
    }
}

class QueryError extends Error {
    constructor({message, status}) {
        super(message)
        this.message = message
        this.status = status
    }
}

async function login ({ usuarioId, contrasena }) {
    try {
        const pre = usuarioId.substr(0, 3)
        const tipo = pre === 'lab' ? 'LABORATORISTA' : pre === 'doc' ? 'DOCTOR' : pre === 'enf' ? 'ENFERMERO' : pre === 'adm' ? 'ADMINISTRADOR' : null
        const q = `SELECT 
        ${ tipo }_ID AS id, 
        ${ tipo }_NOMBRES AS nombres, 
        ${ tipo }_APELLIDOS AS apellidos, 
        ${ tipo }_PASSWORD AS password
        FROM ${ tipo }
        WHERE ${ tipo }_ID = :usuarioId`

        if (!tipo) {
            throw new QueryError({ message: 'Credenciales incorrectas ', status: 403 })
        }
        const datosUsuario = await poolQuery(q, { usuarioId })
        if (datosUsuario.response.length === 0) {
            throw new QueryError({ message: 'Credenciales incorrectas', status: 403 })
        } else if (datosUsuario.response.length > 1) {
            throw new QueryError({ message: 'Más de un ID... ¿?', status: 400 })
        }

        // Desestructuración del objeto RowDataPacket
        let datos = {...datosUsuario.response[0]}
        if (!bcrypt.compareSync(contrasena, datos.password)) {
            throw new QueryError({ message: 'Credenciales incorrectas', status: 403 })
        }

        const token = generarToken(datos)
        datos = { nombres: datos.nombres, apellidos: datos.apellidos, id: usuarioId }
        return { ok: true, datos, token }
    } catch (error) {
        throw new QueryError({ message: error.message, status: 500 })
    }
}

async function respuestas (res, fnct, obj) {
    try {
        const execFnct = await fnct
        if (Array.isArray(obj)) {
            const objFinal = { ok: true }
            obj.forEach(function (o) {
                objFinal[o] = execFnct[o]
            })
            return res.json(objFinal)
        }
        return res.json({ ok: true, [obj]: execFnct[obj] })
    } catch (error) {
        return res.status(error.status || 500).json({ ok: false, message: error.message })
    }
}

function crearId (pre, arrResponse) {
    const numeros = arrResponse.length === 0 ? null : arrResponse.map(function (num) { return Number(num['id'].split(pre)[1]) })
    const numero = !numeros ? 1 : Math.max(...numeros) + 1
    const ceros = numero < 10 ? '00' : numero < 100 ? '0' : ''
    return pre + (pre === 'adm' ? ceros : '') + (numero.toString())
}

// http://pdfjs.rkusa.st
function crearPDF ({ examenDiagnostico, resultadoObservaciones, pacienteNombreCompleto, pacienteEdad, examenMuestra, doctorNombreCompleto, examenFecha, examenId, resultadoFecha }) {
    try {
        const regular = new pdf.Font(fs.readFileSync(path.join(__dirname, '..', 'fonts/Roboto-Regular.otf')))
        const bold = new pdf.Font(fs.readFileSync(path.join(__dirname, '..', 'fonts/Roboto-Bold.otf')))
    
        examenDiagnostico = String(examenDiagnostico.charAt(0).toLowerCase()).concat(examenDiagnostico.substr(1))
        const srcImg = fs.readFileSync(path.join(__dirname, '..', '/public/assets/img/logo.jpg'))
        const logo = new pdf.Image(srcImg)
        const doc = new pdf.Document({ font: regular })
        const header = doc.header().table({ widths: [null, null], paddingBottom: 1 * pdf.cm }).row()
        header.cell().image(logo, { width: 48, align: 'left' })
        const slogan = header.cell().table({ widths: [null]})
        slogan.row().cell('Novamedik', { textAlign: 'right', fontSize: 14, font: bold, paddingTop: 0.25 * pdf.cm })
        slogan.row().cell('Este es un hospital serio >:v', { textAlign: 'right' })
    
        doc.footer()
            .pageNumber(function (curr, total) { return curr + ' / ' + total }, { textAlign: 'center' })
    
        const intro = doc.cell({ paddingBottom: 1.5 * pdf.cm })
        intro.text(`${ doctorNombreCompleto }, médico general de Novamedik`, { fontSize: 16, font: bold })
        intro.text('PRESENTE:', { fontSize: 16, font: bold })
        intro.text(`ASUNTO: Resultados de exámenes para ${ examenDiagnostico }`, { fontSize: 16, font: bold })
        intro.text(`Por medio de la presente emito a usted el siguiente resultado de una muestra procesada para el diagnóstico de ${ examenDiagnostico } en el LABORATORIO CENTRAL DE NOVAMEDIK`)
    
        const table = doc.table({ 
            widths: [null, null],
            padding: 6
        })
    
        const nombre = table.row()
        nombre.cell('NOMBRE DEL PACIENTE')
        nombre.cell(pacienteNombreCompleto.toUpperCase(), { font: bold })
    
        const edad = table.row()
        edad.cell('EDAD')
        edad.cell(pacienteEdad.toUpperCase(), { font: bold })
    
        const tipoMuestra = table.row()
        tipoMuestra.cell('TIPO DE MUESTRA')
        tipoMuestra.cell(examenMuestra.toUpperCase(), { font: bold })
    
        const fechaToma = table.row()
        fechaToma.cell('FECHA DE TOMA')
        fechaToma.cell(examenFecha.toUpperCase(), { font: bold })
    
        const folioInterno = table.row()
        folioInterno.cell('FOLIO INTERNO')
        folioInterno.cell(examenId.toUpperCase(), { font: bold })
    
        const fechaRecepcion = table.row()
        fechaRecepcion.cell('FECHA DE RECEPCIÓN')
        fechaRecepcion.cell(resultadoFecha.toUpperCase(), { font: bold })
    
        const observaciones = doc.cell({ paddingTop: 1.5 * pdf.cm })
        observaciones.text(resultadoObservaciones)
    
        return doc
    } catch (error) {
        console.error('crearPDF:', error)
    }
}

// https://stackoverflow.com/questions/47089230/how-to-convert-buffer-to-stream-in-nodejs/54136803
function bufferToStream (binary) {
    const readableStream = new Readable({
        read() {
            try {
                const data = Buffer.from(binary, 'utf-8')
                this.push(data)
                this.push(null)
            } catch (error) {
                console.error('Imposible adherir: ', error)
            }
        }
    })
    return readableStream
}

module.exports = {
    crearId,
    insertarTurno,
    login,
    generarToken,
    crearPDF,
    bufferToStream,
    respuestas,
    QueryError,
    poolQuery
}