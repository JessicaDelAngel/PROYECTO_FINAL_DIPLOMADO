const examenId = getUrlParams()['examen']

if (!examenId) {
    window.location = '/examenes'
}

$.ajax({
    method: 'GET',
    url: '/api/examen/'.concat(examenId),
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer '.concat(token)
    }
}).done(function (respuesta) {
    $('#examen-id').text(examenId)
    const paciente = respuesta.paciente
    const examen = respuesta.examen
    const comentarios = respuesta.comentarios
    const resultado = respuesta.resultado

    if (comentarios && comentarios.length > 0) {
        comentarios.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
        const renderComentarios = comentarios.map(function (comentario) { return renderListItem(comentario) })
        $('#lista-comentarios').append(renderComentarios)
    }
    if (tipoUsuario !== 'ENFERMERO') {
        $('#form-nuevo-comentario input').removeAttr('disabled')
        $('#form-nuevo-comentario button').removeAttr('disabled')

    } else {
        $('ol.breadcrumb > li.breadcrumb-item:nth-child(2) > a > h4').text('Mis pacientes')
        $('ol.breadcrumb > li.breadcrumb-item:nth-child(2) > a').attr('href', '/pacientes')
        $('ol.breadcrumb > li.breadcrumb-item:nth-child(2)').after(breadcrumbPaciente(paciente.nombres + ' ' + paciente.apellidos, paciente.id))
        $('#form-nuevo-comentario').remove()
    }
    if (resultado) {
        resultado['resultado'] = true
        $('#lista-comentarios').append(renderListItem(resultado))
        $('#descargar').attr('value', resultado.id)
    }
    examen['examen'] = true
    $('#lista-comentarios').append(renderListItem(examen))

    renderDatosPaciente(paciente)
}).fail(function (err) {
    $('.col-content > h4').text('Error')
    $('#form-nuevo-comentario').remove()
    $('#lista-comentarios').remove()
    $('#datos-paciente').remove()
    $('.row-content > .col-content').append(`<p class="p-2">${err.responseJSON ? err.responseJSON.message : err.message}</p>`)
})

$('#lista-comentarios').on('click', '#descargar', function (e) {
    e.preventDefault()
    const resultadoId = $(this).attr('value')
    $.ajax({
        method: 'GET',
        url:'/api/resultado/'.concat(resultadoId),
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'responseType': 'document'
        }
    }).done(function (data) {
        // Si quisiéramos saber las cabeceras de la respuesta
        // https://www.yukei.net/2016/01/getting-response-headers-data-from-an-ajax-request-with-jquery/
        // Pero como ya las sabemos, no hay necesidad de pedirlas
        const pdf = new Blob([data], { type: 'application/pdf;charset=utf-8' })
        const hoy = new Date()
        const fecha = formatoFecha(hoy.toString()).replace(/\//g, '-')
        const nombre = $('p#nombre-paciente').text()
        saveAs(pdf, `resultados_${ nombre }_${ fecha }.pdf`)
    }).fail(function (err) {
        console.error(err)
        $('#mensaje').append(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : JSON.parse(err.responseText).message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})

$('#form-nuevo-comentario').on('submit', function (e) {
    e.preventDefault()
    const comentario = $('#form-nuevo-comentario').serialize()
    const resultadoId = $('#descargar').attr('value')
    const elementosAnteriores = [$('#descargar'), $('#examen')]
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
        $('#mensaje').append(mensajeSubmit(true, respuesta.message))

        $.ajax({
            method: 'GET',
            url: '/api/examen/'.concat(examenId),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer '.concat(token)
            },
            beforeSend: function (xhr) {
                $('#lista-comentarios').html(cargando)
            }
        }).done(function (res) {
            $('#icon-cargando').remove()
            $('#form-nuevo-comentario input').val('')
            const comentarios = res.comentarios
            if (comentarios.length > 0) {
                comentarios.sort((a, b) => (a.fecha < b.fecha) ? 1 : -1)
                const renderComentarios = comentarios.map(function (comentario) { return renderListItem(comentario) })
                $('#lista-comentarios').prepend(renderComentarios)
            }
        }).fail(function (err) {
            $('#icon-cargando').remove()
        })

        $('#lista-comentarios').append(elementosAnteriores)

        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    }).fail(function (err) {
        $('#mensaje').append(mensajeSubmit(false, err.responseJSON.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})

function renderDatosPaciente (datos) {
    const cumple = new Date(datos.fechaNacimiento);
    const hoy = new Date();
    const diff = hoy - cumple; // This is the difference in milliseconds
    const edad = Math.floor(diff/31557600000);
    const fechaCumple = formatoFecha(datos.fechaNacimiento)
    const alergias = datos.alergias ? datos.alergias : 'Ninguna'
    const antecedentes = datos.enfermedades ? paciente : 'No hay antecedentes'
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

function renderListItem (elemento) {
    const fecha = formatoFecha(elemento.fecha)
    const texto = elemento.resultado ? 'RESULTADO: '.concat(elemento.diagnostico) : elemento.examen ? 'EXAMEN: '.concat(elemento.diagnostico) : 'COMENTARIO: '.concat(elemento.comentarioTexto)
    return `<li class="list-group-item d-flex justify-content-between align-items-center" ${elemento.resultado ? 'id="descargar"' : elemento.examen ? 'id="examen"' : ''}>
        <p class="examen-datos">${ fecha } | ${ texto }</p>
        <span class="badge badge-pdf text-uppercase${ elemento.resultado ? '' : ' d-none'}">Ver pdf</span>
    </li>`
}

function breadcrumbPaciente (nombre, id) {
    return `<li class="breadcrumb-item text-uppercase d-inline-flex align-items-center">
        <a href="/paciente?paciente=${id}" class="text-dark" style="text-decoration: none;">
            <h4 class="mb-0">${nombre}</h4>
            <span></span>
        </a>
    </>`
}
