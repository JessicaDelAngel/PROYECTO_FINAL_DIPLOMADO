$.ajax({
    method: 'GET',
    url: '/api/areas',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).done(function (respuesta) {
    const areas = respuesta.areas
    $('#todas-habitaciones').prepend(arrayListItem(areas))
}).fail(function (err) {
    $('#todas-habitaciones').html(`<div class="col"><h4>Error</h4><p>${err.responseJSON ? err.responseJSON.message : err.message}</p>`)
})

function arrayListItem (arr) {
    return arr.map(function (item) {
        return `<div class="col-6 col-md-3 my-2">
            <div class="card card-consultorio shadow h-100">
                <div class="card-body justify-content-center alignt-items-center">
                    <h5 class="text-center card-title card-nombres">${ item.nombre }</h5>
                    <p class="text-uppercase text-center font-weight-bold">Habitaciones: ${ item.habitaciones }</p>
                </div>
                <div class="card-footer text-center card-footer-historial">
                    <a href="/asignar/habitaciones.html?area=${item.nombre}" class="btn btn-outline-primary btn-block btn-sm btn-historial text-uppercase">Asignar</a>
                </div>
            </div>
        </div>`
    })
}