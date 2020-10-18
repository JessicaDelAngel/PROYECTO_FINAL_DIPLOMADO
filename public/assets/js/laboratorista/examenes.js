// const tipoUsuario = JSON.parse(localStorage.getItem('iDoctor/usuario'))['tipo']

if (tipoUsuario === 'DOCTOR') {
    $('ol.breadcrumb > li:nth-child(2) > a > h4').text('Exámenes')
} else if (tipoUsuario === 'LABORATORISTA') {
    $('ol.breadcrumb > li:nth-child(2) > a > h4').text('Exámenes pendientes')
}

    $.ajax({ 
        type: 'GET',
        url: '/api/examenes', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        beforeSend: function (xhr) {
            $('#examenes-medicos').append(cargando)
        }
    }).done(function (respuesta) {
        if (!respuesta.ok) {
            $('#examenes-medicos').text(respuesta.message)
        }
        const pendientes = respuesta.pendientes
        $('#examenes-medicos').html('<ul class="list-group" id="lista-examenes"></ul>')
        
        if (pendientes) {
            const examenes = respuesta.examenes
            const pendientesId = pendientes.map(function (pendiente) { return pendiente.examenId })
            examenes.forEach(function (examen, idx) {
                if (pendientesId.includes(examen.examenId)) {
                    examenes[idx]['pendiente'] = true
                } else {
                    examenes[idx]['pendiente'] = false
                }
            })
            sessionStorage.setItem('iDoctor/examenes', JSON.stringify(examenes))
            $('#lista-examenes').html(arrayListItemExamenes(examenes))
        } else {
            respuesta.examenes.forEach(function (examen, idx) { respuesta.examenes[idx]['pendiente'] = true })
            sessionStorage.setItem('iDoctor/examenes', JSON.stringify(respuesta.examenes))
            $('#lista-examenes').html(arrayListItemExamenes(respuesta.examenes))
        }
    }).fail(function (error) {
        console.log(error)
        if (error.responseJSON) {
            $('#examenes-medicos').html(`<h4>${error.responseJSON.message}</h4>`)
        } else {
            $('#examenes-medicos').html('<h4>No hay respuesta del servidor</h4>')
        }
    })

function arrayListItemExamenes (examenes) {
    return examenes.map(function (examen) {
        let fecha = new Date(examen.examenFecha)
        const anio = fecha.getFullYear().toString()
        const mes = fecha.getMonth() < 9 ? '0' + (fecha.getMonth() + 1).toString() : (fecha.getMonth() + 1).toString()
        const dia = fecha.getDate().toString()
        fecha = anio + '-' + mes + '-' + dia
        const url = `/nuevo/resultado.html?examen=${ examen.examenId }`
        return `<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-dark" style="text-decoration: none;" href="${ url }">
            <p class="examen-datos">${ fecha.toString() } | FOLIO: ${ examen.examenId } | ${ examen.examenDiagnostico } (${ examen.pacienteNombres } ${ examen.pacienteApellidos })</p>
            <span class="badge badge-${examen.pendiente ? 'warning' : 'success'}">${examen.pendiente ? 'Pendiente' : 'Entregado'}</span>
        </a>`
    })
}