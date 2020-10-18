const areaParam = decodeURI(getUrlParams()['area'])

$.ajax({
    method: 'GET',
    url: '/api/areas',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const areas = respuesta.areas
    $('#select-areas > optgroup').html(renderAreas(areas))
    if (areaParam) {
        $('#select-areas').val(areaParam)
    }
}).fail(function (err) {
    $('#select-areas > optgroup').html('<option>No se encontraron habitaciones</option>')
})

function renderAreas (arr) {
    return arr.map(function (area) {
        return `<option value="${ area.nombre }">${ area.nombre }</option>`
    })
}

$.ajax({
    method:'GET',
    url: '/api/usuarios',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const usuarios = {}
    const doctores = respuesta.doctor
    const enfermeros = respuesta.enfermero
    doctores.forEach(function (doctor) { usuarios[doctor.nombres + ' ' + doctor.apellidos] = doctor.id })
    enfermeros.forEach(function (enfermero) { usuarios[enfermero.nombres + ' ' + enfermero.apellidos] = enfermero.id })
    $('input[name="nombre"]').autocomplete({
        source: usuarios,
        treshold: 0,
        onSelectItem: function (item, element) {
            $('input[name="usuarioId"]').val(item.value)
        },
        highlightClass: 'text-info'
    })
}).fail(function (err) {
    $('input[name="nombre"]').html('<option>No hay usuarios</option>')
})

$('#form-asignar-habitaciones').on('submit', function (e) {
    e.preventDefault()
    const datos = $('#form-asignar-habitaciones').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/turno',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: datos
    }).done(function (respuestas) {
        // TODO: asignación correcta
        $('#mensaje').html(mensajeSubmit(true, respuestas.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
        $('#select-areas').val('')
        $('#form-asignar-habitaciones input').val('')
    }).fail(function (err) {
        // TODO: hubo un error al asignar las habitaciones
        $('#mensaje').html(mensajeSubmit(true, err.responseJSON.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})