$('#form-nuevo-consultorio').on('submit', function (e) {
    e.preventDefault()
    const datosConsultorio = $('#form-nuevo-consultorio').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/consultorio',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: datosConsultorio
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        $('input[name="piso"]').val('')
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