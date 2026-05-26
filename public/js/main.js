// ==========================================================================
// CONTROL DE INTERACCIÓN DEL FORMULARIO DE DONACIONES - HOSPITAL LUIS A. GÜEMES
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CAPTURA DE ELEMENTOS DEL DOM ---
    const modal = document.getElementById('modalDonacion');
    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    
    const radioPersona = document.getElementById('radioPersona');
    const radioEmpresa = document.getElementById('radioEmpresa');
    
    const camposPersona = document.getElementById('camposPersona');
    const camposEmpresa = document.getElementById('camposEmpresa');
    const formDonacion = document.getElementById('formDonacion');

    // --- 2. LOGIC DE APERTURA Y CIERRE DEL MODAL ---
    
    // Abrir el formulario flotante
    btnAbrirModal.addEventListener('click', () => {
        modal.classList.add('mostrar');
        document.body.style.overflow = 'hidden'; // Evita que la página del fondo se mueva
    });

    // Cerrar desde la "X"
    btnCerrarModal.addEventListener('click', cerrarModal);

    // Cerrar si el usuario hace clic afuera del recuadro blanco (en la zona oscura)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    function cerrarModal() {
        modal.classList.remove('mostrar');
        document.body.style.overflow = 'auto'; // Devuelve el scroll a la página
    }

    // --- 3. COMPORTAMIENTO DINÁMICO DEL FORMULARIO ---
    
    // Escuchamos el cambio en los botones de selección (Radio Buttons)
    radioPersona.addEventListener('change', alternarCamposFormulario);
    radioEmpresa.addEventListener('change', alternarCamposFormulario);

    function alternarCamposFormulario() {
        if (radioPersona.checked) {
            camposPersona.style.display = 'block';
            camposEmpresa.style.display = 'none';
            if(document.getElementById('nombreEmpresa')) document.getElementById('nombreEmpresa').value = '';
        } else if (radioEmpresa.checked) {
            camposEmpresa.style.display = 'block';
            camposPersona.style.display = 'none';
            if(document.getElementById('nombreCompleto')) document.getElementById('nombreCompleto').value = '';
            if(document.getElementById('dni')) document.getElementById('dni').value = '';
            if(document.getElementById('fechaNacimiento')) document.getElementById('fechaNacimiento').value = '';
        }
    }

    // --- 4. ENVÍO DE DATOS AL SERVIDOR DE NODE.JS ---
    formDonacion.addEventListener('submit', async (e) => {
        e.preventDefault();

        console.log("¡Hiciste clic en enviar! Intentando mandar los datos...");

        // Capturar cuál radio button está seleccionado
        const tipoDonante = radioPersona.checked ? 'persona' : 'empresa';
        const correo = document.getElementById('correo').value;
        
        // Capturar los checkboxes de las categorías que estén tildadas
        const checkboxes = document.querySelectorAll('input[name="categorias"]:checked');
        const categoriasSeleccionadas = Array.from(checkboxes).map(cb => {
            return cb.parentNode.querySelector('span')?.innerText || cb.value;
        });
        
        const categoriaFinal = categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas.join(', ') : 'General';

        // CAPTURA SEGURA: Usamos ?.value || '' por si el campo está oculto y no existe en el DOM
        const datosDonacion = {
            tipoDonante: tipoDonante,
            nombreCompleto: document.getElementById('nombreCompleto')?.value || '',
            nombreEmpresa: document.getElementById('nombreEmpresa')?.value || '',
            dni: document.getElementById('dni')?.value || null,
            fechaNacimiento: document.getElementById('fechaNacimiento')?.value || null,
            correo: correo,
            categoria: categoriaFinal
        };

        try {
            // Mandamos los datos al backend usando la URL relativa
            const respuesta = await fetch('/api/donaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosDonacion)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert('¡Excelente! Tu donación fue registrada con éxito en la base de datos del Hospital.');
                formDonacion.reset(); // Limpiamos el formulario
                cerrarModal();       // Cerramos la ventana flotante
            } else {
                alert('Hubo un problema en el servidor: ' + resultado.error);
            }

        } catch (error) {
            console.error('Error en la conexión con el servidor:', error);
            alert('No se pudo conectar con el servidor. Asegurate de que Node.js esté corriendo.');
        }
    });

});