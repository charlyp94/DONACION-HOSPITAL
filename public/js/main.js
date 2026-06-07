// ==========================================================================
// CONTROL DE INTERACCIÓN Y REGISTRO DE DONACIONES - HOSPITAL LUIS A. GÜEMES
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

    // --- 2. LÓGICA DE APERTURA Y CIERRE DEL MODAL ---
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            modal.classList.add('mostrar');
            document.body.style.overflow = 'hidden'; 
        });
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    function cerrarModal() {
        modal.classList.remove('mostrar');
        document.body.style.overflow = 'auto'; 
    }

    // --- 3. COMPORTAMIENTO DINÁMICO DEL FORMULARIO ---
    if (radioPersona && radioEmpresa) {
        radioPersona.addEventListener('change', alternarCamposFormulario);
        radioEmpresa.addEventListener('change', alternarCamposFormulario);
    }

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

    // --- 4. ENVÍO DE DATOS Y GENERACIÓN DEL COMPROBANTE PDF ---
    if (formDonacion) {
        formDonacion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipoDonante = radioPersona.checked ? 'persona' : 'empresa';
            const correo = document.getElementById('correo').value;
            
            const checkboxes = document.querySelectorAll('input[name="categorias"]:checked');
            const categoriasSeleccionadas = Array.from(checkboxes).map(cb => {
                return cb.parentNode.querySelector('span')?.innerText || cb.value;
            });
            
            const categoriaFinal = categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas.join(', ') : 'General';

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
                const respuesta = await fetch('/api/donaciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosDonacion)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    
                    // ✨ CARTEL DE ÉXITO HERMOSO CON SWEETALERT2
                    Swal.fire({
                        icon: 'success',
                        title: '¡Donación Registrada!',
                        text: 'Se ha registrado con exito su intencion de donacion, muchas gracias por colaborar con el hospital Luis A. Güemes.',
                        showConfirmButton: false,
                        timer: 2500,
                        iconColor: '#28a745'
                    });

                    // ==================================================================
                    // 🚀 BLOQUE DE GENERACIÓN DEL PDF
                    // ==================================================================
                    try {
                        const jsPDF = window.jspdf.jsPDF;
                        const doc = new jsPDF();

                        const cargarImagenComoBase64 = (url) => {
                            return new Promise((resolve, reject) => {
                                const img = new Image();
                                img.crossOrigin = 'Anonymous';
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    resolve(canvas.toDataURL('image/jpeg'));
                                };
                                img.onerror = (error) => reject(error);
                                img.src = url;
                            });
                        };

                        cargarImagenComoBase64('./img/logo.jpg')
                            .then((logoBase64) => {
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({ opacity: 0.12 }));
                                doc.addImage(logoBase64, 'JPEG', 45, 80, 120, 105);
                                doc.restoreGraphicsState();
                                armarContenidoPDF(doc, datosDonacion, tipoDonante);
                            })
                            .catch((err) => {
                                console.error("No se pudo estampar el logo, imprimiendo sin fondo:", err);
                                armarContenidoPDF(doc, datosDonacion, tipoDonante);
                            });

                        function armarContenidoPDF(documento, datos, tipo) {
                            documento.setFont("helvetica", "bold");
                            documento.setFontSize(22);
                            documento.textColor(74, 44, 53); // Color #4a2c35
                            documento.text("HOSPITAL LUIS A. GÜEMES", 105, 25, { align: "center" });

                            documento.setFontSize(14);
                            documento.textColor(100, 100, 100);
                            documento.text("Comprobante de Intención de Donación", 105, 35, { align: "center" });
                            
                            documento.setDrawColor(74, 44, 53);
                            documento.setLineWidth(0.5);
                            documento.line(20, 42, 190, 42);

                            documento.setFont("helvetica", "normal");
                            documento.setFontSize(12);
                            documento.textColor(50, 50, 50);

                            let nombreMostrar = tipo === 'persona' ? datos.nombreCompleto : datos.nombreEmpresa;
                            let documentoTexto = tipo === 'persona' ? `DNI: ${datos.dni || 'No especificado'}` : 'Tipo: Empresa / Institución';

                            documento.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 20, 55);
                            documento.text(`Donante: ${nombreMostrar}`, 20, 65);
                            documento.text(documentoTexto, 20, 75);
                            documento.text(`Correo Electrónico: ${datos.correo}`, 20, 85);
                            
                            documento.setFillColor(244, 244, 244);
                            documento.rect(20, 95, 170, 30, "F");
                            
                            documento.setFont("helvetica", "bold");
                            documento.text("Detalle de los Insumos / Categorías Comprometidas:", 25, 105);
                            documento.setFont("helvetica", "normal");
                            documento.text(`- ${datos.categoria}`, 25, 115);

                            documento.setFontSize(10);
                            documento.textColor(120, 120, 120);
                            documento.text("Este documento es un comprobante automático de registro.", 105, 150, { align: "center" });
                            documento.text("Muchas gracias por su colaboración y compromiso con nuestra comunidad.", 105, 156, { align: "center" });

                            documento.save(`Comprobante_Donacion_${nombreMostrar.replace(/ /g, "_")}.pdf`);
                        }

                    } catch (pdfError) {
                        console.error("Error al procesar el PDF:", pdfError);
                    }
                    // ==================================================================

                    formDonacion.reset();
                    cerrarModal();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en el servidor',
                        text: resultado.error,
                        confirmButtonColor: '#4a2c35'
                    });
                }

            } catch (error) {
                console.error('Error de conexión:', error);
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin Conexión',
                    text: 'No se pudo conectar con el servidor. Asegurate de que Node.js esté corriendo.',
                    confirmButtonColor: '#4a2c35'
                });
            }
        });
    }
});

// ==========================================================================
// 🔐 ACCESO ESTÉTICO AL PANEL DE GESTIÓN (CON CARTELES DE ÉXITO Y ERROR)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnPersonal = document.getElementById('btnAccesoPersonal');

    if (btnPersonal) {
        btnPersonal.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 

            Swal.fire({
                title: 'Acceso Administrativo',
                text: 'Ingrese la contraseña de acceso del personal:',
                input: 'password',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Ingresar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#4a2c35', 
                cancelButtonColor: '#6c757d',
                inputPlaceholder: 'Contraseña corporativa',
                inputValidator: (value) => {
                    if (!value) {
                        return '¡Por favor, ingrese la clave de seguridad!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (result.value === "saludaguaray") {
                        
                        // ✨ NUEVO: CARTEL DE ACCESO CORRECTO HERMOSO
                        Swal.fire({
                            icon: 'success',
                            title: '¡Acceso Concedido!',
                            text: 'Contraseña correcta. Redirigiendo al Panel de Gestión...',
                            showConfirmButton: false,
                            timer: 2000, // Se muestra por 2 segundos
                            iconColor: '#28a745'
                        }).then(() => {
                            // Una vez que se cierra el cartel, recién ahí te redirige
                            window.location.href = "admin.html"; 
                        });

                    } else {
                        // Cartel de error que ya te gustó como quedaba
                        Swal.fire({
                            icon: 'error',
                            title: 'Acceso Denegado',
                            text: 'Contraseña incorrecta.',
                            confirmButtonColor: '#4a2c35'
                        });
                    }
                }
            });
        });
    }
});

// ==========================================================================
// CÓDIGO UNIFICADO PARA EL HISTORIAL PÚBLICO DE DONACIONES (CON HOVER VISUAL)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnVerHistorial = document.getElementById('btnVerHistorial');
    const modalHistorial = document.getElementById('modalHistorial');
    const btnCerrarHistorial = document.getElementById('btnCerrarHistorial');
    const tablaHistorialCuerpo = document.getElementById('tablaHistorialCuerpo');

    // 🎨 EFECTO HOVER INTEGRADO POR JAVASCRIPT
    if (btnVerHistorial) {
        // Estilos iniciales base para asegurar suavidad
        btnVerHistorial.style.transition = 'filter 0.3s ease, background-color 0.3s ease';
        btnVerHistorial.style.cursor = 'pointer';

        // Cuando el mouse pasa por encima, se oscurece un 15% como los otros botones
        btnVerHistorial.addEventListener('mouseover', () => {
            btnVerHistorial.style.filter = 'brightness(85%)';
        });

        // Cuando el mouse sale, vuelve a la normalidad
        btnVerHistorial.addEventListener('mouseout', () => {
            btnVerHistorial.style.filter = 'brightness(100%)';
        });

        // Abrir modal y disparar consulta asíncrona
        btnVerHistorial.addEventListener('click', () => {
            modalHistorial.style.display = 'flex';
            cargarHistorialPublico();
        });
    }

    // Cerrar modal con la X
    if (btnCerrarHistorial && modalHistorial) {
        btnCerrarHistorial.addEventListener('click', () => {
            modalHistorial.style.display = 'none';
        });
    }

    // Cerrar haciendo clic afuera
    window.addEventListener('click', (e) => {
        if (e.target === modalHistorial) {
            modalHistorial.style.display = 'none';
        }
    });

    async function cargarHistorialPublico() {
        try {
            if (!tablaHistorialCuerpo) return;
            tablaHistorialCuerpo.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Cargando historial...</td></tr>';

            const respuesta = await fetch('/api/donaciones/aprobadas');
            const donaciones = await respuesta.json();

            tablaHistorialCuerpo.innerHTML = ''; 

            if (donaciones.length === 0) {
                tablaHistorialCuerpo.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">Aún no hay donaciones aprobadas para mostrar.</td></tr>';
                return;
            }

            donaciones.forEach(donacion => {
                const fila = document.createElement('tr');
                fila.style.borderBottom = '1px solid #eee';
                
                let fechaFormateada = "Sin fecha";
                if (donacion.fecha) {
                    fechaFormateada = new Date(donacion.fecha).toLocaleDateString('es-AR');
                }

                fila.innerHTML = `
                    <td style="padding: 12px 15px; font-weight: bold; color: #333;">${donacion.nombre}</td>
                    <td style="padding: 12px 15px; color: #555;">${donacion.categoria}</td>
                    <td style="padding: 12px 15px; color: #777;">${fechaFormateada}</td>
                `;
                tablaHistorialCuerpo.appendChild(fila);
            });

        } catch (error) {
            console.error('Error al cargar el historial:', error);
            if (tablaHistorialCuerpo) {
                tablaHistorialCuerpo.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:red;">No se pudo conectar al servidor.</td></tr>';
            }
        }
    }
});