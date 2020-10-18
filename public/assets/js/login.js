$('#form-login').on('submit', function (e) {
    e.preventDefault()
    const datos = $('#form-login').serializeArray()
    // const datos = decodeURIComponent($('#form-login').serialize())
    // console.log('datos:', datos)
    $.post('/api/login', datos).done(function (res) {
        localStorage.setItem('iDoctor/token', res.token)
        localStorage.setItem('iDoctor/usuario', JSON.stringify(res.datos))
        window.location = '/'
    }).fail(function (err) {
        $('#mensaje').append(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : err.message))
        setTimeout(() => {
            $('.alert.alert-danger').hide().fadeOut('slow')
        }, 4000)
    })
})