const token = localStorage.getItem('iDoctor/token')
const datos = localStorage.getItem('iDoctor/usuario')

if (token) {
    $.ajax({
        url: '/api',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    }).done(function (res) {
        const tipo = res.tipo
        localStorage.setItem('iDoctor/usuario', JSON.stringify({ tipo, ...JSON.parse(datos) }))

        const rutas = {
            'ADMINISTRADOR': [
                /\/mis-datos\.html/g,
                /\/nuevo\/consultorio\.html/g ,
                /\/nuevo\/paciente\.html/g,
                /\/nuevo\/habitacion\.html/g,
                /\/nuevo\/usuario\.html/g,
                /\/asignar\/habitaciones\.html/g,
                /\/asignar\/consultorio\.html/g,
                /\/consultorios\//g,
                /\/habitaciones\//g,
                /\/internar\//g,
                /\/transferir\//g,
                /\/pacientes\//g,
                /\/paciente\//g,
                /\/usuarios\//g,
                /\/usuario\//g,
                /\/error\//g
            ],
            'DOCTOR': [
                /\/mis-datos\.html/g,
                /\/nuevo\/consulta\.html/g,
                /\/nuevo\/examen\.html/g,
                /\/mis-examenes\.html/g,
                /\/examen\//g,
                /\/pacientes\//g,
                /\/paciente\//g,
                /\/consultas\//g,
                /\/consulta\//g,
                /\/transferir\//g,
                /\/error\//g
            ],
            'ENFERMERO': [
                /\/mis-datos\.html/g,
                /\/pacientes\//g,
                /\/paciente\//g,
                /\/examen\//g,
                /\/nuevo\/consulta\.html/g,
                /\/error\//g
            ],
            'LABORATORISTA': [
                /\/mis-datos\.html/g,
                /\/nuevo\/resultado\.html/g,
                /\/examenes\//g,
                /\/resultados\//g,
                /\/resultado\//g,
                /\/error\//g
            ]
        }
        const currentURL = window.location.pathname.toString()
        const userScope = rutas[tipo].filter(function (regEx) { return regEx.test(currentURL) })
        if (currentURL !== '/' && userScope.length !== 1) {
            window.location = '/error?error=404'
        }
        if (currentURL === '/') {
            $('.d-none').removeClass('d-none')
            $('#menu-sidebar').css({ display: 'block' })
        }
        $('body').css({visibility: 'visible'})
        cargarSidebar(tipo)
    }).fail(function (err) {
        window.location = '/login'
    })
} else {
    window.location = '/login'
}
