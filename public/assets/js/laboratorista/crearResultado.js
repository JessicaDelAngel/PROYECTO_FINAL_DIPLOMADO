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
    const doctor = respuesta.doctor
    const paciente = respuesta.paciente
    const examen = respuesta.examen

    $('#paciente-nombre').text(paciente.nombres + ' ' + paciente.apellidos)
    $('#doctor-nombre').text(doctor.nombres + ' ' + doctor.apellidos)
    $('#examen-muestra').text(examen.muestra ? examen.muestra : '-')
    $('#examen-diagnostico').text(examen.diagnostico ? examen.diagnostico : '-')
}).fail(function (err) {
    if (err.status === 404) {
        window.location = '/examenes'
    }
    $('#mensaje').html(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : JSON.parse(err.responseText).message))
    setTimeout(() => {
        $('#mensaje>.alert').fadeOut('slow')
    }, 4000)
})

$('#form-nuevo-resultado').on('submit', function (e) {
    e.preventDefault()
    const info = $(this).serialize()
    $.ajax({
        method: 'POST',
        url: '/api/resultados/'.concat(examenId),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        data: info
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
        setTimeout(() => {
            window.location = '/resultados'
        }, 6000)
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : JSON.parse(err.responseText).message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})