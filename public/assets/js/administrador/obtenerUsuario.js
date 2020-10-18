const usuarioId = getUrlParams()['usuario']

if (!usuarioId) {
    window.location = '/usuarios'
}
$.ajax({
    method: 'GET',
    url: `/api/buscar?usuarioId=${ usuarioId }`,
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuestas) {
    const id = respuestas.datos.id
    const pre = id.substr(0, 3)
    const nombres = respuestas.datos.nombres
    const apellidos = respuestas.datos.apellidos
    const rol = pre === 'doc' ? 'DOCTOR' : pre === 'enf' ? 'ENFERMERO' : pre === 'lab' ? 'LABORATORISTA' : pre === 'adm' ? 'ADMINISTRADOR' : null
    $('#id-usuario').text(id)
    $('#nombre-usuario').text(nombres + ' ' + apellidos)
    $('#rol-usuario').text(rol)
}).fail(function (err) {
    window.location = '/usuarios'
})

('#cambiar-contrasena').on('submit', function (e) {
    e.preventDefault()
    const nuevaContra = $('#cambiar-contrasena').serialize()
    $.ajax({
        method: 'PUT',
        url: '/api/usuario/' + id,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: nuevaContra
    }).done(function (res) {
        $('#mensaje').append(mensajeSubmit(true, res.message))
        $('#cambiar-contrasena > div > div:nth-child(1) > input').val('')
        setTimeout(function () {
            $('#mensaje>.alert').hide().fadeOut('slow')
        }, 4000)
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON.message))
        setTimeout(function () {
            $('#mensaje>.alert').hide().fadeOut('slow')
        }, 4000)
    })
})