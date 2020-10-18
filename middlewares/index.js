const jwt = require('jsonwebtoken')
const { poolQuery } = require('../utils')

// const verify = util.promisify(jwt.verify)

function checkToken (req, res, next) {
    const bearerToken = req.headers.authorization

    try {
        if (bearerToken.includes('Bearer')) {
            const token = bearerToken.split(' ')[1]
            const datos = jwt.verify(token, process.env.SECRET_KEY)
            req.admin = datos['ADMINISTRADOR_ID']
            const { id } = datos
            const pre = id.substr(0, 3)
            const tipo = pre === 'enf' ? 'ENFERMERO' : pre === 'doc' ? 'DOCTOR' : pre === 'lab' ? 'LABORATORISTA' : pre === 'adm' ? 'ADMINISTRADOR' : null

            if (!tipo) {
                console.log('tipo:', tipo)
                return { ok: false, message: 'Acceso no autorizado', status: 403 }
            }
            poolQuery(`SELECT ${ tipo }_ID AS id FROM ${ tipo } WHERE ${ tipo }_ID = :id`, { id }).then(function (usuarioExiste) {
                if (!usuarioExiste.ok) {
                    return { ok: false, message: usuarioExiste.message, status: usuarioExiste.status }
                } else if (usuarioExiste.ok && usuarioExiste.response.length === 0) {
                    return { ok: false, message: 'Acceso no autorizado', status: 400 }
                }
                req.usuarioId = usuarioExiste.response[0].id
                req.admin = pre === 'adm' ? req.usuarioId : null
                req.doctorId = pre === 'doc' ? req.usuarioId : null
                req.enfermeroId = pre === 'enf' ? req.usuarioId : null
                req.laboratoristaId = pre === 'lab' ? req.usuarioId : null
                req.tipo = tipo
                console.log('req.usuarioId:', req.usuarioId)
                next()
            })
        } else {
            return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
        }
    } catch (error) {
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
    }
}

function isAdmin (req, res, next) {
    if (!req.usuarioId) {
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado', status: 403 })
    }
    const q = 'SELECT ADMINISTRADOR_ID AS id FROM ADMINISTRADOR WHERE ADMINISTRADOR_ID = :adminId'
    poolQuery(q, { adminId: req.usuarioId }).then(function (isAdmin) {
        if (!isAdmin.ok) {
            return res.status(isAdmin.status).json({ ok: false, message: isAdmin.message })
        } else if (isAdmin.ok && isAdmin.response.length === 0) {
            return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
        }
        req.admin = req.usuarioId
        next()
    })
}

module.exports = {
    isAdmin,
    checkToken
}
