const Express = require('express')
const app = Express()
const { checkToken, isAdmin } = require('../middlewares')
const controllers = require('../controllers')
const utils = require('../utils')

app.get('/api', checkToken, function (req, res) {
    return res.json({ ok:true, id: req.usuarioId, tipo: req.tipo })
})

app.post('/api/login', async function (req, res) {
    const { usuarioId, contrasena } = req.body
    return await utils.respuestas(res, controllers.entrar({ usuarioId, contrasena }), ['datos', 'token'])
})

app.post('/api/admin', [checkToken, isAdmin], async function (req, res) {
    const { nombres, apellidos, contrasena } = req.body
    return await utils.respuestas(res, controllers.crearUsuario('adm', { nombres, apellidos, contrasena }), 'message')
})

app.post('/api/doctor', [checkToken, isAdmin], async function (req, res) {
    const { nombres, apellidos, contrasena } = req.body
    return await utils.respuestas(res, controllers.crearUsuario('doc', { nombres, apellidos, contrasena, adminId: req.admin }), 'message')
})

app.post('/api/paciente', [checkToken, isAdmin], async function (req, res) {
    const {
        nombres, apellidos, fechaNacimiento, lugarNacimiento, sexo, curp,
        grupoSanguineo, email, telefono, antecedentes: enfermedadesPreexistentes, alergias, direccion,
        contactoDireccion, contactoEmail, contactoNombre, contactoTelefono
    } = req.body
    return await utils.respuestas(res, controllers.crearPaciente({ 
        nombres, apellidos, fechaNacimiento, lugarNacimiento, sexo, curp,
        grupoSanguineo, email, telefono, enfermedadesPreexistentes, alergias, direccion,
        contactoDireccion, contactoEmail, contactoNombre, contactoTelefono, adminId: req.admin
    }), 'message')
})

app.post('/api/turno', [checkToken, isAdmin], async function (req, res) {
    const { usuarioId, horario, area } = req.body
    return await utils.respuestas(res, controllers.crearTurnoUsuario(req.admin, { usuarioId, area, horario }), 'message')
})

app.post('/api/internar', [checkToken, isAdmin], async function (req, res) {
    const { pacienteId, observacion, area } = req.body
    return await utils.respuestas(res, controllers.internarPaciente(pacienteId, observacion, area), 'message')
})

app.put('/api/paciente/:pacienteId', [checkToken, isAdmin], async function (req, res) {
    const { pacienteId } = req.params
    return await utils.respuestas(res, controllers.darAltaPaciente(pacienteId), 'message')
})

app.post('/api/laboratorista', [checkToken, isAdmin], async function (req, res) {
    const { nombres, apellidos, contrasena } = req.body
    return await utils.respuestas(res, controllers.crearUsuario('lab', { nombres, apellidos, contrasena, adminId: req.admin }), 'message')
})

app.post('/api/enfermero', [checkToken, isAdmin], async function (req, res) {
    const { nombres, apellidos, contrasena } = req.body
    return await utils.respuestas(res, controllers.crearUsuario('enf', { nombres, apellidos, contrasena, adminId: req.admin }), 'message')
})

app.post('/api/habitacion', [checkToken, isAdmin], async function (req, res) {
    const { piso, area } = req.body
    return await utils.respuestas(res, controllers.crearHabitacion(req.admin, { piso, area }), 'message')
})

app.get('/api/buscar', checkToken, async function (req, res) {
    req.setEncoding = 'utf-8'
    console.log('Buscando...')
    try {
        if (req.tipo === 'ADMINISTRADOR') {
            const { nombreUsuario, usuarioId } = req.query
            if (nombreUsuario && !usuarioId && nombreUsuario.length < 4) {
                return res.status(400).json({ ok: false, message: 'El nombre de búsqueda deben ser mayor a 4 caracteres' })
            } else if (nombreUsuario && !usuarioId) {
                return await utils.respuestas(res, controllers.buscarDatosUsuario(nombreUsuario), 'datos')
            } else if (usuarioId && !nombreUsuario) {
                return await utils.respuestas(res, controllers.obtenerDatosUsuario(usuarioId), 'datos')
            } else if (nombreUsuario && usuarioId) {
                return res.status(400).json({ ok: false, message: 'Solo se hace la búsqueda de un campo a la vez' })
            }
        } else if (req.tipo === 'DOCTOR' || req.tipo === 'LABORATORISTA') {
            const { pacienteId } = req.query
            console.log('Paciente transitorio:', pacienteId)
            return await utils.respuestas(res, controllers.obtenerDatosPacienteTransitorio(pacienteId), 'datos')
        } else {
            return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
        }
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
})

app.get('/api/mis-habitaciones', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO')
        return await utils.respuestas(res, controllers.obtenerHabitacionesAsignadas(req.usuarioId), 'habitaciones')
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.get('/api/habitacion', [checkToken, isAdmin], async function (req, res) {
    return await utils.respuestas(res, controllers.obtenerHabitacionesDisponibles(), 'habitaciones')
})

app.get('/api/habitacion/:area', checkToken, async function (req, res) {
    req.setEncoding = 'utf-8'
    const { area } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO' || req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerHabitacionesDisponibles(area), 'habitaciones')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/areas', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR' || req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerAreas(), 'areas')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.post('/api/consulta', checkToken, async function(req, res) {
    const { pacienteId, fecha, observaciones, consultorioId } = req.body
    const doctorId = req.doctorId || req.body.doctorId
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO')
        return await utils.respuestas(res, controllers.asignarConsultaPacienteTransitorio({ pacienteId, doctorId, fecha, observaciones, consultorioId }), 'message')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/consultas', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.obtenerConsultas(req.usuarioId), 'consultas')
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.get('/api/consulta/:consultaId', checkToken, async function (req, res) {
    const { consultaId } = req.params
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.obtenerConsulta(req.usuarioId, consultaId), ['consulta', 'datos', 'ingresos', 'examenes', 'resultados'])
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.put('/api/consulta/:consultaId', checkToken, async function (req, res) {
    const { consultaId } = req.params
    const { comentario } = req.body
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.comentarConsulta(req.usuarioId, {consultaId, comentario}), 'message')
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.post('/api/consultorio', [checkToken, isAdmin], async function (req, res) {
    const { piso } = req.body
    return await utils.respuestas(res, controllers.crearConsultorio(piso, req.admin), 'message')
})

app.get('/api/consultorios', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO' || req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerConsultorios(), 'consultorios')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })    
})

app.put('/api/consultorio/:consultorioId', [checkToken, isAdmin], async function (req, res) {
    const { doctorId } = req.body
    const { consultorioId } = req.params
    return await utils.respuestas(res, controllers.asignarPersonalConsultorio(doctorId, consultorioId), 'message')
})

app.get('/api/consultorio', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.obtenerConsultorioAsignado(req.doctorId), 'datos')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/pacientes', checkToken, async function (req, res) {
    if (req.tipo === 'ENFERMERO' || req.tipo === 'DOCTOR') 
        return await utils.respuestas(res, controllers.obtenerPacientesAsignados(req.usuarioId), 'pacientes')
    else if (req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerTodosPacientes(), 'pacientes')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/paciente/:pacienteId', checkToken, async function (req, res) {
    const { pacienteId } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO')
        return await utils.respuestas(res, controllers.obtenerPacientesAsignados(req.usuarioId, pacienteId), 'paciente')
    else if (req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerTodosPacientes(pacienteId), 'pacientes')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/transitorios', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO' || req.tipo === 'ADMINISTRADOR') 
        return await utils.respuestas(res, controllers.obtenerDatosPacienteTransitorio(), 'pacientes')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.put('/api/paciente/:paciente', [checkToken, isAdmin], async function (req, res) {
    const { paciente } = req.params
    const { grupoSanguineo, alergias, antescedentes, direccion, email, telefono, contactoNombre, contactoTelefono, contactoEmail, contactoDireccion } = req.body
    if (paciente)
        return await utils.respuestas(res, controllers.modificarDatosPaciente(paciente, { grupoSanguineo, alergias, antescedentes, direccion, email, telefono, contactoNombre, contactoTelefono, contactoEmail, contactoDireccion }), 'message')
    else
        return res.status(400).json({ ok: false, message: 'Datos mal enviados' })
})

app.put('/api/usuario/:usuarioId', checkToken, async function (req, res) {
    const { usuarioId } = req.params
    const { contrasena } = req.body
    if (usuarioId === req.usuarioId || req.admin)
        return await utils.respuestas(res, controllers.actualizarContrasena(usuarioId, contrasena), 'message')
    else
        return res.status(400).json({ ok: false, message: 'No se puede proceder con la solicitud' })
})

app.get('/api/usuarios', checkToken, async function (req, res) {
    if (req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerUsuarios(), ['doctor', 'enfermero', 'laboratorista', 'administrador'])
    else if (req.tipo === 'ENFERMERO')    
        return await utils.respuestas(res, controllers.obtenerUsuarios(), 'doctor')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.post('/api/examenes', checkToken, async function (req, res) {
    const { pacienteId, diagnostico, muestra } = req.body
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.crearExamenesMedicos({ doctorId: req.doctorId, diagnostico, muestra, pacienteId }), 'message')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/examenes', checkToken, async function (req, res) {
    if (req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.obtenerExamenesMedicos(req.usuarioId), ['examenes', 'pendientes'])
    else if (req.tipo === 'LABORATORISTA')
        return await utils.respuestas(res, controllers.obtenerExamenesPendientes(), 'examenes')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/examenes/:pacienteId', checkToken, async function (req, res) {
    const { pacienteId } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO' || req.tipo === 'ENFERMERO')
        return await utils.respuestas(res, controllers.obtenerExamenesMedicos(pacienteId), 'examenes')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/examen/:examenId', checkToken, async function (req, res) {
    const { examenId } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'LABORATORISTA' || req.tipo === 'ENFERMERO')
        return await utils.respuestas(res, controllers.obtenerExamenMedico(examenId), ['paciente', 'examen', 'comentarios', 'resultado', 'doctor'])
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.post('/api/resultados/:examenId', checkToken, async function (req, res) {
    const { examenId } = req.params
    const { diagnostico, observacion } = req.body
    if (req.tipo === 'LABORATORISTA')
        return await utils.respuestas(res, controllers.crearResultadosMedicos({ laboratoristaId: req.usuarioId, examenId, diagnostico, observacion }), 'message')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.post('/api/comentario/:resultadoId', checkToken, async function (req, res) {
    const { resultadoId } = req.params
    const { comentario } = req.body
    if (req.tipo === 'LABORATORISTA' || req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.crearComentario(req.usuarioId, {resultadoId, comentario}), ['message', 'comentarios'])
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/resultados', checkToken, async function (req, res) {
    if (req.tipo === 'LABORATORISTA')
        return await utils.respuestas(res, controllers.obtenerResultadosMedicos(req.usuarioId), 'resultados')
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.get('/api/resultado/:resultadoId', checkToken, async function (req, res) {
    const { resultadoId } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO') {
        try {
            res.setHeader('Content-Type', 'application/pdf;charset=utf-8')
            res.setHeader('Content-Disposition', 'attachment;filename=resultados.pdf')
            const readable = await controllers.descargarResultadosMedicos(resultadoId)
            readable.pipe(res)
        } catch (error) {
            return res.status(500).json({ ok: false, message: error.message })
        }
    }
    else if (req.tipo === 'LABORATORISTA')
        return await utils.respuestas(res, controllers.obtenerResultado(req.usuarioId, resultadoId), ['resultado','examen','paciente', 'comentarios'])
    else
        return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.get('/api/comentario/:resultadoId', checkToken, async function (req, res) {
    const { resultadoId } = req.params
    if (req.tipo === 'LABORATORISTA' || req.tipo === 'DOCTOR')
        return utils.respuestas(res, controllers.obtenerComentarioDeResultado(resultadoId), 'comentarios')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/historial/:pacienteId', checkToken, async function (req, res) {
    const { pacienteId } = req.params
    if (req.tipo === 'DOCTOR' || req.tipo === 'ENFERMERO' || req.tipo === 'ADMINISTRADOR')
        return await utils.respuestas(res, controllers.obtenerHistorialPaciente(req.usuarioId, pacienteId, true), ['datos', 'ingresos', 'examenes', 'resultados'])
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.post('/api/transferir', checkToken, async function (req, res) {
    const { area, razon, pacienteId } = req.body
    if (req.tipo === 'ADMINISTRADOR' || req.tipo === 'DOCTOR')
        return await utils.respuestas(res, controllers.transferirPaciente({ pacienteId, area, razon }), 'message')
    else
        return res.status(403).json({ ok: false, message: 'Acceso no autorizado' })
})

app.get('/api/*', function (req, res) {
    return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.post('*', function (req, res) {
    return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.put('*', function (req, res) {
    return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.delete('*', function (req, res) {
    return res.status(404).json({ ok: false, message: 'No se encontró lo que buscabas' })
})

app.get('*', function (req, res) {
    return res.redirect(404, '/error?error=404')
})

module.exports = app
