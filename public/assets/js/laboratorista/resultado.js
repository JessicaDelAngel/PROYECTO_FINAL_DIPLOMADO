const resultadoId = getUrlParams()['resultado']

if (!resultadoId) {
    window.location = '/resultados'
}

$.ajax({
    method: 'GET', 
    url: '/api/resultado/'.concat(resultadoId),
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer '.concat(token)
    },
    beforeSend: function (xhr) {
        $('.row-content > .col-content').append(cargando)
    }
}).done(function (respuesta) {
    $('div#icon-cargando').remove()
    $('ol.breadcrumb > li.breadcrumb-item:nth-child(3) > a > h4').text(resultadoId)
    const examen = respuesta.examen
    const resultado = respuesta.resultado
    const paciente = respuesta.paciente
    const comentarios = respuesta.comentarios
    renderDatosPaciente(paciente)
    renderDatosResultado(resultado)
    renderDatosExamen(examen)
    renderComentarios(comentarios)
}).fail(function (err) {
    $('div#icon-cargando').remove()

})

$('#form-nuevo-comentario').on('submit', function (e) {
    e.preventDefault()
    const comentario = $('#form-nuevo-comentario').serialize()
    // const elementosAnteriores = [$('#descargar'), $('#examen')]
    $.ajax({
        method: 'POST',
        url: '/api/comentario/'.concat(resultadoId),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        beforeSend: function (xhr) {
            $('#lista-comentarios').html(cargando)
        },
        data: comentario
    }).done(function (respuesta) {
        $('#icon-cargando').remove()
        $('#form-nuevo-comentario input').val('')
        const comentarios = respuesta.comentarios
        console.log('comentarios:', comentarios)
        if (comentarios.length > 0) {
            // comentarios.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
            $('#lista-comentarios').append(renderComentarios(comentarios))
        }

        // $('#lista-comentarios').append(elementosAnteriores)

    }).fail(function (err) {
        $('#icon-cargando').remove()
        $('#lista-comentarios').html(`<h4>Error</h4><p>${err.responseJSON ? err.responseJSON.message : err.message}</p>`)
    })
})

function renderDatosPaciente (datos) {
    const cumple = new Date(datos.fechaNacimiento);
    const hoy = new Date();
    const diff = hoy - cumple; // This is the difference in milliseconds
    const edad = Math.floor(diff/31557600000);
    const fechaCumple = formatoFecha(datos.fechaNacimiento)
    const alergias = datos.alergias ? datos.alergias : 'Ninguna'
    const antecedentes = datos.antecedentes ? datos.antecedentes : 'No hay antecedentes'
    $('p#nombre-paciente').text(datos.nombres + ' ' + datos.apellidos)
    $('#edad-paciente').text(edad.toString() + ' años (' + fechaCumple + ')')
    $('#telefono-paciente').text(datos.telefono)
    $('#domicilio-paciente').text(datos.domicilio)
    $('#tiposangre-paciente').text(datos.grupoSanguineo)
    $('#alergias-paciente').text(alergias)
    $('#curp-paciente').text(datos.curp)
    $('#email-paciente').text(datos.email ? datos.email : '')
    $('#antecedentes-paciente').text(antecedentes)
}

function renderDatosExamen (datos) {
    const fecha = formatoFecha(datos.fecha)
    $('#nombre-doctor').text(datos.nombres + ' ' + datos.apellidos)
    $('#examen-fecha').text(fecha)
    $('#examen-diagnostico').text(datos.diagnostico)
    $('#examen-muestra').text(datos.muestra ? datos.muestra : '-')
}

function renderDatosResultado (datos) {
    const fecha = formatoFecha(datos.fecha)
    $('#resultado-fecha').text(fecha)
    $('#resultado-diagnostico').text(datos.diagnostico)
    $('#resultado-observaciones').text(datos.observaciones)
}

function renderComentarios (arr) {
    arr.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
    $('#lista-comentarios').append(arr.map(function (elemento) {
        const fecha = formatoFecha(elemento.fecha)
        return `<li class="list-group-item d-flex justify-content-between align-items-center">
            <p class="examen-datos">${fecha} | ${elemento.doctorId || elemento.laboratoristaId || elemento.usuarioId}: ${elemento.comentarioTexto}</p>
        </li>`
    }))
}
