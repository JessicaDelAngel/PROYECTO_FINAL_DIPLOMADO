document.addEventListener('DOMContentLoaded', function() {
    $.ajax({
        method:'GET',
        url: '/api/consultas',
        headers: {
            'Authorization': 'Bearer '.concat(token),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        beforeSend: function (xhr) {
            $('.row-content').html(cargando)
        }
    }).done(function (respuestas) {
        $('#icon-cargando').remove()
        $('ol.breadcrumb > li:nth-child(2) > a > h4').text('Mis consultas')
        const consultas = respuestas.consultas
        $('.row-content').append(renderConsultas(consultas))
        $('.row-content').append(nuevaconsulta)
        $('body').append(modal)
        const consultasEventos = consultas.map(function (consulta) {
            const nombreCompleto = String(consulta.nombres).concat(' ', consulta.apellidos)
            const observaciones = consulta.observaciones ? ' - '.concat(consulta.observaciones) : ''
            return {
                id: consulta.consultaId,
                title: nombreCompleto.concat(observaciones),
                start: consulta.fecha,
                end: Date(consulta.fecha) + (30 * 60 * 1000)
            }
        })
        const calEl = document.getElementById('calendar')
        const calendario = renderCalendario(calEl)
        calendario.addEventSource(consultasEventos)
        calendario.render()
    }).fail(function (err) {
        $('#icon-cargando').remove()
        if (err.status !== 404) {
            $('.row-content').html(`<div class="col"><h4>Error</h4><p>${err.responseJSON.message}</p></div>`)
        } else {
            $('.row-content').append(nuevaconsulta)
        }
    })
})

// https://fullcalendar.io/docs/bootstrap-theme-demo
function renderCalendario (calendarEl) {
    const hoy = new Date()
    const calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        timeZone: 'UTC',
        themeSystem: 'bootstrap',
        contentHeight: 'auto',
        initialView: 'dayGridMonth',
        initialDate: hoy,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        // weekNumbers: true,
        // dayMaxEvents: true, // allow "more" link when too many events
        events: []
    })
    return calendar
}

function renderConsultas (arr) {
    return arr.map(function (consulta) {
        const momento = new Date()
        const hoy = new Date(momento.getFullYear().toString().concat('-', (momento.getMonth() + 1).toString(), '-', momento.getDate().toString()))
        const sieteDias = (8 - momento.getDate()) * 24 * 60 * 60 * 1000 // Días para completar la semana, horas, minutos, segundos, milisegundos
        const fechaConsulta = new Date(consulta.fecha)
        const mes = meses[fechaConsulta.getMonth()]
        const dia = fechaConsulta.getDate()
        const hora = fechaConsulta.getHours()
        const minuto = fechaConsulta.getMinutes()
        const consultaValida = momento >= fechaConsulta
        const consultaDelDia = hoy < fechaConsulta && !consulta.comentario
        return `<div class="col-6 col-md-3 my-1 ${consultaDelDia ? '' : 'd-none'}">
            <div class="card card-paciente shadow">
                <div class="card-body">
                    <h5 class="text-center card-title card-nombres">${consulta.nombres}</h5>
                    <h6 class="text-center card-subtitle card-apellidos">${consulta.apellidos}</h6>
                    <div class="row mt-2 card-consulta-info">
                        <div class="col">
                            <p class="text-uppercase text-center font-weight-bold">${dia} de ${mes}, ${hora}:${minuto}</p>
                            <p class="text-center">${consulta.consultorioId}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-center card-footer-historial">
                    <a href="/consulta?consulta=${consulta.consultaId}" class="btn btn-outline-primary btn-block btn-sm btn-historial text-uppercase${consultaValida ? ' disabled' : ''}">Realizar consulta</a>
                </div>
            </div>
        </div>`
    })
}

const nuevaconsulta = `<div class="col-6 col-md-3 my-1">
<a href="/nuevo/consulta.html" class="card h-100 text-dark" style="text-decoration: none;">
    <div id="card-nueva-consulta" class="card-body d-flex flex-column justify-content-center">
        <div class="text-center icon-nueva-consulta">
            <i class="fa fa-plus-circle fa-3x"></i>
        </div>
        <h4 class="text-uppercase text-center card-title">Agregar consulta</h4>
    </div>
</a>
</div>`

const modal = `<!-- Modal -->
<div class="modal fade" id="calendarioModal" tabindex="-1" role="dialog" aria-labelledby="calendarioModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-body">
                <div id="calendar"></div>
            </div>
        </div>
    </div>
</div>`
