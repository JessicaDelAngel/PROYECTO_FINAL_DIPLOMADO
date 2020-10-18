const consultaId = getUrlParams()['consulta']

if (!consultaId) {
    window.location = '/consultas'
} else {
    $.ajax({ 
        type: 'GET',
        url: '/api/consulta/'.concat(consultaId), 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        beforeSend: function (xhr) {
            $('.row-content').prepend(`<div class="col" id="col-cargando">${cargando}</div>`)
        }
    }).done(function (paciente) {
        $('#col-cargando').remove()
        $('#paciente-container').toggleClass('d-none')
        const datos = paciente.datos
        const consulta = paciente.consulta
        const historial = [...paciente.ingresos, ...paciente.resultados]
        historial.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
        const examenes = [...paciente.examenes]
        examenes.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
        const resultadosId = paciente.resultados.map(function (resultado) { return resultado.examenId })
        $('h4#nombre-paciente').text(datos.pacienteNombres + ' ' + datos.pacienteApellidos)
        renderDatosPaciente(datos)
        $('#historial-paciente').html(arrayListItems(historial))
        $('#examenes-paciente').html(arrayListItems(examenes, resultadosId))
        $('#consulta-observaciones').text('Razón de consulta: '.concat(consulta.observaciones))
    }).fail(function (err) {
        $('#col-cargando').remove()
        $('#paciente-container').toggleClass('d-none')
        $('h4#nombre-paciente').text('Error')
        $('#paciente-container').html(`<p class="p-2">Error en el servidor. ${ err.responseJSON.message }</p>`)
    })
}

function renderDatosPaciente (datos) {
    const cumple = new Date(datos.pacienteFechaNacimiento);
    const hoy = new Date();
    const diff = hoy - cumple; // This is the difference in milliseconds
    const edad = Math.floor(diff/31557600000);
    const fechaCumple = cumple.getDate() + '/' + cumple.getMonth() + '/' + cumple.getFullYear()
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

        const id = item['ingresoId'] || item['resultadoId'] || item['examenId']
        const observacion = item['ingresoObservacion']
        const examenDiagnostico = item['examenDiagnostico'] 
        const resultadoDiagnostico = item['resultadoDiagnostico']
        
        const texto = examenDiagnostico && resultadoDiagnostico && !observacion ? `Se realizó ${ examenDiagnostico }, los resultados indican ${ resultadoDiagnostico }` : examenDiagnostico && !resultadoDiagnostico ? examenDiagnostico : observacion ? `Se ingresó al paciente por ${ observacion }` : '...'

        if (resultados && item['examenId']) {
            const pendiente = !resultados.includes(id)
            return `<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="/examen?examen=${ id }">
                <p class="datos">${ fecha } ${ !observacion && !resultadoDiagnostico ? '| FOLIO: ' + id : '' } | ${ texto }</p>
                <span class="badge badge-${pendiente ? 'warning' : 'success'}">${pendiente ? 'Pendiente' : 'Entregado'}</span>
            </a>`
        }
        return `<li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <p class="datos">${ fecha } ${ !observacion && !resultadoDiagnostico ? '| FOLIO: ' + id : '' } | ${ texto }</p>
        </li>`
    })
}


$('#form-comentarios-consulta').on('submit', function (e) {
    e.preventDefault()
    const comentario = $('#form-comentarios-consulta').serialize()
    $.ajax({
        method: 'PUT',
        url: '/api/consulta/'.concat(consultaId),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        data: comentario
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        $('#form-comentarios-consulta input[name="comentario"]').val('')
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})
