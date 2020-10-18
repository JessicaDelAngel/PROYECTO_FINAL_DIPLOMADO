// https://stackoverflow.com/questions/4811807/hidden-sidebar-that-shows-up-on-hover
// https://www.w3schools.com/howto/howto_js_sidenav.asp
$('#menu-sidebar').hover(function () {
    $(this).animate({ width: '350px' }, 500)
    $(this).css({ 'box-shadow': '0 1px 15px rgba(0, 0, 0, 0.65)'})
    $('#menu-sidebar > a').animate({ paddingLeft: '32px' }, 500)
    $('#menu-sidebar > a > h5').animate({ marginLeft: '24px' }, 500)
    $('#menu-sidebar > a > h5').animate({ opacity: '1.0' })
}, function () {
    $(this).animate({ width: '52px' }, 500)
    $(this).css({ 'box-shadow': '0 1px 2px rgba(0, 0, 0, 0.15)' })
    $('#menu-sidebar > a').animate({ paddingLeft: '8px' }, 500)
    $('#menu-sidebar > a > h5').animate({ opacity: '0', marginLeft: '0.5rem' }, 750)
}).trigger('mouseleave')

$('#btn-cerrar-sesion').on('click', function (e) {
    e.preventDefault()
    localStorage.clear()
    sessionStorage.clear()
    window.location = '/login'
})

const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

function getUrlParams () {
    // https://html-online.com/articles/get-url-parameters-javascript/
    let vars = {}
    const params = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    })
    return vars
}

function mensajeSubmit (correcto, mensaje) {
    return `<div class="alert alert-${correcto ? 'success' : 'danger'} alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <p class="alert-heading m-0">${ mensaje }</p>
    </div>`
}

function formatoFecha (f) {
    console.log('Dando formato a fecha')
    const fecha = new Date(f)
    const anio = fecha.getFullYear().toString()
    const mes = meses[fecha.getMonth()]
    const dia = fecha.getDate().toString()
    return dia + '/' + mes + '/' + anio
}

const cargando = `<div class="row m-5" id="icon-cargando">
    <div class="col text-center">
        <i class="fa fa-spinner fa-5x text-black-50"></i>
    </div>
</div>`

$('[data-toggle="tooltip"]').tooltip()
