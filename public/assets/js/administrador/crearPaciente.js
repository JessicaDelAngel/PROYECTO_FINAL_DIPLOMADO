$('#form-nuevo-paciente').on('submit', function (e) {
    e.preventDefault()
    const info = $('#form-nuevo-paciente').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/paciente',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: info
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        $('#form-nuevo-paciente input[type="text"]').val('')
        $('#form-nuevo-paciente input[type="date"]').val('')
        $('#form-nuevo-paciente textarea').val('')
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