// window.addEventListener('DOMContentLoaded', cargarExamenes)
$('#examenes-medicos').ready(function () {
    console.log('Enviando solicitud de exámenes')
    const examenesSesion = JSON.parse(sessionStorage.getItem('iDoctor/doctor/examenes'))
    if (examenesSesion) {
        $('#lista-examenes').html(arrayListItemExamenes(examenesSesion))
    } else {
        const token = localStorage.getItem('iDoctor/token')
    $.ajax({ 
        type: 'GET',
        url: '/api/examenes', 
        headers: {
            'Authorization': 'Bearer ' + token
        },
        beforeSend: function (xhr) {
            $('#lista-examenes').text('Cargando...')
        }
    }).done(function (respuesta) {
        if (!respuesta.ok) {
            $('#examenes').text(respuesta.message)
        }
        sessionStorage.setItem('iDoctor/examenes', JSON.stringify(respuesta.examenes))
        $('#lista-examenes').html(arrayListItemExamenes(respuesta.examenes))
    }).fail(function (error) {
        console.log(error)
        if (error.responseJSON) {
            $('#examenes').text(error.responseJSON.message)
        } else {
            $('#examenes').text('No hay respuesta del servidor')
        }
    })
    }
})

function arrayListItemExamenes (examenesSesion) {
    return examenesSesion.map(function (examen) {
        let fecha = new Date(examen.examenFecha)
        const anio = fecha.getFullYear().toString()
        const mes = fecha.getMonth() < 9 ? '0' + (fecha.getMonth() + 1).toString() : (fecha.getMonth() + 1).toString()
        const dia = fecha.getDate().toString()
        fecha = anio + '-' + mes + '-' + dia
        return `<li class="list-group-item d-flex justify-content-between align-items-center">
    <p class="examen-datos">${ fecha.toString() } | FOLIO: ${ examen.examenId } | ${ examen.examenDiagnostico } (<a href="/paciente.html?id=${ examen.pacienteId }">${ examen.pacienteNombres } ${ examen.pacienteApellidos }</a>)</p>
    <span class="badge badge-success badge-pill">Entregado</span>
  </li>`
})
}