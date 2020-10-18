const examenesSesion = JSON.parse(sessionStorage.getItem('iDoctor/examenes'))
// const tipoUsuario = JSON.parse(localStorage.getItem('iDoctor/usuario'))['tipo']

if (examenesSesion) {
    $('#lista-examenes').toggleClass('d-none')
    $('#lista-examenes').html(arrayListItemExamenes(examenesSesion))
} else {
    $.ajax({
        method: 'GET',
        url: '/api/examenes',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        beforeSend: function (xhr) {
            $('.col-content').append(cargando)
        }
    }).done(function (respuesta) {
        $('#icon-cargando').remove()
        $('#lista-examenes').toggleClass('d-none')
        const pendientes = respuesta.pendientes
        sessionStorage.setItem('iDoctor/examenes', JSON.stringify(respuesta.examenes))
        
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
            examenes.sort((a, b) => (a.examenFecha < b.examenFecha) ? 1 : -1)
            sessionStorage.setItem('iDoctor/examenes', JSON.stringify(examenes))
            $('#lista-examenes').html(arrayListItemExamenes(examenes))
        } else {
            $('#lista-examenes').html(arrayListItemExamenes(respuesta.examenes))
        }
    }).fail(function (err) {
        $('#icon-cargando').remove()
        if (err.status !== 404) {
            $('.col-content').html(`<h4>Error</h4><p>${ err.responseJSON.message }</p>`)
        }
    })
}

function arrayListItemExamenes (examenes) {
    return examenes.map(function (examen) {
        let fecha = new Date(examen.examenFecha)
        const anio = fecha.getFullYear().toString()
        const mes = fecha.getMonth() < 9 ? '0' + (fecha.getMonth() + 1).toString() : (fecha.getMonth() + 1).toString()
        const dia = fecha.getDate().toString()
        fecha = dia + '/' + mes + '/' + anio
        const url = `/examen?examen=${ examen.examenId }`
        return `<li class="list-group-item justify-content-center align-items-center">
            <a href="${ url }" class="d-flex justify-content-between align-items-center">
                <p class="examen-datos">
                    ${ fecha.toString() } | FOLIO: ${ examen.examenId } | ${ examen.examenDiagnostico } (${ examen.pacienteNombres } ${ examen.pacienteApellidos })
                </p>
                <span class="badge badge-${examen.pendiente ? 'warning' : 'success'}">${examen.pendiente ? 'Pendiente' : 'Entregado'}</span>
            </a>
        </li>`
    })
}
