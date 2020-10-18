$.ajax({
    method: 'GET',
    url: '/api/usuarios',
    headers: {
        'Authorization': 'Bearer '.concat(token),
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    beforeSend: function (xhr) {
        $('.list-group').html(cargando)
    }
}).done(function (respuesta) {
    $('#icon-cargando').remove()
    const {doctor, administrador, enfermero, laboratorista} = respuesta
    $('#lista-doctores').html(renderUsuario(doctor))
    $('#lista-enfermeros').html(renderUsuario(enfermero))
    $('#lista-laboratoristas').html(renderUsuario(laboratorista))
    $('#lista-administradores').html(renderUsuario(administrador))
}).fail(function (err) {
    $('#icon-cargando').remove()
    $('.list-group').html('<h6>No hay usuarios</h6>')
})

function renderUsuario (arr) {
    return arr.map(function (usuario) {
        return `<li class="list-group-item">
            <a href="/usuario?usuario=${usuario.id}" class="d-flex justify-content-between align-items-center"><p class="p-0 m-0">${usuario.id} | ${usuario.nombres} ${usuario.apellidos}</p></a>
        </li>`
    })
}