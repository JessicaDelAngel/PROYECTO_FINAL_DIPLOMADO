const pacienteId = getUrlParams()['paciente']

if (!pacienteId) {
    window.location = '/pacientes'
}

$.ajax({
    method: 'GET',
    url: '/api/historial/'.concat(pacienteId),
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    beforeSend: function (xhr) {
        $('.row-content').prepend(`<div class="col" id="col-cargando">${cargando}</div>`)
    }
}).done(function (respuesta) {
    $('ol.breadcrumb > li:nth-child(2) > a > h4').text(tipoUsuario === 'ADMINISTRADOR' ? 'Pacientes registrados' : 'Mis pacientes')
    $('#col-cargando').remove()
    $('#paciente-container').toggleClass('d-none')
    const datos = respuesta.datos
    const historial = [...respuesta.ingresos, ...respuesta.resultados]
    historial.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
    const examenes = [...respuesta.examenes]
    examenes.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
    const resultadosId = respuesta.resultados.map(function (resultado) { return resultado.examenId })
    $('h4#nombre-paciente').text(datos.pacienteNombres + ' ' + datos.pacienteApellidos)
    renderDatosPaciente(datos)
    $('#historial-paciente').html(arrayListItems(historial))
    $('#examenes-paciente').html(arrayListItems(examenes, resultadosId))

    const area = respuesta.datos.areaInternado
    $('#paciente-container').prepend(alertaPacienteInternado(area))
    if (tipoUsuario === 'ADMINISTRADOR' || tipoUsuario === 'DOCTOR') {
        $('#paciente-container > div:first-child').after(area ? botonesInternado : botonTransitorio)
    }
}).fail(function (err) {
    $('#col-cargando').remove()
    $('#paciente-container').toggleClass('d-none')
    $('h4#nombre-paciente').text('Error')
    $('#paciente-container').html(`<p class="p-2">Error en el servidor. ${ err.responseJSON.message }</p>`)
})

function renderDatosPaciente (datos) {
    const cumple = new Date(datos.pacienteFechaNacimiento);
    const hoy = new Date();
    const diff = hoy - cumple; // This is the difference in milliseconds
    const edad = Math.floor(diff/31557600000);
    const fechaCumple = formatoFecha(cumple.toString())
    const alergias = datos.pacienteAlergias ? datos.pacienteAlergias : 'Ninguna'
    const antecedentes = datos.pacienteEnfermedades ? paciente : 'No hay antecedentes'
    $('p#nombre-paciente').text(datos.pacienteNombres + ' ' + datos.pacienteApellidos)
    $('#edad-paciente').text(edad.toString() + ' años (' + fechaCumple + ')')
    $('#telefono-paciente').text(datos.pacienteTelefono)
    $('#domicilio-paciente').text(datos.pacienteDireccion)
    $('#tiposangre-paciente').text(datos.pacienteGrupoSanguineo)
    $('#alergias-paciente').text(alergias)
    $('#curp-paciente').text(datos.pacienteCurp)
    $('#email-paciente').text(datos.pacienteEmail ? datos.pacienteEmail : '')
    $('#antecedentes-paciente').text(antecedentes)
}

function arrayListItems (items, resultados = undefined) {
    return items.map(function (item) {
        const fecha = formatoFecha(item.fecha)

        const id = item['internadoId'] || item['resultadoId'] || item['examenId']
        const observacion = item['observacion']
        const examenDiagnostico = item['examenDiagnostico'] 
        const resultadoDiagnostico = item['resultadoDiagnostico']
        
        const texto = examenDiagnostico && resultadoDiagnostico && !observacion ? `Se realizó ${ examenDiagnostico }, los resultados indican ${ resultadoDiagnostico }` : examenDiagnostico && !resultadoDiagnostico ? examenDiagnostico : observacion ? `Se ingresó al paciente por ${ observacion }` : '...'

        if (resultados && item['examenId']) {
            const pendiente = !resultados.includes(id)
            const url = tipoUsuario !== 'ADMINISTRADOR'  ? `href="/examen?examen=${ id }"` : ''
            const etiqueta = tipoUsuario !== 'ADMINISTRADOR' ? 'a' : 'li'
            return `<${etiqueta} ${url} class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <p class="datos">${ fecha } ${ !observacion && !resultadoDiagnostico ? '| FOLIO: ' + id : '' } | ${ texto }</p>
                <span class="badge badge-${pendiente ? 'warning' : 'success'}">${pendiente ? 'Pendiente' : 'Entregado'}</span>
            </${etiqueta}>`
        }
        return `<li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <p class="datos">${ fecha } ${ !observacion && !resultadoDiagnostico ? '| FOLIO: ' + id : '' } | ${ texto }</p>
        </li>`
    })
}

const botonesInternado = `<div class="row p-0 mb-2">
    <div class="col-12 col-md-6 p-0 m-0 pr-md-1">
        <button class="btn btn-block btn-submit m-0" id="btn-alta">Dar de alta</button>
    </div>
    <div class="col-12 col-md-6 p-0 m-0 pl-md-1">
        <a class="btn btn-block btn-submit m-0" style="text-decoration: none;" href="/transferir?paciente=${pacienteId}">Transferir</a>
    </div>
</div>`

const botonTransitorio = `<div class="row p-0 mb-2">
    <div class="col-12 p-0 m-0">
        <a class="btn btn-block btn-submit m-0" href="/internar?paciente=${pacienteId}">Internar</a>
    </div>
</div>`

function alertaPacienteInternado (area = undefined) {
    if (area) {
        return `<div class="alert alert-info mb-2" style="margin-left: -0.9rem; margin-right: -0.9rem;">
            Paciente internado en <strong>${area}</strong>
        </div>`
    }
    return ''
}

$('#btn-alta').click(function () {
    console.log('Presionado btn-alta')
    $.ajax({
        method: 'PUT',
        url: '/api/paciente/'.concat(pacienteId),
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).done(function (respuesta) {
        const mensaje = respuesta.message
        $('#mensaje').text(mensajeSubmit(true, mensaje))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
            location.reload()
        }, 4000)
    }).fail(function (err) {
        const mensaje = err.responseJSON ? err.responseJSON.message : err.message
        $('#mensaje').text(mensajeSubmit(true, mensaje))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})
