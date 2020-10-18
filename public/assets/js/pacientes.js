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
    const pacientes = respuesta.pacientes
    if (tipoUsuario === 'DOCTOR' || tipoUsuario === 'ENFERMERO') {
        $('ol.breadcrumb > li:nth-child(2) > a > h4').text('Mis pacientes')
        $('.row-content > div > .row').html(renderPacientesEqMed(pacientes))
    } else if (tipoUsuario === 'ADMINISTRADOR') {
        const internados = pacientes.filter(function (paciente) { return paciente.fechaIngreso })
        const transitorios = pacientes.filter(function (paciente) { return !paciente.fechaIngreso })
        $('ol.breadcrumb > li:nth-child(2) > a > h4').text('Pacientes registrados')
        $('.row-content').html(htmlAdminContent)
        $('#list-pacientes-internados').html(renderPacientesInternados(internados))
        $('#list-pacientes-transitorios').html(renderPacientesTransitorios(transitorios))
    }
}).fail(function (err) {
    $('#icon-cargando').remove()
    if (err.status === 500) {
        const mensaje = err.responseJSON ? err.responseJSON.message : err.message
        $('.row-content > div > .row').html(`<div class="col"><h5>Error</h5><p>${mensaje}</p></div>`)
    } else if (tipoUsuario === 'ADMINISTRADOR') {
        $('.row-content').html(htmlAdminContent)
    } else {
        $('#pacientes-titulo').text('Mis pacientes')
        $('.row-content > div > .row').html('<p class="p-2">No hay pacientes asignados</p>')
    }
})

function renderPacientesEqMed (arr) {
    return arr.map(function (paciente) {
        return `
        <div class="col-6 col-md-3 col-xl-2 px-3 my-2 my-md-3">
            <div class="card h-100 card-paciente shadow">
                <div class="card-body">
                    <h5 class="text-center card-title card-nombres">${paciente.nombres}</h5>
                    <h6 class="text-center card-subtitle card-apellidos">${paciente.apellidos}</h6>
                    <div class="row mt-2">
                        <div class="col text-center d-flex justify-content-center align-items-center align-content-center justify-content-md-center justify-content-xl-center">
                            <h6 class="text-muted card-area">${paciente.area}</h6>
                        </div>
                        <div class="col d-flex justify-content-center align-items-center align-content-center justify-content-md-center justify-content-xl-center">
                            <p class="card-habitacion">${paciente.habitacionId}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-center card-footer-historial">
                    <a class="btn btn-outline-primary btn-block btn-sm btn-historial text-uppercase" style="text-decoration: none;" href="/paciente?paciente=${paciente.id}">Historial</a>
                </div>
            </div>
        </div>
        `
    })
}

function renderPacientesTransitorios (arr) {
    return arr.map(function (paciente) {
        return `
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-dark" style="text-decoration: none;" href="/paciente?paciente=${paciente.id}">
                <span>${paciente.id} | ${paciente.nombres} ${paciente.apellidos}</span>
            </a>
        `
    })
}

function renderPacientesInternados (arr) {
    return arr.map(function (paciente) {
        const [dia, mes, anio] = formatoFecha(paciente.fechaIngreso).split('/')
        const fechaIngreso = [dia, mes].join('/')
        return `
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-dark" style="text-decoration: none;" href="/paciente?paciente=${paciente.id}">
                <div><p class="m-0">${paciente.nombres} ${paciente.apellidos}</p><p class="m-0 text-black-50">Desde ${fechaIngreso}</p></div>
                <span>${paciente.area}</span>
            </a>
        `
    })
}

const htmlAdminContent = `<div class="col p-2 col-content">
        <a href="/nuevo/paciente.html" class="btn btn-outline btn-block btn-submit text-uppercase mb-2" style="text-decoration: none;">
            <i class="fa fa-plus-circle"></i>
            <span>Crear paciente</span>
        </a>
        <h4>Pacientes internados</h4>
        <div id="list-pacientes-internados" class="list-group"></div>
        <hr />
        <h4>Pacientes transitorios</h4>
        <div id="list-pacientes-transitorios" class="list-group"></div>
    </div>`
