const pacienteId = getUrlParams()['paciente']
// const tipoUsuario = JSON.parse(localStorage.getItem('iDoctor/usuario'))['tipo']

if (pacienteId) {
    $('#form-nueva-consulta input[name="pacienteId"]').val(pacienteId)
}

if (tipoUsuario !== 'DOCTOR') {
    $('#form-nueva-consulta > div > div.col-12.d-flex.justify-content-center.align-items-center.mt-4').before(`
    <div class="col-12 col-md-6">
        <label for="doctorNombre">Nombre doctor</label>
        <input type="text" name="doctorNombre" class="bg-white border rounded border-white shadow-sm form-control p-2" placeholder="Nombre doctor"/>
    </div>
    <div class="col-12 col-md-6">
        <label for="doctorId">Id Doctor</label>
        <input type="text" name="doctorId" class="bg-white border rounded border-white shadow-sm form-control p-2" placeholder="Id doctor" required/>
    </div>`)
    $.ajax({
        method: 'GET',
        url: '/api/usuarios',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).done(function (respuesta) {
        const doctores = respuesta.doctor
        const doctoresData = {}
        doctores.forEach(function (doctor) {
            doctoresData[doctor.nombres + ' ' + doctor.apellidos] = doctor.id
        })
        $('#form-nueva-consulta input[name="doctorNombre"]').autocomplete({
            source: doctoresData,
            treshold: 0,
            onSelectItem: function (item, element) {
                $('#form-nueva-consulta input[name="doctorId"]').val(item.value)
            },
            highlightClass: 'text-info'
        })
    }).fail(function (err) {
        $('#form-nueva-consulta').html(`<p>Error. ${ err.message }</p>`)
    })
}

$.ajax({
    method: 'GET',
    url: '/api/pacientes',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const pacientes = respuesta.pacientes
    const nombres = {}
    pacientes.forEach(function (paciente) {
        nombres[paciente.nombres + ' ' + paciente.apellidos] = paciente.id
    })
    $('#form-nueva-consulta input[name="pacienteNombre"]').autocomplete({
        source: nombres,
        treshold: 0,
        onSelectItem: function (item, element) {
            $('#form-nueva-consulta input[name="pacienteId"]').val(item.value)
        },
        highlightClass: 'text-info'
    })
}).fail(function (err) {
    $('#form-nueva-consulta input[name="pacienteId"]').val('No hay pacientes disponibles. '.concat(err.message))
})

$.ajax({
    method: 'GET',
    url: '/api/consultorios',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const consultorios = respuesta.consultorios
    const consultoriosData = {}
    consultorios.forEach(function (consultorio) {
        const doctor = ' | ' + consultorio.doctorNombres + ' ' + consultorio.doctorApellidos
        const key = consultorio.doctorId !== 'doctorId' ? consultorio.id + ', piso: ' + consultorio.piso + ' ' + doctor : consultorio.id + ', piso: ' + consultorio.piso
        consultoriosData[key] = consultorio.id
    })
    $('#form-nueva-consulta input[name="consultorioId"]').autocomplete({
        source: consultoriosData,
        treshold: 0,
        onSelectItem: function (item, element) {
            $('#form-nueva-consulta input[name="consultorioId"]').val(item.value)
        },
        highlightClass: 'text-info'
    })
}).fail(function (err) {
    $('#form-nueva-consulta input[name="consultorioId"]').val('No hay consultorios disponibles. '.concat(err.message))
})

$('#form-nueva-consulta').on('submit', function (e) {
    e.preventDefault()
    const info = $('#form-nueva-consulta').serialize()
    $.ajax({
        method: 'POST',
        url: '/api/consulta',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: info
    }).done(function (respuesta) {
        $('#mensaje').html(mensajeSubmit(true, respuesta.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
        $('#form-nueva-consulta input').val('')
    }).fail(function (err) {
        $('#mensaje').html(mensajeSubmit(false, err.responseJSON.message))
        setTimeout(() => {
            $('#mensaje>.alert').fadeOut('slow')
        }, 4000)
    })
})