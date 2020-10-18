const tipoUsuario = JSON.parse(datos)['tipo']

function cargarSidebar (t) {
    switch (t) {
        case 'ENFERMERO':
            renderSidebar([
                {
                    url: '/pacientes',
                    icono: 'tabla',
                    nombre: 'Mis pacientes',
                    rutas: [
                        '/examen/',
                        '/pacientes/',
                        '/paciente/'
                    ]
                }, {
                    url: '/nuevo/consulta.html',
                    icono: 'escritorio-plus',
                    nombre: 'Consulta nueva',
                    rutas: [
                        '/nuevo/consulta.html'
                    ]
                }
            ])
            break;
        case 'DOCTOR':
            renderSidebar([
                {
                    url: '/pacientes',
                    icono: 'tabla',
                    nombre: 'Mis pacientes',
                    rutas: [
                        '/transferir/',
                        '/pacientes/',
                        '/paciente/'
                    ]
                }, {
                    url: '/consultas',
                    icono: 'escritorio',
                    nombre: 'Mis consultas',
                    rutas: [
                        '/nuevo/consulta.html',
                        '/consultas/',
                        '/consulta/'
                    ]
                }, {
                    url: '/mis-examenes.html',
                    icono: 'tubo',
                    nombre: 'Exámenes médicos',
                    rutas: [
                        '/mis-examenes.html',
                        '/examen/',
                        '/nuevo/examen.html'
                    ]
                },
            ])
            break;
        case 'LABORATORISTA':
            renderSidebar([
                {
                    url: '/resultados',
                    icono: 'tabla-tubo',
                    nombre: 'Mis resultados',
                    rutas: [
                        '/nuevo/resultado.html',
                        '/resultados/',
                        '/resultado/'
                    ]
                }, {
                    url: '/examenes',
                    icono: 'tubo',
                    nombre: 'Exámenes médicos',
                    rutas: [
                        '/examenes/'
                    ]
                }
            ])
            break;
        case 'ADMINISTRADOR':
            renderSidebar([
                {
                    url: '/habitaciones',
                    icono: 'cama',
                    nombre: 'Habitaciones',
                    rutas: [
                        '/nuevo/habitacion.html',
                        '/asignar/habitaciones.html',
                        '/habitaciones/'
                    ]
                }, {
                    url: '/usuarios',
                    icono: 'usuario',
                    nombre: 'Usuarios',
                    rutas: [
                        '/nuevo/usuario.html',
                        '/usuarios/',
                        '/usuario/'
                    ]
                }, {
                    url: '/consultorios',
                    icono: 'escritorio',
                    nombre: 'Consultorios',
                    rutas: [
                        '/consultorios/',
                        '/nuevo/consultorio.html',
                        '/asignar/consultorio.html'
                    ]
                }, {
                    url: '/pacientes',
                    icono: 'tabla',
                    nombre: 'Pacientes',
                    rutas: [
                        '/nuevo/paciente.html',
                        '/internar/',
                        '/transferir/',
                        '/pacientes/',
                        '/paciente/'
                    ]
                }
            ])
            break;
        default:
            break;
    }
}

function renderSidebar (arr) {
    const currentURL = window.location.pathname.toString()
    $('#menu-sidebar').append('<a id="btn-close-sidebar"><i class="fa fa-bars"></i></a>')
    arr.forEach(function (elemento) {
        const active = elemento.rutas.indexOf(currentURL) !== -1
        $('#menu-sidebar').append(`<a href="${ elemento.url }" class="w-100 d-inline-flex align-items-center align-content-center${active ? ' current' : ''}">
            <span class="sidebar-icon sidebar-icon-${ elemento.icono }"></span>
            <h5 class="mb-0 w-100">${ elemento.nombre }</h5>
        </a>`)
    })
}
