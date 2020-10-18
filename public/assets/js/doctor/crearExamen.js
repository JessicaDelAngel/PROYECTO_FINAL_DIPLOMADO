const pacienteId = getUrlParams()['paciente']

$.ajax({
    type: 'GET',
    url: '/api/pacientes', 
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer '.concat(token)
    },
    beforeSend: function (xhr) {
        $('#examenes-medicos').append(`<div class="row m-5">
            <div class="col text-center">
                <i class="fa fa-spinner fa-5x text-black-50" id="icon-cargando"></i>
            </div>
        </div>`)
    }
}).done(function (respuesta) {
    const pacientes = respuesta.pacientes
    const pacientesData = {}
    pacientes.forEach(function (paciente) {
        pacientesData[paciente.nombres + ' ' + paciente.apellidos] = paciente.id
    })
    $('#form-nuevo-examen input[name="pacienteNombre"]').autocomplete({
        source: pacientesData,
        treshold: 0,
        onSelectItem: function (item, element) {
            $('#form-nuevo-examen input[name="pacienteId"]').val(item.value)
        },
        highlightClass: 'text-info'
    })
    if (pacienteId) {
        $('#form-nuevo-examen input[name="pacienteId"]').val(pacienteId)
        // https://stackoverflow.com/questions/8668174/indexof-method-in-an-object-array
        const idx = pacientes.map(function (paciente) { return paciente.id }).indexOf(pacienteId)
        $('#form-nuevo-examen input[name="pacienteNombre"]').val(pacientes[idx].nombres + ' ' + pacientes[idx].apellidos)
    }
}).fail(function (err) {
    $('ol.breadcrumb > li.breadcrumb-item:nth-child(3) > a > h4').text('Error')
    $('.col-content').html(`<h4>${ err.status }</h4><p>${ err.message }</p>`)
})

$('#form-nuevo-examen').on('submit', function (e) {
    e.preventDefault()
    const info = $('#form-nuevo-examen').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/examenes',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '.concat(token)
        },
        data: info
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        $('#form-nuevo-examen input').val('')
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