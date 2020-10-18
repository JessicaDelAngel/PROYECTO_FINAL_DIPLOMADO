const pacienteId = getUrlParams()['paciente']

document.addEventListener('DOMContentLoaded', function () {
    $.ajax({
        method: 'GET',
        url: '/api/pacientes',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        beforeSend: function (xhr) {
            $('.row-content > div > .row').html(cargando)
        }
    }).done(function (respuesta) {
        $('#icon-cargando').remove()
        const pacientes = respuesta.pacientes.filter(function (paciente) { return !paciente.fechaIngreso })
        const pacientesIdNoInternados = pacientes.map(function (paciente) { return paciente.id })
        const autocompletado = {}
        pacientes.forEach(function (paciente) {
            autocompletado[paciente.nombres + ' ' + paciente.apellidos] = paciente.id
        })

        $('#form-internar-paciente input[name="pacienteNombre"]').autocomplete({
            source: autocompletado,
            treshold: 0,
            onSelectItem: function (item, element) {
                $('#form-internar-paciente input[name="pacienteId"]').val(item.value)
            },
            highlightClass: 'text-info'
        })

        if (pacienteId && pacientesIdNoInternados.includes(pacienteId)) {
            $('#form-internar-paciente input[name="pacienteId"]').val(pacienteId)
            const datos = pacientes.filter(function (paciente) { return paciente.id === pacienteId })[0]
            $('#form-internar-paciente input[name="pacienteNombre"]').val(datos.nombres + ' ' + datos.apellidos)
        } else {
            $('#message').html(mensajeSubmit(false, 'Seleccione un paciente que no esté internado'))
            setTimeout(() => {
                $('#mensaje>.alert').fadeOut('slow')
            }, 4000)
        }
    }).fail(function (err) {
        $('#icon-cargando').remove()
        $('#form-internar-paciente input[name="pacienteNombre"]').text('No hay pacientes')
        $('#message').html(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : err.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })

    $.ajax({
        method: 'GET',
        url: '/api/areas',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        beforeSend: function (xhr) {
            $('.row-content > div > .row').html(cargando)
        }
    }).done(function (respuesta) {
        const areas = respuesta.areas
        $('#select-area > optgroup').html(areas.map(function (area) { return `<option value="${ area.nombre }">${ area.nombre }</option>` }))
    }).fail(function (err) {
        $('#select-area > optgroup').html('<option>No hay áreas disponibles</option>')
    })
})

$('#form-internar-paciente').on('submit', function (e) {
    e.preventDefault()
    const datosPaciente = $('#form-internar-paciente').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/internar',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: datosPaciente
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        $('#form-internar-paciente input').val('')
        $('#form-internar-paciente textarea').val('')
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON ? err.responseJSON.message : err.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})
