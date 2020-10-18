const tipoError = getUrlParams()['error']

$('#tipo-error').html(`<p>${tipoError}</p>`)

setTimeout(() => {
    window.location = '/'
}, 15000)