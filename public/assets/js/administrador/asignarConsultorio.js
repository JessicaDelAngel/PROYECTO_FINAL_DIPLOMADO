const consultorio = getUrlParams()['consultorio']

$.ajax({
    method: 'GET',
    url: '/api/consultorios',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const consultorios = respuesta.consultorios
    $('#select-consultorios > optgroup').html(renderOptions(consultorios))
    if (consultorio) {
        $('#select-consultorios').val(consultorio)
    }
}).fail(function (err) {
    $('#select-consultorios > optgroup').html('<option selected>No se encontraron consultorios</option>')
})

function renderOptions (arr) {
    return arr.map(function (option) {
        const id = option.id
        const piso = option.piso
        const doctor = option.doctorId !== 'doctorId' ? ` | ${ option.doctorNombres } ${ option.doctorApellidos }` : null
        return `<option value="${ id }">${ id }, piso ${ piso }${ doctor ? doctor : '' }</option>`
    })
}

$.ajax({
    method: 'GET',
    url: '/api/usuarios',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuestas) {
    const usuarios = {}
    const doctor = respuestas.doctor
    doctor.forEach(function (dr) { usuarios[dr.nombres + ' ' + dr.apellidos] = dr.id })
    console.log('usuarios:', usuarios)
    $('input[name="nombres"]').autocomplete({
        source: usuarios,
        treshold: 0,
        onSelectItem: function (item, element) {
            $('input[name="doctorId"]').val(item.value)
        },
        highlightClass: 'text-info'
    })
}).fail(function (err) {

})

$('#form-asignar-consultorio').on('submit', function (e) {
    e.preventDefault()
    const datosSeleccionados = $('#form-asignar-consultorio').serialize()
    const consultorioId = $('#form-asignar-consultorio select[name="consultorioId"]').val()
    $.ajax({
        method: 'PUT',
        url: `/api/consultorio/${ consultorioId }`,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: datosSeleccionados
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000);
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000);

    })
})