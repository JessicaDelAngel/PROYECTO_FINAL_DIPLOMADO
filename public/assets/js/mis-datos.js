const nombre = JSON.parse(datos)['nombres'] + ' ' + JSON.parse(datos)['apellidos']
const tipo = JSON.parse(datos)['tipo']
const id = JSON.parse(datos)['id']
$('#nombre-usuario').text(nombre)
$('#id-usuario').text(id)
$('#rol-usuario').text(tipo)

$('#cambiar-contrasena').on('submit', function (e) {
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