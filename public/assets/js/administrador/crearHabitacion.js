$.ajax({
    method: 'GET',
    url: '/api/areas',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const areas = respuesta.areas
    $('#select-areas > optgroup').html(renderAreas(areas))
}).fail(function (err) {
    $('#select-areas > optgroup').html('<option>No hay áreas a descargar</option>')
})

function renderAreas (arr) {
    return arr.map(function (area) {
        return `<option value="${area.nombre}">${area.nombre}</option>`
    })
}

$('#form-nueva-habitacion').on('submit', function (e) {
    e.preventDefault()
    const info = $('#form-nueva-habitacion').serialize()
    $.ajax({
        url: '/api/habitacion',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: info
    }).done(function (respuesta) {
        $('#form-nueva-habitacion input').val('')
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
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