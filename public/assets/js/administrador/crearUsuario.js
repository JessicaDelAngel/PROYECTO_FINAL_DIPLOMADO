$('#form-nuevo-usuario').on('submit', function (e) {
    e.preventDefault()
    const info = $('#form-nuevo-usuario').serialize()
    const tipoUsuario = $('#form-nuevo-usuario input[name="rolUsuario"]:checked').val()

    $.ajax({
        method: 'POST',
        url: '/api/'.concat(tipoUsuario),
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: info
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        // TODO: borrar los valores de las casillas
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