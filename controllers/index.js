const bcrypt = require('bcrypt')
const _ = require('underscore')
const { poolQuery, login, crearId, insertarTurno, crearPDF, bufferToStream, QueryError } = require('../utils')

/**
 * ===========================
 * Administrador
 * ===========================
 */

async function internarPaciente (pacienteId, observacion, area) {
    try {
        const queryExiste = 'SELECT * FROM PACIENTEINTERNADO WHERE PACIENTE_ID = :pacienteId'
        const pacienteInternado = await poolQuery(queryExiste, { pacienteId })

        if (pacienteInternado.ok && pacienteInternado.response.length > 0) {
            throw new QueryError({ message: 'Ese paciente ya está internado', status: 400 })
        }

        const internadosIds = await poolQuery('SELECT PACIENTEINTERNADO_ID AS id FROM PACIENTEINTERNADO;')
        const internadoId = crearId('pin', internadosIds.response)

        const habitacionesDisponibles = await obtenerHabitacionesDisponibles(area)
        const habitacionesId = habitacionesDisponibles.habitaciones.map(function (hab) { return hab.id })
        const randomId = habitacionesId[Math.floor((Math.random() * habitacionesId.length) + 1) - 1]

        const fecha = new Date()
        const insertarInternado = `INSERT INTO PACIENTEINTERNADO (PACIENTEINTERNADO_ID, PACIENTEINTERNADO_FECHAINGRESO, PACIENTEINTERNADO_OBSERVACION, PACIENTE_ID, HABITACION_ID)
        VALUES (:internadoId, :fecha, :observacion, :pacienteId, :habitacionId)`

        const insertarResponse = await poolQuery(insertarInternado, { pacienteId, internadoId, fecha, observacion, habitacionId: randomId })

        return { ok: true, message: `Paciente ${ pacienteId } internado` }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearPaciente ({
    nombres, apellidos, fechaNacimiento, sexo, lugarNacimiento, curp,
    grupoSanguineo, enfermedadesPreexistentes, alergias, email, telefono, direccion,
    contactoNombre, contactoTelefono, contactoEmail, contactoDireccion, adminId
}) {
    try {
        const pacienteExiste = await poolQuery('SELECT PACIENTE_CURP AS curp, PACIENTE_NOMBRES AS nombres, PACIENTE_APELLIDOS AS apellidos FROM PACIENTE WHERE PACIENTE_CURP = :curp OR (PACIENTE_NOMBRES = :nombres AND PACIENTE_APELLIDOS = :apellidos)', {curp, nombres, apellidos})

        if (pacienteExiste.ok && pacienteExiste.response.length !== 0) {
            throw new QueryError({ message: 'Ya existe un paciente con esos datos', status: 400 })
        }

        const responseIds = await poolQuery('SELECT PACIENTE_ID AS id FROM PACIENTE;')

        const pacienteId = crearId('pac', responseIds.response)
        const q = `INSERT INTO PACIENTE
        ( 
            PACIENTE_ID, PACIENTE_NOMBRES, PACIENTE_APELLIDOS, PACIENTE_FECHANACIMIENTO, PACIENTE_SEXO, PACIENTE_LUGARNACIMIENTO, PACIENTE_CURP,
            PACIENTE_GRUPOSANGUINEO, PACIENTE_ENFERMEDADESPREEXISTENTES, PACIENTE_ALERGIAS, PACIENTE_EMAIL, PACIENTE_TELEFONO, PACIENTE_DIRECCION,
            PACIENTE_CONTACTO_NOMBRE, PACIENTE_CONTACTO_TELEFONO, PACIENTE_CONTACTO_EMAIL, PACIENTE_CONTACTO_DIRECCION, ADMINISTRADOR_ID
        ) VALUES (
            :pacienteId, :nombres, :apellidos, :fechaNacimiento, :sexo, :lugarNacimiento, :curp,
            :grupoSanguineo, :enfermedadesPreexistentes, :alergias, :email, :telefono, :direccion, 
            :contactoNombre, :contactoTelefono, :contactoEmail, :contactoDireccion, :adminId
        );`
        const data = {
            pacienteId, nombres, apellidos, fechaNacimiento, lugarNacimiento, sexo, curp,
            grupoSanguineo, telefono, direccion,
            contactoNombre, contactoTelefono, contactoDireccion, adminId
        }
        data['enfermedadesPreexistentes'] = enfermedadesPreexistentes ? enfermedadesPreexistentes : null
        data['alergias'] = alergias ? alergias : null
        data['email'] = email ? email : null
        data['contactoEmail'] = contactoEmail ? contactoEmail : null
        const insertPaciente = await poolQuery(q, data)

        return { ok: true, message: 'Paciente creado' }
    } catch (error) {
        console.error(error)
        throw new QueryError({ message: error.message || "No se pudo crear el paciente", status: error.status || 500 })
    }
}

async function obtenerTodosPacientes (pacienteId) {
    try {
        const q = `SELECT PA.PACIENTE_ID AS id, PA.PACIENTE_NOMBRES AS nombres, PA.PACIENTE_APELLIDOS AS apellidos,
        PA.PACIENTE_FECHANACIMIENTO AS fechaNacimiento, PA.PACIENTE_LUGARNACIMIENTO AS lugarNacimiento, PA.PACIENTE_SEXO AS sexo,
        PA.PACIENTE_CURP AS curp, PA.PACIENTE_GRUPOSANGUINEO AS grupoSanguineo, PA.PACIENTE_EMAIL AS email, PA.PACIENTE_TELEFONO AS telefono,
        PA.PACIENTE_DIRECCION AS direccion,
        PA.PACIENTE_ENFERMEDADESPREEXISTENTES AS antecedentes, PA.PACIENTE_ALERGIAS AS alergias,
        PI.PACIENTEINTERNADO_FECHAINGRESO AS fechaIngreso, PI.PACIENTEINTERNADO_FECHAALTA AS fechaAlta, HA.HABITACION_AREA AS area,
        PA.PACIENTE_CONTACTO_NOMBRE AS contactoNombre, PA.PACIENTE_CONTACTO_TELEFONO AS contactoTelefono,
        PA.PACIENTE_CONTACTO_EMAIL AS contactoEmail, PA.PACIENTE_CONTACTO_DIRECCION AS contactoDireccion
        FROM PACIENTE PA LEFT JOIN PACIENTEINTERNADO PI ON PI.PACIENTE_ID = PA.PACIENTE_ID AND PI.PACIENTEINTERNADO_FECHAALTA IS NULL
        LEFT JOIN HABITACION HA ON PI.HABITACION_ID = HA.HABITACION_ID
        ${ pacienteId ? 'HAVING PA.PACIENTE_ID = :pacienteId' : ''};`
        const pacientes = await poolQuery(q, { pacienteId })
        return { ok: true, pacientes: pacientes.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function darAltaPaciente (pacienteId) {
    try {
        const queryInternado = `SELECT PACIENTEINTERNADO_ID AS id FROM PACIENTEINTERNADO 
        WHERE PACIENTE_ID = :pacienteId AND PACIENTEINTERNADO_FECHAALTA IS NULL;`

        const estaInternado = await poolQuery(queryInternado, { pacienteId })
        if (estaInternado.response.length === 0) {
            throw new QueryError({ message: 'Ese paciente no está internado', status: 400 })
        }

        const fecha = new Date()
        const pinId = estaInternado.response[0].id
        const altaInternado = `UPDATE PACIENTEINTERNADO
        SET PACIENTEINTERNADO_FECHAALTA = :fecha
        WHERE PACIENTEINTERNADO_ID = :pinId;`

        await poolQuery(altaInternado, { pinId, fecha })
        return { ok: true, message: 'Paciente dado de alta' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearConsultorio (piso, adminId) {
    piso = Number(piso) < 10 ? '0' + Number(piso).toString() : piso
    try {
        const ultimoId = await poolQuery(' SELECT CONSULTORIO_ID AS id FROM CONSULTORIO;')

        const consultorioId = crearId('cno', ultimoId.response)
        const q = 'INSERT INTO CONSULTORIO (CONSULTORIO_ID, CONSULTORIO_PISO, ADMINISTRADOR_ID) VALUES (:consultorioId, :piso, :adminId);'
        const insertConsultorio = await poolQuery(q, { piso, adminId, consultorioId })

        return { ok: true, message: `Consultorio creado. ${ consultorioId }` }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearHabitacion (adminId, { piso, area }) {
    try {
        piso = Number(piso) < 10 ? '0'.concat(String(piso)) : String(piso)
        const habitacionesArea = await poolQuery('SELECT HABITACION_ID AS id FROM HABITACION WHERE HABITACION_AREA = :area', { area })

        const pre = habitacionesArea.response[0] ? String(habitacionesArea.response[0].id).substr(0, 3) : String(area).charAt(0).toLowerCase().concat(area.substr(1, 2))

        const habitacionId = crearId(pre, habitacionesArea.response)
        const insertHabitacion = `INSERT INTO HABITACION (
            HABITACION_ID, HABITACION_PISO, HABITACION_AREA, ADMINISTRADOR_ID
        ) VALUES (
            :habitacionId, :piso, :area, :adminId
        );`

        const queryInsertar = await poolQuery(insertHabitacion, { habitacionId, piso, area, adminId })

        return { ok: true, message: 'Habitación creada' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearUsuario (tipo, {nombres, apellidos, contrasena, adminId}) {
    if (tipo !== 'doc' && tipo !== 'enf' && tipo !== 'lab' && tipo !== 'adm') {
        throw new QueryError({ message: 'Tipo de usuario incorrecto', status: 400 })
    }
    try {
        const originalTipo = tipo
        tipo = tipo === 'doc' ? 'DOCTOR' : tipo === 'lab' ? 'LABORATORISTA' : tipo === 'enf' ? 'ENFERMERO' : 'ADMINISTRADOR'
        const busquedaUsuario = await poolQuery(`SELECT ${ tipo }_ID FROM ${ tipo } WHERE ${ tipo }_NOMBRES = :nombres AND ${ tipo }_APELLIDOS = :apellidos`, { nombres, apellidos })
        if (!busquedaUsuario.ok || busquedaUsuario.response.length === 1) {
            throw new QueryError({ message: 'Ya existe un usuario registrado con esos datos', status: 400 })
        }

        const ultimoId = await poolQuery(`SELECT ${ tipo }_ID AS id FROM ${ tipo }`)

        const usuarioId = crearId(originalTipo, ultimoId.response)
        // https://www.npmjs.com/package/bcrypt#usage
        const password = bcrypt.hashSync(contrasena, 10)
        const q = `INSERT INTO ${ tipo } (
            ${ tipo }_ID, ${ tipo }_PASSWORD, ${ tipo }_NOMBRES, ${ tipo }_APELLIDOS${ originalTipo !== 'adm' ? ', ADMINISTRADOR_ID' : '' }
        ) VALUES (
            :usuarioId, :password, :nombres, :apellidos${ originalTipo !== 'adm' ? ', :adminId' : '' }
        )`
        const data = {usuarioId, password, nombres, apellidos, adminId}
        const insertUsuario = await poolQuery(q, data)
        return { ok: true, message: 'Se creo usuario ' + usuarioId }
    } catch (error) {
        throw new QueryError({ message: 'No se pudo crear el campo', status: error.status || 500 })
    }
}

async function obtenerUsuarios () {
    try {
        const q = `SELECT DOCTOR_ID AS id, DOCTOR_NOMBRES AS nombres, DOCTOR_APELLIDOS AS apellidos FROM DOCTOR;
        SELECT ENFERMERO_ID AS id, ENFERMERO_NOMBRES AS nombres, ENFERMERO_APELLIDOS AS apellidos FROM ENFERMERO;
        SELECT LABORATORISTA_ID AS id, LABORATORISTA_NOMBRES AS nombres, LABORATORISTA_APELLIDOS AS apellidos FROM LABORATORISTA;
        SELECT ADMINISTRADOR_ID AS id, ADMINISTRADOR_NOMBRES AS nombres, ADMINISTRADOR_APELLIDOS AS apellidos FROM ADMINISTRADOR;`
        const usuarios = await poolQuery(q)
        const doctor = [...usuarios.response[0]]
        const enfermero = [...usuarios.response[1]]
        const laboratorista = [...usuarios.response[2]]
        const administrador = [...usuarios.response[3]]
        return { ok: true, doctor, enfermero, laboratorista, administrador }
    } catch (error) {
        throw new QueryError({ message: error.message, status: 500 })
    }
}

async function obtenerDatosUsuario (usuarioId) {
    try {
        const pre = usuarioId.substr(0, 3)
        const tipo = pre === 'doc' ? 'DOCTOR' : pre === 'enf' ? 'ENFERMERO' : pre === 'lab' ? 'LABORATORISTA' : pre === 'adm' ? 'ADMINISTRADOR' : null
        if (!tipo) {
            throw new QueryError({ message: 'Datos incorrectos', status: 400 })
        }
        const q = `SELECT ${ tipo }_ID AS id, ${ tipo }_NOMBRES AS nombres, ${ tipo }_APELLIDOS AS apellidos FROM ${ tipo } WHERE ${ tipo }_ID = :usuarioId`
        const usuarioResponse = await poolQuery(q, { usuarioId })
        return { ok: true, datos: usuarioResponse.response[0] }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function buscarDatosUsuario (nombreUsuario) {
    try {
        const q = `SELECT DOCTOR_ID AS id, DOCTOR_NOMBRES AS nombres, DOCTOR_APELLIDOS AS apellidos FROM DOCTOR WHERE DOCTOR_NOMBRES LIKE "%:nombreUsuario%" OR DOCTOR_APELLIDOS LIKE "%:nombreUsuario%";
        SELECT ENFERMERO_ID AS id, ENFERMERO_NOMBRES AS nombres, ENFERMERO_APELLIDOS AS apellidos FROM ENFERMERO WHERE ENFERMERO_NOMBRES LIKE "%:nombreUsuario%" OR ENFERMERO_APELLIDOS LIKE "%:nombreUsuario%";
        SELECT LABORATORISTA_ID AS id, LABORATORISTA_NOMBRES AS nombres, LABORATORISTA_APELLIDOS AS apellidos FROM LABORATORISTA WHERE LABORATORISTA_NOMBRES LIKE "%:nombreUsuario%" OR LABORATORISTA_APELLIDOS LIKE "%:nombreUsuario%";
        SELECT ADMINISTRADOR_ID AS id, ADMINISTRADOR_NOMBRES AS nombres, ADMINISTRADOR_APELLIDOS AS apellidos FROM ADMINISTRADOR WHERE ADMINISTRADOR_NOMBRES LIKE "%:nombreUsuario%" OR ADMINISTRADOR_APELLIDOS LIKE "%:nombreUsuario%";`
        const usuarios = await poolQuery(q, { nombreUsuario })
        const datos = usuarios.response.filter(function (usuario) { return usuario.length > 0 })
        if (datos.length === 0) {
            throw new QueryError({ message: 'No hay usuario con esos datos', status: 404 })
        }
        return { ok: true, datos }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function asignarPersonalConsultorio (usuarioId, consultorioId) {
    try {
        const queryDisponibles = `SELECT CONSULTORIO_ID AS id, CONSULTORIO_PISO AS piso FROM CONSULTORIO 
        WHERE DOCTOR_ID IS NULL AND CONSULTORIO_ID = :consultorioId`
        const resDisponibles = await poolQuery(queryDisponibles, { consultorioId })
        if (resDisponibles.ok && resDisponibles.response.length === 0) {
            throw new QueryError({ message: 'Ese consultorio no está disponible', status: 400 })
        }
        const updateConsultorio = `UPDATE CONSULTORIO
        SET DOCTOR_ID = :usuarioId
        WHERE CONSULTORIO_ID = :consultorioId`
        const resUpdate = await poolQuery(updateConsultorio, { usuarioId, consultorioId })
        console.log('resUpdate:', resUpdate)
        return { ok: true, message: 'Consultorio asignado' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerHabitacionesDisponibles (area = undefined) {
    try {
        const areas = await poolQuery(` SELECT HABITACION_AREA AS area
        FROM HABITACION
        GROUP BY HABITACION_AREA;`)
        if (areas.ok && areas.response.length === 0) {
            throw new QueryError({ message: 'No hay áreas disponibles', status: 404 })
        }

        const nombreAreas = areas.response.map(function (a) { return a.area })

        const q = `SELECT H.HABITACION_ID AS id, H.HABITACION_PISO AS piso, H.HABITACION_AREA AS area 
        FROM HABITACION H 
        LEFT JOIN PACIENTEINTERNADO P ON NOT(H.HABITACION_ID = P.HABITACION_ID)
        ${ area ? 'HAVING H.HABITACION_AREA = :area' : '' }
        ORDER BY H.HABITACION_AREA;`

        // Se modifica la variable dada para que la primera letra sea mayúscula y agregar espacios entre palabras
        area = !area ? area : String().concat(String(area[0]).toUpperCase(), area.substring(1)).replace(/%20|-/g, ' ')
        if (area && !nombreAreas.includes(area)) {
            throw new QueryError({ message: 'El área no existe', status: 400 })
        }

        const { response } = await poolQuery(q, { area })
        return { ok: true, habitaciones: [...response] }
    } catch (error) {
        console.error(error)
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerConsultorios () {
    try {
        const q = `
        SELECT CONSULTORIO_ID AS id, CONSULTORIO_PISO AS piso,
        "doctorId", "doctorNombres", "doctorApellidos"
        FROM CONSULTORIO
        WHERE DOCTOR_ID IS NULL
        UNION ALL
        SELECT C.CONSULTORIO_ID AS id, C.CONSULTORIO_PISO AS piso,
        D.DOCTOR_ID AS doctorId, D.DOCTOR_NOMBRES AS doctorNombres, D.DOCTOR_APELLIDOS AS doctorApellidos
        FROM CONSULTORIO C, DOCTOR D
        WHERE D.DOCTOR_ID = C.DOCTOR_ID
        ORDER BY id
        `
        const consultorios = await poolQuery(q)
        if (consultorios.response.length === 0) {
            throw new QueryError({ message: 'No hay consultorios disponibles', status: 404 })
        }
        return { ok: true, consultorios: consultorios.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearTurnoUsuario (adminId, {usuarioId, horario, area}) {
    try {
        if (horario !== 'matutino' && horario !== 'vespertino' && horario !== 'nocturno') {
            throw new QueryError({ message: 'No se envió un horario válido', status: 400 })
        }
        const pre = String(usuarioId).substr(0, 3)
        const tipo = pre === 'enf' ? 'ENFERMERO' : pre === 'doc' ? 'DOCTOR' : null
        if (!tipo) {
            throw new QueryError({ message: 'Usuario no definido', status: 400 })
        }

        const usuarioExiste = await poolQuery(`SELECT ${ tipo }_ID AS id FROM ${ tipo } WHERE ${ tipo }_ID = :usuarioId`, { usuarioId })
        if (usuarioExiste.ok && usuarioExiste.response.length === 0) {
            throw new QueryError({ message: 'El usuario no existe', status: 400 })
        }

        const habitacionesArea = await poolQuery('SELECT HABITACION_ID AS id FROM HABITACION WHERE HABITACION_AREA = :area', { area })
        if (habitacionesArea.ok && habitacionesArea.response.length === 0) {
            throw new QueryError({ message: 'No hay habitaciones qué asignar', status: 400 })
        }

        const habitaciones = habitacionesArea.response.map(function (habitacion) { return habitacion.id })

        const turnosExistentes = await poolQuery(`SELECT TURNO_${ tipo }_ID AS id FROM TURNO_${ tipo }`)

        return await insertarTurno(tipo, { usuarioId, horario, habitaciones, adminId })
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerAreas () {
    try {
        const areasArr = await poolQuery('SELECT HABITACION_AREA AS areas, COUNT(HABITACION_ID) AS habitaciones FROM HABITACION GROUP BY HABITACION_AREA;')
        const areas = areasArr.response.map(function (area) { return {nombre: area.areas, habitaciones: area.habitaciones} })
        return { ok: true, areas }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function modificarDatosPaciente (pacienteId, { grupoSanguineo, alergias, antecedentes, direccion, email, telefono, contactoNombre, contactoTelefono, contactoEmail, contactoDireccion }) {
    try {
        const datos = { grupoSanguineo, alergias, antecedentes, direccion, email, telefono, contactoNombre, contactoTelefono, contactoEmail, contactoDireccion }
        const queryArr = []
        queryArr.push(`UPDATE PACIENTE SET ${grupoSanguineo ? 'PACIENTE_GRUPOSANGUINEO = :grupoSanguineo' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${alergias ? 'PACIENTE_ALERGIAS = :alergias' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${antecedentes ? 'PACIENTE_ENFERMEDADESPREEXISTENTES = :antecedentes' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${direccion ? 'PACIENTE_DIRECCION = :direccion' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${email ? 'PACIENTE_EMAIL = :email' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${telefono ? 'PACIENTE_TELEFONO = :telefono' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${contactoNombre ? 'PACIENTE_CONTACTO_NOMBRE = :contactoNombre' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${contactoTelefono ? 'PACIENTE_CONTACTO_TELEFONO = :contactoTelefono' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${contactoEmail ? 'PACIENTE_CONTACTO_EMAIL = :contactoEmail' : ''} WHERE PACIENTE_ID = :pacienteId`)
        queryArr.push(`UPDATE PACIENTE SET ${contactoDireccion ? 'PACIENTE_CONTACTO_DIRECCION = :contactoDireccion' : ''} WHERE PACIENTE_ID = :pacienteId`)
        const q = queryArr.filter(function (query) { return !query.includes('SET  WHERE')})

        const actualizacion = await poolQuery(q.join(';'), { pacienteId, ...datos })
        if (actualizacion.response['affectedRows'] === 0) {
            throw new QueryError({ message: 'No se modificó ningún campo', status: 400 })
        }

        return { ok: true, message: 'Se cambiaron los datos de usuario' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function actualizarContrasena (usuarioId, contrasena) {
    try {
        contrasena = bcrypt.hashSync(contrasena, 10)
        const pre = usuarioId.substr(0, 3)
        const tipo = pre === 'enf' ? 'ENFERMERO' : pre === 'doc' ? 'DOCTOR' : pre === 'adm' ? 'ADMINISTRADOR' : pre === 'lab' ? 'LABORATORISTA' : null
        if (!tipo) {
            throw new QueryError({ message: 'Usuario incorrecto', status: 400 })
        }
        const q = `UPDATE ${ tipo } SET ${ tipo }_PASSWORD = :contrasena WHERE ${ tipo }_ID = :usuarioId`
        const actualizacion = await poolQuery(q, { usuarioId, contrasena })
        if (actualizacion.response.affectedRows === 0) {
            throw new QueryError({ message: 'No se pudo cambiar la contraseña', status: 400 })
        }
        return { ok: true, message: 'Datos cambiados correctamente' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

/**
 * ===========================
 * Doctor y enfermero
 * ===========================
 */

async function obtenerHistorialPaciente (usuarioId, pacienteId, internado) {
    try {
        const tipo = usuarioId.substr(0, 3) === 'doc' ? 'DOCTOR' : usuarioId.substr(0, 3) === 'enf' ? 'ENFERMERO' : usuarioId.substr(0, 3) === 'adm' ? 'ADMINISTRADOR' : undefined
        const esAdmin = tipo === 'ADMINISTRADOR'
        // Verificación de paciente asignado
        const queryAsignado = `SELECT P.PACIENTE_ID AS id
        FROM PACIENTEINTERNADO P, TURNO_${ tipo } T
        WHERE P.PACIENTE_ID = :pacienteId AND 
        T.HABITACION_ID = P.HABITACION_ID AND 
        T.${ tipo }_ID = :usuarioId;`
        const esPacienteAsignado = !esAdmin && internado && tipo ? await poolQuery(queryAsignado, { usuarioId, pacienteId }) : undefined
        if (esPacienteAsignado && esPacienteAsignado.response.length === 0) {
            throw new QueryError({ message: 'No tienes asignado ese paciente', status: 401 })
        }

        const buscarPaciente = await poolQuery('SELECT * FROM PACIENTE WHERE PACIENTE_ID = :pacienteId', { pacienteId })
        if (buscarPaciente.ok && buscarPaciente.response.length === 0) {
            throw new QueryError({ message: 'No existe el paciente', status: 404 })
        }
        const q = `
SELECT PACIENTE_NOMBRES AS pacienteNombres, PACIENTE_APELLIDOS AS pacienteApellidos, PACIENTE_FECHANACIMIENTO AS pacienteFechaNacimiento, PACIENTE_SEXO AS pacienteSexo, PACIENTE_LUGARNACIMIENTO AS pacienteLugarNacimiento, PACIENTE_CURP AS pacienteCurp, 
PACIENTE_GRUPOSANGUINEO AS pacienteGrupoSanguineo, PACIENTE_ENFERMEDADESPREEXISTENTES AS pacienteEnfermedades, PACIENTE_ALERGIAS AS pacienteAlergias, PACIENTE_EMAIL AS pacienteEmail, PACIENTE_TELEFONO AS pacienteTelefono, PACIENTE_DIRECCION AS pacienteDireccion
FROM PACIENTE WHERE PACIENTE_ID = :pacienteId;
SELECT PACIENTEINTERNADO_ID AS internadoId, PACIENTEINTERNADO_FECHAINGRESO AS fecha, PACIENTEINTERNADO_FECHAALTA AS alta, PACIENTEINTERNADO_OBSERVACION AS observacion, HABITACION_ID AS habitacionId
FROM PACIENTEINTERNADO WHERE PACIENTE_ID = :pacienteId;
SELECT EXAMEN_ID AS examenId, EXAMEN_FECHA AS fecha, EXAMEN_DIAGNOSTICO AS examenDiagnostico FROM EXAMEN WHERE PACIENTE_ID = :pacienteId;
SELECT R.RESULTADO_ID AS resultadoId, R.EXAMEN_ID AS examenId, R.RESULTADO_FECHA AS fecha, R.RESULTADO_DIAGNOSTICO AS resultadoDiagnostico, X.EXAMEN_DIAGNOSTICO AS examenDiagnostico
FROM RESULTADO R INNER JOIN EXAMEN X ON R.EXAMEN_ID = X.EXAMEN_ID AND R.PACIENTE_ID = :pacienteId`
        const queryHistorial = await poolQuery(q, { pacienteId })

        if (queryHistorial.ok && queryHistorial.response.length === 0) {
            throw new QueryError({ message: 'No hay historial de este paciente', status: 404 })
        }

        const datos = {...queryHistorial['response'][0][0]}
        const ingresos = queryHistorial['response'][1]
        const examenes = queryHistorial['response'][2]
        const resultados = queryHistorial['response'][3]

        const ingresoActual = ingresos.filter(function (ingreso) { return ingreso.fecha && !ingreso.alta })
        if (ingresoActual.length === 1) {
            const habitacionId = ingresoActual[0].habitacionId
            const datosArea = await poolQuery('SELECT HABITACION_AREA AS area FROM HABITACION WHERE HABITACION_ID = :habitacionId', { habitacionId })
            datos['areaInternado'] = datosArea['response'][0].area
        }

        return { ok: true, datos, ingresos, examenes, resultados }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function asignarConsultaPacienteTransitorio ({pacienteId, doctorId, fecha, observaciones, consultorioId}) {
    try {
        const hoy = new Date()
        if (hoy > Date(fecha)) {
            throw new QueryError({ message: 'La fecha es incorrecta', status: 400 })
        }
        // Si el paciente es transitorio
        const queryPaciente = 'SELECT PACIENTETRANSITORIO_ID AS id FROM PACIENTETRANSITORIO WHERE PACIENTE_ID = :pacienteId'
        const responseTransitorio = await poolQuery(queryPaciente, { pacienteId })

        const transitorios = await poolQuery('SELECT PACIENTETRANSITORIO_ID AS id FROM PACIENTETRANSITORIO')
        const transitorioId = crearId('pat', transitorios.response)
        if (responseTransitorio.ok && responseTransitorio.response.length === 0) {
            const q = 'INSERT INTO PACIENTETRANSITORIO (PACIENTETRANSITORIO_ID, PACIENTE_ID) VALUES (:transitorioId, :pacienteId)'
            await poolQuery(q, { transitorioId, pacienteId })
        }
        const consultas = await poolQuery('SELECT CONSULTA_ID AS id FROM CONSULTA;')
        const queryConsulta = `INSERT INTO CONSULTA (
            CONSULTA_ID, PACIENTETRANSITORIO_ID, DOCTOR_ID, CONSULTA_FECHA, ${ observaciones ? 'CONSULTA_OBSERVACIONES,' : '' } CONSULTORIO_ID
        ) VALUES (
            :consultaId, :pacienteId, :doctorId, :fecha, ${ observaciones ? ':observaciones,' : '' } :consultorioId
        );`
        const consultaId = crearId('csa', consultas.response)
        fecha = new Date(fecha)
        const data = { consultaId, pacienteId: responseTransitorio.response.length === 0 ? transitorioId : responseTransitorio.response[0].id, doctorId, fecha, consultorioId }
        data['observaciones'] = observaciones ? observaciones : null
        const responseInsert = await poolQuery(queryConsulta, data)
        return { ok: true, message: 'Se agendó la consulta' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerHabitacionesAsignadas (usuarioId) {
    try {
        const tipo = usuarioId.includes('enf') ? 'ENFERMERO' : 'DOCTOR'

        const queryHabitaciones = `SELECT HABITACION_ID AS id FROM TURNO_${ tipo } WHERE ${ tipo }_ID = :usuarioId;`
        const habitaciones = await poolQuery(queryHabitaciones, { usuarioId })
        if (habitaciones.ok && habitaciones.response.length === 0) {
            throw new QueryError({ messge: 'No hay habitaciones asignadas', status: 404 })
        }
        const habitacionesId = habitaciones.response.map(function (hab) { return hab.id })
        return { ok: true, habitaciones: habitacionesId }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerPacientesAsignados (usuarioId, pacienteId = undefined) {
    try {
        const tipo = usuarioId.includes('enf') ? 'ENFERMERO' : usuarioId.includes('doc') ? 'DOCTOR' : undefined
        const queryPacientes = `SELECT 
        PA.PACIENTE_ID AS id,
        PA.PACIENTE_NOMBRES AS nombres,
        PA.PACIENTE_APELLIDOS AS apellidos,
        PA.PACIENTE_GRUPOSANGUINEO AS grupoSanguineo,
        PA.PACIENTE_CURP AS curp,
        PA.PACIENTE_SEXO AS sexo,
        PI.PACIENTEINTERNADO_FECHAINGRESO AS fechaIngreso,
        PI.PACIENTEINTERNADO_OBSERVACION AS motivo,
        TU.HABITACION_ID AS habitacionId,
        HA.HABITACION_AREA AS area
        FROM PACIENTE PA, PACIENTEINTERNADO PI, TURNO_${ tipo } TU, HABITACION HA
        WHERE TU.${ tipo }_ID = :usuarioId AND
        PI.PACIENTE_ID = PA.PACIENTE_ID AND
        PI.PACIENTEINTERNADO_FECHAALTA IS NULL AND
        PI.HABITACION_ID = TU.HABITACION_ID AND
        PI.PACIENTEINTERNADO_FECHAALTA IS NULL AND
        HA.HABITACION_ID = PI.HABITACION_ID`
        const pacientes = await poolQuery(queryPacientes, { usuarioId })
        if (pacientes.ok && pacientes.response.length === 0) {
            throw new QueryError({ message: 'No hay pacientes asignados', status: 404 })
        }
        const pacientesId = pacientes.response.map(function (pac) { return pac.id })

        if (!pacienteId) {
            return { ok: true, pacientes: pacientes.response }
        } else if (pacientesId.includes(pacienteId)) { 
            const paciente = pacientes.response[pacientesId.indexOf(pacienteId)]
            return { ok: true, paciente }
        } else {
            throw new QueryError({ message: 'No tiene asignado ese paciente', status: 400 })
        }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerConsultorioAsignado (doctorId) {
    try {
        const existe = await poolQuery(`SELECT 
            CONSULTORIO_ID AS id,
            CONSULTORIO_PISO AS piso,
            DOCTOR_ID AS doctorId 
            FROM CONSULTORIO 
            WHERE DOCTOR_ID = :doctorId`, { doctorId })

        if (existe.ok && existe.response.length === 0) {
            throw new QueryError({ message: 'Ningún consultorio asignado', status: 404 })
        }

        const datos = existe.response.map(function (d) { return { ...d } })

        return { ok:true, datos }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerExamenesMedicos (usuarioId, pacienteId = undefined) {
    try {
        const queryExamenes = `SELECT
        X.EXAMEN_ID AS examenId,
        X.EXAMEN_FECHA AS examenFecha,
        X.EXAMEN_DIAGNOSTICO AS examenDiagnostico,
        X.EXAMEN_MUESTRA AS examenMuestra,
        P.PACIENTE_ID AS pacienteId,
        P.PACIENTE_NOMBRES AS pacienteNombres,
        P.PACIENTE_APELLIDOS AS pacienteApellidos
        FROM EXAMEN X, PACIENTE P
        WHERE X.PACIENTE_ID = P.PACIENTE_ID
        AND X.DOCTOR_ID = :usuarioId
        ${ pacienteId ? 'AND P.PACIENTE_ID = :pacienteId' : ';' }`
        const examenes = await poolQuery(queryExamenes, { usuarioId, pacienteId })
        if (examenes.ok && examenes.response.length === 0) {
            throw new QueryError({ message: 'No hay exámenes', status: 404 })
        }
        const examenesPendientes = await obtenerExamenesPendientes()
        return { ok: true, examenes: pacienteId ? {...examenes.response[0]} : examenes.response, pendientes: examenesPendientes.examenes }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerDatosPacienteTransitorio (pacienteId = undefined) {
    try {
        const q = `SELECT PA.PACIENTE_NOMBRES AS nombres, PA.PACIENTE_APELLIDOS AS apellidos, PA.PACIENTE_ID AS pacienteId, PT.PACIENTETRANSITORIO_ID AS transitorioId
        FROM PACIENTETRANSITORIO PT, PACIENTE PA
        WHERE PT.PACIENTE_ID = PA.PACIENTE_ID
        ${ pacienteId ? 'AND PT.PACIENTETRANSITORIO_ID = :pacienteId' : ''}`
        const datos = await poolQuery(q, { pacienteId })
        if (datos.ok && datos.response.length === 0) {
            throw new QueryError({ message: 'No se encontró el paciente', status: 404 })
        }
        return { ok: true, datos: datos.response[0], pacientes: datos.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

/**
 * ===========================
 * Solo doctor
 * ===========================
 */

async function obtenerConsultas (doctorId) {
    try {
        const consultas = await poolQuery(`SELECT 
        C.CONSULTA_ID AS consultaId, 
        C.CONSULTA_FECHA AS fecha, 
        C.CONSULTA_OBSERVACIONES AS observaciones,
        C.CONSULTA_COMENTARIO AS comentario,
        C.CONSULTORIO_ID AS consultorioId,
        P.PACIENTE_ID AS pacienteId,
        P.PACIENTE_NOMBRES AS nombres,
        P.PACIENTE_APELLIDOS AS apellidos
        FROM PACIENTE P, CONSULTA C, PACIENTETRANSITORIO T
        WHERE C.DOCTOR_ID = :doctorId AND
        C.PACIENTETRANSITORIO_ID = T.PACIENTETRANSITORIO_ID AND 
        P.PACIENTE_ID = T.PACIENTE_ID
        ORDER BY C.CONSULTA_FECHA`, { doctorId })
        if (consultas.ok && consultas.response.length === 0) {
            throw new QueryError({ message: 'No hay consultas', status: 404 })
        }
        return { ok: true, consultas: consultas.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerConsulta (usuarioId, consultaId) {
    try {
        const queryConsulta = `SELECT CONSULTA_ID AS id, 
        CONSULTA_FECHA AS fecha, 
        CONSULTA_OBSERVACIONES AS observaciones, 
        PACIENTETRANSITORIO_ID AS pacienteTransitorioId,
        CONSULTORIO_ID AS consultorioId 
        FROM CONSULTA WHERE CONSULTA_ID = :consultaId AND DOCTOR_ID = :usuarioId`
        const resConsulta = await poolQuery(queryConsulta, { consultaId, usuarioId })
        if (resConsulta.ok && resConsulta.response.length === 0) {
            throw new QueryError({ message: 'No existe esa consulta', status: 404 })
        }
        const queryPaciente = `SELECT PACIENTE_ID AS pacienteId FROM PACIENTETRANSITORIO WHERE PACIENTETRANSITORIO_ID = :pacienteTransitorioId`
        const paciente = await poolQuery(queryPaciente, { pacienteTransitorioId: resConsulta.response[0].pacienteTransitorioId })
        const historial = await obtenerHistorialPaciente(usuarioId, paciente.response[0].pacienteId)
        const consulta = _.pick(resConsulta.response[0], ['id', 'fecha', 'observaciones', 'consultorioId'])
        return { ok: true, consulta, ...historial }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function comentarConsulta (usuarioId, {consultaId, comentario}) {
    try {
        const queryConsulta = `SELECT CONSULTA_ID AS id FROM CONSULTA WHERE DOCTOR_ID = :usuarioId`
        const verificarUsuario = await poolQuery(queryConsulta, { usuarioId })
        if (verificarUsuario.ok && verificarUsuario.response.length !== 1) {
            throw new QueryError({ message: 'No puedes comentar esta consulta', status: 403 })
        }
        const q = `UPDATE CONSULTA
        SET CONSULTA_COMENTARIO = :comentario
        WHERE CONSULTA_ID = :consultaId`
        const comentar = await poolQuery(q, { consultaId, comentario })
        if (comentar.response.affectedRows != 1) {
            throw new QueryError({ message: 'No se pudo comentar la consulta', status: 400 })
        }
        return { ok: true, message: 'Comentario agregado' }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function descargarResultadosMedicos (resultadoId) {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    try {
        console.log('resultadoId:', resultadoId)
        const q = `SELECT 
        X.EXAMEN_ID AS examenId,
        X.EXAMEN_DIAGNOSTICO AS examenDiagnostico,
        X.EXAMEN_FECHA AS examenFecha,
        X.EXAMEN_MUESTRA AS examenMuestra,
        P.PACIENTE_NOMBRES AS pacienteNombres,
        P.PACIENTE_APELLIDOS AS pacienteApellidos,
        P.PACIENTE_FECHANACIMIENTO AS pacienteFechaNacimiento,
        D.DOCTOR_NOMBRES AS doctorNombres,
        D.DOCTOR_APELLIDOS AS doctorApellidos,
        R.RESULTADO_FECHA AS resultadoFecha,
        R.RESULTADO_TEXTO AS resultadoObservaciones
        FROM EXAMEN X, PACIENTE P, DOCTOR D, RESULTADO R
        WHERE X.PACIENTE_ID = P.PACIENTE_ID
        AND R.EXAMEN_ID = X.EXAMEN_ID
        AND R.RESULTADO_ID = :resultadoId
        `
        const resultado = await poolQuery(q, { resultadoId })
        if (resultado.ok && resultado.response.length === 0) {
            throw new QueryError({ message: 'No hay resultado', status: 404 })
        }
        const datos = {}
        const resFecha = new Date(resultado.response[0].resultadoFecha)
        const resAnio = resFecha.getFullYear()
        const resMes = meses[resFecha.getMonth()]
        const resDia = resFecha.getDate()
        datos['resultadoFecha'] = resDia + ' de ' + resMes + ' de ' + resAnio

        const exFecha = new Date(resultado.response[0].examenFecha)
        const exAnio = exFecha.getFullYear()
        const exMes = meses[exFecha.getMonth()]
        const exDia = exFecha.getDate()
        datos['examenFecha'] = exDia + ' de ' + exMes + ' de ' + exAnio

        const cumple = new Date(resultado.response[0].pacienteFechaNacimiento);
        const hoy = new Date();
        const diff = hoy - cumple; // This is the difference in milliseconds
        datos['pacienteEdad'] = Math.floor(diff/31557600000).toString().concat(' años');
        datos['examenId'] = resultado.response[0].examenId
        datos['examenDiagnostico'] = resultado.response[0].examenDiagnostico || '-'
        datos['examenMuestra'] = resultado.response[0].examenMuestra || '-'
        datos['pacienteNombreCompleto'] = resultado.response[0].pacienteNombres + ' ' + resultado.response[0].pacienteApellidos
        datos['doctorNombreCompleto'] = resultado.response[0].doctorNombres + ' ' + resultado.response[0].doctorApellidos
        datos['resultadoObservaciones'] = resultado.response[0].resultadoObservaciones || '-'

        const pdf = crearPDF(datos)
        return bufferToStream(await pdf.asBuffer())
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function crearExamenesMedicos ({doctorId, diagnostico, muestra, pacienteId}) {
    try {
        const fecha = new Date()
        const examenes = await poolQuery('SELECT EXAMEN_ID AS id FROM EXAMEN')
        const examenId = crearId('exa', examenes.response)
        const insertExamen = `INSERT INTO EXAMEN (
            EXAMEN_ID, EXAMEN_DIAGNOSTICO, ${muestra ? 'EXAMEN_MUESTRA, ' : ''}EXAMEN_FECHA, PACIENTE_ID, DOCTOR_ID
        ) VALUES (
            :examenId, :diagnostico, ${muestra ? ':muestra, ' : ''}:fecha, :pacienteId, :doctorId
        );`

        const response = await poolQuery(insertExamen, { examenId, doctorId, diagnostico, muestra, fecha, pacienteId })

        return { ok: true, message: 'Examen registrado ' + examenId }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

/**
 * ===========================
 * Laboratorista
 * ===========================
 */

async function crearResultadosMedicos ({laboratoristaId, examenId, diagnostico, observacion}) {
    try {
        const queryExamen = `SELECT 
        X.EXAMEN_ID AS examenId, 
        X.PACIENTE_ID AS pacienteId,
        P.PACIENTE_NOMBRES AS pacienteNombres,
        P.PACIENTE_APELLIDOS AS pacienteApellidos
        FROM EXAMEN X, PACIENTE P
        WHERE X.EXAMEN_ID = :examenId AND P.PACIENTE_ID = X.PACIENTE_ID`
        const datosExamen = await poolQuery(queryExamen, { examenId })
        if (datosExamen.ok && datosExamen.response.length === 0) {
            throw new QueryError({ message: 'No existe ese examen', status: 404 })
        }

        const resultados = await poolQuery('SELECT RESULTADO_ID AS id FROM RESULTADO')
        const resultadoId = crearId('res', resultados.response)
        const { pacienteId, pacienteNombres, pacienteApellidos } = datosExamen.response[0]
        const fecha = new Date()
        const insertResultado = `INSERT INTO RESULTADO (
            RESULTADO_ID, RESULTADO_DIAGNOSTICO, RESULTADO_FECHA, RESULTADO_TEXTO, EXAMEN_ID, PACIENTE_ID, LABORATORISTA_ID
        ) VALUES (:resultadoId, :diagnostico, :fecha, :observacion, :examenId, :pacienteId, :laboratoristaId)`

        await poolQuery(insertResultado, { resultadoId, diagnostico, fecha, observacion, examenId, pacienteId, laboratoristaId })

        return { ok: true, message: `Registrado resultado a examen ${ examenId } de ${ pacienteNombres } ${ pacienteApellidos }`}
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerExamenesPendientes () {
    try {
        const q = `SELECT X.EXAMEN_ID AS examenId, X.EXAMEN_MUESTRA AS examenMuestra, X.EXAMEN_DIAGNOSTICO AS examenDiagnostico, X.EXAMEN_FECHA AS examenFecha,
        P.PACIENTE_ID AS pacienteId, P.PACIENTE_NOMBRES AS pacienteNombres, P.PACIENTE_APELLIDOS AS pacienteApellidos   
        FROM EXAMEN X, PACIENTE P 
        WHERE P.PACIENTE_ID = X.PACIENTE_ID AND NOT X.EXAMEN_ID = ANY (SELECT R.EXAMEN_ID FROM RESULTADO R, EXAMEN X WHERE R.EXAMEN_ID = X.EXAMEN_ID);`
        const queryPendientes = await poolQuery(q)
        if (queryPendientes.ok && queryPendientes.response.length === 0) {
            throw new QueryError({ message: 'No hay exámenes pendientes', status: 404 })
        }
        return { ok: true, examenes: queryPendientes.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerResultadosLaboratorista (usuarioId) {
    try {
        const q = `SELECT 
        P.PACIENTE_NOMBRES AS pacienteNombres, P.PACIENTE_APELLIDOS AS pacienteApellidos, P.PACIENTE_SEXO AS pacienteSexo, P.PACIENTE_GRUPOSANGUINEO AS pacienteGrupoSanguineo,
        R.RESULTADO_FECHA AS fecha, R.RESULTADO_DIAGNOSTICO AS diagnostico, R.RESULTADO_TEXTO AS observaciones
        FROM RESULTADO R, PACIENTE P, LABORATORISTA L
        WHERE P.PACIENTE_ID = R.PACIENTE_ID 
        AND R.LABORATORISTA_ID = :usuarioId`
        const resultados = await poolQuery(q, { usuarioId })
        if (resultados.ok && (resultados.response.length === 0 || !resultados.response)) {
            throw new QueryError({ message: 'No existen resultados', status: 404 })
        }
        return { ok: true, resultados: resultados.response}
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerResultado (usuarioId, resultadoId) {
    try {
        const queryResultado = `SELECT RESULTADO_ID AS id, RESULTADO_DIAGNOSTICO AS diagnostico,
        RESULTADO_TEXTO AS observaciones, RESULTADO_FECHA AS fecha, EXAMEN_ID AS examenId, PACIENTE_ID AS pacienteId
        FROM RESULTADO WHERE RESULTADO_ID = :resultadoId AND LABORATORISTA_ID = :usuarioId`
        const resultadoDatos = await poolQuery(queryResultado, { resultadoId, usuarioId })
        if (resultadoDatos.ok && resultadoDatos.response.length === 0) {
            throw new QueryError({ message: '', status: 404 })
        }

        const pacienteId = resultadoDatos.response[0].pacienteId
        const queryPaciente = `SELECT PACIENTE_NOMBRES AS nombres, PACIENTE_APELLIDOS AS apellidos, PACIENTE_SEXO AS sexo,
        PACIENTE_GRUPOSANGUINEO AS grupoSanguineo, PACIENTE_FECHANACIMIENTO AS fechaNacimiento,
        PACIENTE_TELEFONO AS telefono, PACIENTE_DIRECCION AS domicilio, PACIENTE_CURP AS curp, PACIENTE_EMAIL AS email,
        PACIENTE_ALERGIAS AS alergias, PACIENTE_ENFERMEDADESPREEXISTENTES AS antecedentes
        FROM PACIENTE WHERE PACIENTE_ID = :pacienteId`
        const pacienteDatos = await poolQuery(queryPaciente, { pacienteId })

        const examenId = resultadoDatos.response[0].examenId
        const queryExamen = `SELECT X.EXAMEN_FECHA AS fecha, X.EXAMEN_MUESTRA AS muestra, X.EXAMEN_DIAGNOSTICO AS diagnostico,
        D.DOCTOR_NOMBRES AS nombres, D.DOCTOR_APELLIDOS AS apellidos
        FROM DOCTOR D, EXAMEN X WHERE X.EXAMEN_ID = :examenId AND X.DOCTOR_ID = D.DOCTOR_ID`
        const examenDatos = await poolQuery(queryExamen, { examenId })

        const comentarios = await poolQuery('SELECT COMENTARIO_ID AS comentarioId, COMENTARIO_TEXTO AS comentarioTexto, COMENTARIO_FECHA AS fecha, DOCTOR_ID AS doctorId, LABORATORISTA_ID AS laboratoristaId FROM COMENTARIO WHERE RESULTADO_ID = :resultadoId', { resultadoId })

        return { ok: true, resultado: resultadoDatos.response[0], examen: examenDatos.response[0], paciente: pacienteDatos.response[0], comentarios: comentarios.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

/**
 * ===========================
 * General
 * ===========================
 */

async function crearComentario (usuarioId, {resultadoId, comentario}) {
    try {
        const pre = usuarioId.substr(0, 3)
        const tipo = pre === 'doc' ? 'DOCTOR' : 'LABORATORISTA'
        const fecha = new Date()
        const comentarios = await poolQuery('SELECT COMENTARIO_ID AS id FROM COMENTARIO')
        const comentarioId = crearId('com', comentarios.response || [])
        const q = `INSERT INTO COMENTARIO (
            COMENTARIO_ID, COMENTARIO_TEXTO, COMENTARIO_FECHA, RESULTADO_ID, ${ tipo }_ID
        ) VALUES (
            :comentarioId, :comentario, :fecha, :resultadoId, :usuarioId
        )`
        const insertarComentario = await poolQuery(q, { usuarioId, fecha, comentarioId, comentario, resultadoId })
        if (insertarComentario.response.affectedRows === 0) {
            throw new QueryError({ message: 'No se pudo hacer el comentario', status: 400 })
        }

        const { comentarios: coms } = await obtenerComentarioDeResultado(resultadoId)

        return { ok: true, message: 'Se hizo el comentario a ' + resultadoId, comentarios: coms }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerComentarioDeResultado (resultadoId) {
    try {
        const q = `SELECT C.COMENTARIO_ID AS comentarioId, C.COMENTARIO_TEXTO AS comentarioTexto, C.COMENTARIO_FECHA AS fecha,
        C.DOCTOR_ID AS usuarioId, CONCAT(D.DOCTOR_NOMBRES, " ", D.DOCTOR_APELLIDOS) AS usuarioNombre
        FROM COMENTARIO C, DOCTOR D
        WHERE C.RESULTADO_ID = :resultadoId AND C.DOCTOR_ID = D.DOCTOR_ID
        UNION 
        SELECT C.COMENTARIO_ID AS comentarioId, C.COMENTARIO_TEXTO AS comentarioTexto, C.COMENTARIO_FECHA AS fecha,
        C.LABORATORISTA_ID AS usuarioId, CONCAT(L.LABORATORISTA_NOMBRES, " ", L.LABORATORISTA_APELLIDOS) AS usuarioNombre
        FROM COMENTARIO C, LABORATORISTA L
        WHERE C.RESULTADO_ID = :resultadoId AND C.LABORATORISTA_ID = L.LABORATORISTA_ID`
        const comentarios = await poolQuery(q, { resultadoId })
        if (comentarios.ok && comentarios.response.length === 0) {
            throw new QueryError({ message: 'No hay comentarios', status: 404 })
        }
        return { ok: true, comentarios: comentarios.response }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerExamenMedico (examenId) {
    try {
        const queryExamen = await poolQuery('SELECT EXAMEN_ID AS id, EXAMEN_DIAGNOSTICO AS diagnostico, EXAMEN_FECHA AS fecha, EXAMEN_MUESTRA AS muestra, PACIENTE_ID AS pacienteId, DOCTOR_ID AS doctorId FROM EXAMEN WHERE EXAMEN_ID = :examenId', { examenId })
        if (queryExamen.ok && queryExamen.response.length === 0) {
            throw new QueryError({ message: 'No existe ese examen', status: 404 })
        }
        const pacienteId = queryExamen.response[0].pacienteId
        const queryPaciente = await poolQuery('SELECT PACIENTE_ID AS id, PACIENTE_NOMBRES AS nombres, PACIENTE_APELLIDOS AS apellidos, PACIENTE_FECHANACIMIENTO AS fechaNacimiento, PACIENTE_SEXO AS sexo, PACIENTE_LUGARNACIMIENTO AS lugarNacimiento, PACIENTE_CURP AS curp, PACIENTE_GRUPOSANGUINEO AS grupoSanguineo, PACIENTE_ENFERMEDADESPREEXISTENTES AS antecedentes, PACIENTE_ALERGIAS AS alergias, PACIENTE_EMAIL AS email, PACIENTE_TELEFONO AS telefono, PACIENTE_DIRECCION AS domicilio FROM PACIENTE WHERE PACIENTE_ID = :pacienteId', { pacienteId })

        const doctorId = queryExamen.response[0].doctorId
        const queryDoctor = await poolQuery('SELECT DOCTOR_ID AS id, DOCTOR_NOMBRES AS nombres, DOCTOR_APELLIDOS AS apellidos FROM DOCTOR WHERE DOCTOR_ID = :doctorId', { doctorId })

        const paciente = {...queryPaciente.response[0]}
        const doctor = {...queryDoctor.response[0]}
        const examen = {...queryExamen.response[0]}

        const queryResultado = await poolQuery('SELECT RESULTADO_ID AS id, RESULTADO_DIAGNOSTICO AS diagnostico, RESULTADO_TEXTO AS texto, RESULTADO_FECHA AS fecha, EXAMEN_ID AS examenId FROM RESULTADO WHERE EXAMEN_ID = :examenId', { examenId })
        if (queryResultado.ok && queryResultado.response.length > 0) {
            const resultadoId = queryResultado.response[0].id
            const queryComentarios = await poolQuery('SELECT COMENTARIO_ID AS comentarioId, COMENTARIO_TEXTO AS comentarioTexto, COMENTARIO_FECHA AS fecha, DOCTOR_ID AS doctorId, LABORATORISTA_ID AS laboratoristaId FROM COMENTARIO WHERE RESULTADO_ID = :resultadoId', { resultadoId })

            const resultado = {...queryResultado.response[0]}
            const comentarios = queryComentarios.response.map(function (comentario) { 
                comentario = {...comentario}
                if (!comentario.laboratoristaId) delete comentario.laboratoristaId
                if (!comentario.doctorId) delete comentario.doctorId

                return comentario
            })

            return { ok: true, paciente, doctor, examen, comentarios, resultado }
        }
        return { ok: true, paciente, doctor, examen, comentarios: undefined, resultado: undefined }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function obtenerResultadosMedicos (usuarioId) {
    try {
        const queryResultados = `SELECT 
        P.PACIENTE_NOMBRES AS pacienteNombres, P.PACIENTE_APELLIDOS AS pacienteApellidos, P.PACIENTE_SEXO AS pacienteSexo, P.PACIENTE_GRUPOSANGUINEO AS pacienteGrupoSanguineo,
        R.RESULTADO_ID AS resultadoId, R.RESULTADO_FECHA AS fecha, R.RESULTADO_DIAGNOSTICO AS diagnostico, R.RESULTADO_TEXTO AS observaciones,
        L.LABORATORISTA_NOMBRES AS laboratoristaNombres, L.LABORATORISTA_APELLIDOS AS laboratoristaApellidos
        FROM RESULTADO R, PACIENTE P, LABORATORISTA L
        WHERE P.PACIENTE_ID = R.PACIENTE_ID AND R.LABORATORISTA_ID = L.LABORATORISTA_ID AND L.LABORATORISTA_ID = :usuarioId`

        const resultados = await poolQuery(queryResultados, { usuarioId })
        if (resultados.ok && resultados.response.length === 0) {
            throw new QueryError({ message: 'No hay resultados', status: 404 })
        }

        const resultadosHandler = resultados.response.map(function (resultado) {
            const res = _.pick(resultado, ['resultadoId', 'fecha', 'diagnostico', 'observaciones'])
            const paciente = {
                nombres: resultado['pacienteNombres'],
                apellidos: resultado['pacienteApellidos'],
                sexo: resultado['pacienteSexo'],
                grupoSanguineo: resultado['pacienteGrupoSanguineo']
            }
            const laboratorista = {
                nombres: resultado['laboratoristaNombres'],
                apellidos: resultado['laboratoristaApellidos']
            }
            return { ...res, paciente, laboratorista }
        })
        return { ok: true, resultados: resultadosHandler }
    } catch (error) {
        console.error(error)
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function transferirPaciente ({pacienteId, razon, area}) {
    try {
        const queryInternado = `SELECT PACIENTE_ID AS id, PACIENTEINTERNADO_ID AS anteriorId, PACIENTEINTERNADO_OBSERVACION AS observacion
        FROM PACIENTEINTERNADO WHERE PACIENTE_ID = :pacienteId AND PACIENTEINTERNADO_FECHAALTA IS NULL`
        const pacienteInternado = await poolQuery(queryInternado, { pacienteId })

        const habitacionesDisponibles = await obtenerHabitacionesDisponibles(area)
        if (habitacionesDisponibles.ok && habitacionesDisponibles.habitaciones.length === 0) {
            throw new QueryError({ message: 'No hay habitaciones disponibles', status: 400 })
        }

        const fecha = new Date()
        const habitacionesId = habitacionesDisponibles.habitaciones.map(function (hab) { return hab.id })
        const randomId = habitacionesId[Math.floor((Math.random() * habitacionesId.length) + 1) - 1]

        const updateIngreso = `UPDATE PACIENTEINTERNADO
        SET PACIENTEINTERNADO_FECHAALTA = :fecha
        WHERE PACIENTE_ID = :pacienteId AND PACIENTEINTERNADO_FECHAALTA IS NULL`
        await poolQuery(updateIngreso, { fecha, pacienteId })

        const internados = await poolQuery('SELECT PACIENTEINTERNADO_ID AS id FROM PACIENTEINTERNADO')
        const internadoId = crearId('pin', internados.response)
        const nuevoIngreso = `INSERT INTO PACIENTEINTERNADO (
            PACIENTEINTERNADO_ID, PACIENTEINTERNADO_FECHAINGRESO, PACIENTEINTERNADO_OBSERVACION, PACIENTE_ID, HABITACION_ID
        ) VALUES (
            :internadoId, :fecha, :observacion, :pacienteId, :randomId
        )`
        const observacionAnterior = pacienteInternado.response[0] ? String(pacienteInternado.response[0].observacion).replace('Se transfirió a', 'Estuvo en').replace('Observación anterior: ', '') : ''
        const observacion = `${razon.charAt(0).toLowerCase().concat(razon.substr(1))}. Se transfirió a ${ randomId }${pacienteInternado.response[0] ? '. Observación anterior: '.concat(observacionAnterior) : '' }`
        await poolQuery(nuevoIngreso, {
            internadoId,
            pacienteId,
            observacion,
            randomId,
            fecha
        })

        return { ok: true, message: 'Se transfirió a ' + randomId }
    } catch (error) {
        throw new QueryError({ message: error.message, status: error.status || 500 })
    }
}

async function entrar ({ usuarioId, contrasena }) {
    try {
        const response = await login({ usuarioId, contrasena })
        return { ok: true, datos: response.datos, token: response.token }
    } catch (error) {
        throw new QueryError({ message: error.message, status: 400 })
    }
}

module.exports = {
    entrar,
    internarPaciente,
    darAltaPaciente,
    crearPaciente,
    crearConsultorio,
    crearHabitacion,
    crearUsuario,
    crearTurnoUsuario,
    obtenerTodosPacientes,
    obtenerConsultorios,
    asignarPersonalConsultorio,
    obtenerHistorialPaciente,
    asignarConsultaPacienteTransitorio,
    obtenerDatosPacienteTransitorio,
    obtenerConsulta,
    comentarConsulta,
    obtenerHabitacionesAsignadas,
    obtenerHabitacionesDisponibles,
    obtenerAreas,
    obtenerUsuarios,
    obtenerDatosUsuario,
    buscarDatosUsuario,
    obtenerPacientesAsignados,
    obtenerConsultorioAsignado,
    obtenerConsultas,
    modificarDatosPaciente,
    actualizarContrasena,
    obtenerExamenesMedicos,
    obtenerExamenMedico,
    crearExamenesMedicos,
    crearResultadosMedicos,
    crearComentario,
    obtenerResultadosMedicos,
    obtenerResultadosLaboratorista,
    obtenerResultado,
    obtenerExamenesPendientes,
    obtenerComentarioDeResultado,
    descargarResultadosMedicos,
    transferirPaciente
}
