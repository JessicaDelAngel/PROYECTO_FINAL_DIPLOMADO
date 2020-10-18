$.ajax({
    method: 'GET',
    url: '/api/consultorios',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const consultorios = respuesta.consultorios
    $('#todos-consultorios').prepend(renderConsultorios(consultorios))
}).fail(function (err) {
    $('')
})

function renderConsultorios (arr) {
    return arr.map(function (consultorio) {
        const id = consultorio.id
        const piso = consultorio.piso
        const doctorId = consultorio.doctorId === 'doctorId' ? null : consultorio.doctorId
        const doctorNombres = consultorio.doctorNombres === 'doctorNombres' ? null : consultorio.doctorNombres
        const doctorApellidos = consultorio.doctorApellidos === 'doctorApellidos' ? null : consultorio.doctorApellidos
        return renderConsultorio({ id, piso, doctorId, doctorNombres, doctorApellidos })
    })
}

function renderConsultorio ({ id, doctorApellidos, doctorNombres, doctorId, piso }) {
    const redireccionar = `/asignar/consultorio.html?consultorio=${ id }`
    return `
    <div class="col-6 col-md-3 my-2">
        <div class="card card-consultorio shadow h-100">
            <div class="card-body">
                <h5 class="text-center card-title card-nombres">${ id }</h5>
                <p class="text-uppercase text-center font-weight-bold">${ doctorId ? doctorNombres + ' ' + doctorApellidos : '' }</p>
                <div class="row mt-2 card-consulta-info">
                    <div class="col">
                        <p class="text-center">Piso: ${ piso }</p>
                    </div>
                </div>
            </div>
            <div class="card-footer text-center card-footer-historial">
                <a href="${ redireccionar }" class="btn btn-outline-primary btn-block btn-sm btn-historial" role="button">Asignar</a>
            </div>
        </div>
    </div>
    `
}
