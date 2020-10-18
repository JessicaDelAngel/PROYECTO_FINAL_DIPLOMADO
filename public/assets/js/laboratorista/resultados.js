$.ajax({
    type: 'GET',
    url: '/api/resultados', 
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer '.concat(token)
    },
    beforeSend: function (xhr) {
        $('.row-content > .col-content').append(cargando)
    }
}).done(function (respuesta) {
    $('#icon-cargando').remove()
    const resultados = respuesta.resultados
    const renderResultados = resultados.map(function (resultado) { return renderListItem(resultado) })
    $('#lista-resultados').html(renderResultados)
}).fail(function (err) {
    $('#icon-cargando').remove()
    $('ol.breadcrumb > li.breadcrumb-item:nth-child(2) > a > h4').text('Error')
    $('#lista-resultados').html(`<p>${err.responseJSON ? err.responseJSON.message : err.message}</p>`)
})

function renderListItem (elemento) {
    const nombre = elemento.paciente.nombres + ' ' + elemento.paciente.apellidos
    let fecha = new Date(elemento.fecha)
    const dia = fecha.getDate()
    const mes = fecha.getMonth()
    const anio = fecha.getFullYear()
    fecha = dia + '/' + mes + '/' + anio
    return `
        <a href="/resultado?resultado=${elemento.resultadoId}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-dark" style="text-decoration: none;">
            <span>${fecha} | ${nombre} | ${elemento.diagnostico}</span>
        </a>
    `
}
