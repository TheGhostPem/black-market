// Detectar automáticamente la URL del servidor
const API_URL = (window.location.protocol === 'file:') ? 'http://localhost:5000' : window.location.origin;

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// --- Manejo de Sesión y Perfil ---
document.addEventListener('DOMContentLoaded', () => {
    const sessionStr = localStorage.getItem('userSession');
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userNameSpan = document.getElementById('user-name');
    const userPicImg = document.getElementById('user-pic');

    if (sessionStr && sessionStr !== "undefined") {
        const session = JSON.parse(sessionStr);
        if (authButtons) authButtons.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = session.name;

        if (userPicImg) {
            userPicImg.src = session.profile_pic || 'logo_mini.png';
            userPicImg.style.cursor = 'pointer';
            userPicImg.title = 'Haz clic para cambiar tu foto de perfil';

            userPicImg.onclick = async () => {
                const nuevaFoto = prompt("Pega la URL de tu nueva foto de perfil:", userPicImg.src);
                if (nuevaFoto && nuevaFoto !== userPicImg.src) {
                    try {
                        const res = await fetch(`${API_URL}/api/users/profile_pic`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: session.email, profile_pic: nuevaFoto })
                        });
                        const result = await res.json();
                        if (result.success) {
                            session.profile_pic = nuevaFoto;
                            localStorage.setItem('userSession', JSON.stringify(session));
                            userPicImg.src = nuevaFoto;
                            alert("¡Foto actualizada!");
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
        }
    }
});

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log(result);

            if (result.success) {
                localStorage.setItem('userSession', JSON.stringify(result.user));
                alert('Has iniciado sesión correctamente');
                window.location.href = "pagina.html";
            }
        } catch (error) {
            console.error(error);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log(result);

            if (result.success) window.location.href = "/login";
        } catch (error) {
            console.error(error);
        }
    });
}

const agregarProductoForm = document.getElementById('agregar-producto-form');
if (agregarProductoForm) {
    agregarProductoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(agregarProductoForm);
        const data = Object.fromEntries(formData.entries());

        const userSessionStr = localStorage.getItem('userSession');
        if (userSessionStr && userSessionStr !== "undefined") {
            try {
                data.user_email = JSON.parse(userSessionStr).email;
            } catch (e) { }
        }

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log(result);

            if (result.success) {
                alert('Producto agregado exitosamente');
                agregarProductoForm.reset();
            } else {
                alert('Error: ' + result.msg);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    });
}

// Lógica para cargar y mostrar productos dinámicamente en pagina.html
const catalogoContainer = document.getElementById('catalogo-productos');
if (catalogoContainer) {
    async function cargarProductos() {
        try {
            const response = await fetch(`${API_URL}/api/products`);
            const result = await response.json();

            if (result.success && result.products) {
                window.todosLosProductos = result.products; // Guardamos el catálogo completo en memoria
                renderizarProductos(window.todosLosProductos);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            catalogoContainer.innerHTML = '<p style="color:red;">Ups! Ocurrió un error cargando el catálogo de productos.</p>';
        }
    }

    function renderizarProductos(lista) {
        catalogoContainer.innerHTML = ''; // Limpiar

        if (lista.length === 0) {
            catalogoContainer.innerHTML = '<p style="color:white; font-size: 18px;">No hay productos en esta categoría todavía.</p>';
            return;
        }

        window.productosData = {}; // Reiniciamos el mapa de textos

        let currentUserEmail = null;
        try {
            const sessionStr = localStorage.getItem('userSession');
            if (sessionStr && sessionStr !== "undefined") {
                const session = JSON.parse(sessionStr);
                if (session && session.email) currentUserEmail = session.email;
            }
        } catch (e) { }

        lista.forEach(producto => {
            const imagenSrc = producto.imagen ? producto.imagen : 'logo_mini.png'; // Imagen por defecto
            const descText = producto.descripcion || '';
            const isLong = descText.length > 70;
            const descCorta = isLong ? descText.substring(0, 70) + '...' : descText;

            window.productosData[producto.id] = {
                full: descText,
                short: descCorta,
                precio: producto.precio
            };

            const descHTML = isLong
                ? `<span id="text-${producto.id}">${descCorta}</span> <span id="toggle-${producto.id}" onclick="toggleDesc(${producto.id})" style="color: #FFAEC9; cursor: pointer; font-weight: bold; white-space: nowrap;">Ver más</span>`
                : `<span id="text-${producto.id}">${descText}</span>`;

            const ADMIN_EMAILS = ['blackmarketcorreo@gmail.com', 'juanjoherrera022@gmail.com'];
            const isOwner = currentUserEmail && producto.user_email === currentUserEmail;
            const isAdmin = ADMIN_EMAILS.includes(currentUserEmail);

            const adminButtons = (isOwner || isAdmin)
                ? `<div style="display: flex; gap: 8px; margin-top: 10px; width: 100%;">
                    <button onclick="editarProducto(${producto.id})" style="flex:1; background: #FFAEC9; color: black; border: none; border-radius: 6px; cursor: pointer; padding: 6px; font-size: 12px; font-weight: bold;">Editar</button>
                    <button onclick="borrarProducto(${producto.id})" style="flex:1; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; padding: 6px; font-size: 12px; font-weight: bold;">Borrar</button>
                   </div>`
                : '';

            const card = document.createElement('div');
            card.className = 'producto-card';
            card.innerHTML = `
                <span class="categoria">${producto.categoria}</span>
                <img src="${imagenSrc}" alt="${producto.nombre}" onerror="this.src='logo_mini.png'">
                <h3>${producto.nombre}</h3>
                <p class="descripcion">${descHTML}</p>
                <div class="precio">$${producto.precio}</div>
                <button onclick="comprarProducto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio})">Comprar ahora</button>
                ${adminButtons}
            `;
            catalogoContainer.appendChild(card);
        });
    }

    // Función para editar producto
    window.editarProducto = async function (id) {
        const datosActuales = window.productosData[id];

        const nuevaDesc = prompt("Edita la descripción:", datosActuales.full);
        if (nuevaDesc === null) return; // Cancelado

        const nuevoPrecioStr = prompt("Edita el precio:", datosActuales.precio);
        if (nuevoPrecioStr === null) return; // Cancelado

        const nuevoPrecio = parseFloat(nuevoPrecioStr);
        if (isNaN(nuevoPrecio)) return alert("Por favor, ingresa un precio válido.");

        try {
            const session = JSON.parse(localStorage.getItem('userSession'));
            const response = await fetch(`${API_URL}/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: nuevaDesc,
                    precio: nuevoPrecio,
                    user_email: session.email
                })
            });
            const result = await response.json();
            if (result.success) {
                alert("¡Producto actualizado con éxito!");
                location.reload();
            } else {
                alert("Error: " + result.msg);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al editar.");
        }
    };

    window._categoriaActiva = 'Todos';

    // --- Algoritmo de distancia de Levenshtein (mide similitud entre palabras) ---
    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n];
    }

    // Devuelve true si `query` está "cerca" de `text` (busca en todas las palabras)
    function coincideDifuso(query, text) {
        if (!text) return false;
        const palabras = text.toLowerCase().split(/\s+/);
        const umbral = query.length <= 4 ? 1 : 2; // tolera 1 error para palabras cortas, 2 para largas
        return palabras.some(p => levenshtein(query, p) <= umbral);
    }

    function aplicarFiltros(query, categoria) {
        if (!window.todosLosProductos) return;

        const mapCategorias = {
            'mause': 'ratones', 'mouse': 'ratones', 'raton': 'ratones',
            'pc': 'cpu', 'compu': 'cpu', 'computadora': 'cpu', 'computador': 'cpu',
            'laptop': 'portatiles', 'portatil': 'portatiles', 'notebook': 'portatiles',
            'audifonos': 'auriculares', 'cascos': 'auriculares',
            'monitor': 'pantallas', 'tele': 'pantallas', 'tv': 'pantallas'
        };

        let lista = window.todosLosProductos;

        // Filtro por categoría (sidebar)
        if (categoria && categoria !== 'Todos') {
            lista = lista.filter(p => p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase());
        }

        // Filtro por texto de búsqueda
        if (query) {
            const categoriaSinonimo = mapCategorias[query];

            // 1) Búsqueda exacta/parcial primero
            let exactos = lista.filter(p => {
                if (categoriaSinonimo && p.categoria && p.categoria.toLowerCase() === categoriaSinonimo) return true;
                return (p.nombre && p.nombre.toLowerCase().includes(query)) ||
                    (p.descripcion && p.descripcion.toLowerCase().includes(query));
            });

            if (exactos.length > 0) {
                // Encontró resultados exactos — los muestra normalmente
                ocultarSugerencia();
                lista = exactos;
            } else {
                // 2) Sin resultados exactos → búsqueda difusa con Levenshtein
                const difusos = lista.filter(p =>
                    coincideDifuso(query, p.nombre) || coincideDifuso(query, p.descripcion) || coincideDifuso(query, p.categoria)
                );

                if (difusos.length > 0) {
                    mostrarSugerencia(query);
                    lista = difusos;
                } else {
                    ocultarSugerencia();
                    lista = [];
                }
            }
        } else {
            ocultarSugerencia();
        }

        renderizarProductos(lista);
    }

    function mostrarSugerencia(query) {
        let hint = document.getElementById('busqueda-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.id = 'busqueda-hint';
            hint.style.cssText = 'color:#FFAEC9; font-size:13px; margin: 4px 0 0 0; font-style:italic;';
            const buscador = document.getElementById('buscador');
            if (buscador) buscador.parentNode.insertBefore(hint, buscador.nextSibling);
        }
        hint.textContent = `🔍 Mostrando resultados aproximados para "${query}"`;
    }

    function ocultarSugerencia() {
        const hint = document.getElementById('busqueda-hint');
        if (hint) hint.remove();
    }


    window.filtrarPor = function (categoria) {
        window._categoriaActiva = categoria;
        const query = (document.getElementById('buscador')?.value || '').toLowerCase().trim();
        aplicarFiltros(query, categoria);
    };

    // Funcionalidad de Sesión
    const botonesContainer = document.querySelector('.botones');
    const userSession = localStorage.getItem('userSession');

    if (botonesContainer && userSession && userSession !== "undefined") {
        try {
            const user = JSON.parse(userSession);
            botonesContainer.innerHTML = `
                <style>
                    .btn-bonito {
                        background: linear-gradient(135deg, #111111 0%, #FFAEC9 100%);
                        color: #ffffff !important;
                        font-weight: 800;
                        padding: 10px 22px;
                        border-radius: 30px;
                        text-decoration: none;
                        border: 1px solid #FFAEC9;
                        box-shadow: 0 4px 15px rgba(255, 174, 201, 0.4);
                        font-family: 'Inter', sans-serif;
                        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        text-shadow: 0px 1px 3px rgba(0,0,0,0.8);
                    }
                    .btn-bonito:hover {
                        transform: translateY(-3px) scale(1.03);
                        box-shadow: 0 6px 20px rgba(255, 174, 201, 0.7);
                        color: #ffffff !important;
                        background: linear-gradient(135deg, #1a1a1a 0%, #ff8cb3 100%);
                        border-color: #fff;
                    }
                    .btn-bonito:active {
                        transform: translateY(1px);
                    }
                </style>
                <div style="display: flex; align-items: center; gap: 15px; background: rgba(17,17,17,0.7); backdrop-filter: blur(5px); padding: 5px 20px; border-radius: 30px; border: 1px solid #FFAEC9;">
                    <img src="${user.profile_pic || 'logo_mini.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; background: white; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="Haz click para cambiar tu foto de perfil" onclick="cambiarFotoPerfil()" onerror="this.src='logo_mini.png'">
                    <span style="color: white; font-weight: bold; font-size: 14px;">Hola, ${user.name || 'Usuario'}</span>
                    <button onclick="cerrarSesion()" style="background: none; color: #FFAEC9; border: none; cursor: pointer; font-size: 13px; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#ff5e91'" onmouseout="this.style.color='#FFAEC9'">Salir</button>
                </div>
                <a href="agregar_producto.html" class="btn-bonito">✨ Añadir Producto</a>
            `;
        } catch (e) {
            console.error("Error al leer sesión:", e);
            localStorage.removeItem('userSession');
        }
    }

    window.cerrarSesion = function () {
        localStorage.removeItem('userSession');
        window.location.reload();
    };

    window.cambiarFotoPerfil = async function () {
        const nuevaFoto = prompt("Ingresa la URL de tu nueva foto de perfil:");
        if (!nuevaFoto) return;

        try {
            const userSessionStr = localStorage.getItem('userSession');
            if (!userSessionStr || userSessionStr === "undefined") return;

            const user = JSON.parse(userSessionStr);
            const response = await fetch(`${API_URL}/api/users/profile_pic`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, profile_pic: nuevaFoto })
            });

            const result = await response.json();
            if (result.success) {
                user.profile_pic = nuevaFoto;
                localStorage.setItem('userSession', JSON.stringify(user));
                window.location.reload();
            } else {
                alert('Error: ' + result.msg);
            }
        } catch (e) {
            console.error(e);
            alert('Error al intentar cambiar la foto de perfil.');
        }
    };

    // Buscador - usa 'buscador' (id correcto del HTML)
    const searchInput = document.getElementById('buscador');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            aplicarFiltros(query, window._categoriaActiva);
        });
    }

    window.toggleDesc = function (id) {
        const data = window.productosData[id];
        const textSpan = document.getElementById('text-' + id);
        const toggleBtn = document.getElementById('toggle-' + id);

        if (!data || !textSpan || !toggleBtn) return;

        if (toggleBtn.innerText === 'Ver más') {
            textSpan.innerText = data.full;
            toggleBtn.innerText = 'Ver menos';
        } else {
            textSpan.innerText = data.short;
            toggleBtn.innerText = 'Ver más';
        }
    };

    window.borrarProducto = async function (id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto definitivamente de la tienda?')) {
            try {
                let userEmail = null;
                const userSessionStr = localStorage.getItem('userSession');
                if (userSessionStr && userSessionStr !== "undefined") {
                    try { userEmail = JSON.parse(userSessionStr).email; } catch (e) { }
                }

                const response = await fetch(`${API_URL}/api/products/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_email: userEmail })
                });
                const result = await response.json();
                if (result.success) {
                    cargarProductos(); // Recargar la tabla si tuvo éxito
                } else {
                    alert('Error: ' + result.msg);
                }
            } catch (error) {
                console.error(error);
                alert('Hubo un error de conexión al intentar borrar.');
            }
        }
    };

    // Ejecutar al instante cuando la página cargue
    cargarProductos();

    // ── Función de compra directa ───────────────────────────────────────────
    window.comprarProducto = function (id, nombre, precio) {
        // Verificar sesión
        const sessionStr = localStorage.getItem('userSession');
        if (!sessionStr || sessionStr === 'undefined') {
            mostrarModalCompra(null, nombre, precio, id);
            return;
        }
        let user;
        try { user = JSON.parse(sessionStr); } catch (e) {
            window.location.href = 'login.html';
            return;
        }
        mostrarModalCompra(user, nombre, precio, id);
    };

    function mostrarModalCompra(user, nombre, precio, id) {
        const prev = document.getElementById('modal-compra');
        if (prev) prev.remove();

        if (!user) {
            // Sin sesión → modal de login
            const modal = document.createElement('div');
            modal.id = 'modal-compra';
            modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `<div style="background:#111;border:2px solid #FFAEC9;border-radius:16px;padding:32px 36px;max-width:380px;width:90%;text-align:center;box-shadow:0 0 40px rgba(255,174,201,0.3);color:white;font-family:'Inter',sans-serif;">
                <div style="font-size:44px;margin-bottom:10px;">🔒</div>
                <h2 style="color:#FFAEC9;margin-bottom:10px;">Inicia sesión primero</h2>
                <p style="color:#ccc;margin-bottom:24px;">Necesitas una cuenta para comprar en Black Market.</p>
                <button id="btn-ir-login" style="background:linear-gradient(135deg,#111,#FFAEC9);color:white;border:none;border-radius:30px;padding:12px 30px;font-weight:bold;font-size:15px;cursor:pointer;width:100%;margin-bottom:10px;">Iniciar sesión</button>
                <button id="btn-cancelar-compra" style="background:none;color:#888;border:none;cursor:pointer;font-size:13px;text-decoration:underline;">Cancelar</button>
            </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
            document.getElementById('btn-cancelar-compra').addEventListener('click', () => modal.remove());
            document.getElementById('btn-ir-login').addEventListener('click', () => { window.location.href = 'login.html'; });
            return;
        }

        // Con sesión → modal de pago con tarjeta
        const modal = document.createElement('div');
        modal.id = 'modal-compra';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';

        modal.innerHTML = `
        <div id="panel-pago" style="background:#111;border:2px solid #FFAEC9;border-radius:20px;padding:28px 30px;max-width:420px;width:100%;box-shadow:0 0 50px rgba(255,174,201,0.25);color:white;font-family:'Inter',sans-serif;">

            <!-- Encabezado -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <h2 style="margin:0;font-size:18px;color:#FFAEC9;">💳 Pago seguro</h2>
                <button id="btn-cerrar-modal" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">✕</button>
            </div>

            <!-- Resumen del producto -->
            <div style="background:#1a1a1a;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:14px;color:#ccc;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nombre}</span>
                <span style="font-weight:bold;color:#FFAEC9;font-size:17px;white-space:nowrap;">$${precio}</span>
            </div>

            <!-- Vista previa de la tarjeta -->
            <div id="card-preview" style="
                background:linear-gradient(135deg,#1a1a2e 0%,#880015 60%,#FFAEC9 120%);
                border-radius:14px;padding:20px 22px;margin-bottom:20px;
                box-shadow:0 8px 24px rgba(136,0,21,0.5);position:relative;height:160px;
                display:flex;flex-direction:column;justify-content:space-between;
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:22px;">💳</div>
                    <div style="font-size:12px;letter-spacing:1px;color:rgba(255,255,255,0.7);font-weight:bold;" id="card-tipo">BLACK MARKET</div>
                </div>
                <div id="card-num-display" style="font-size:19px;letter-spacing:4px;font-weight:bold;color:white;text-shadow:0 1px 4px rgba(0,0,0,0.6);">•••• •••• •••• ••••</div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                    <div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Titular</div>
                        <div id="card-name-display" style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:white;">NOMBRE APELLIDO</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:9px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Vence</div>
                        <div id="card-exp-display" style="font-size:13px;font-weight:bold;color:white;">MM/AA</div>
                    </div>
                </div>
            </div>

            <!-- Formulario -->
            <div style="display:flex;flex-direction:column;gap:12px;">

                <div>
                    <label style="font-size:11px;color:#FFAEC9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">Número de tarjeta</label>
                    <input id="inp-card-num" maxlength="19" placeholder="1234 5678 9012 3456" style="
                        width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;border-radius:8px;
                        color:white;padding:10px 14px;font-size:16px;letter-spacing:2px;outline:none;
                        transition:border-color 0.2s;
                    ">
                </div>

                <div>
                    <label style="font-size:11px;color:#FFAEC9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">Nombre del titular</label>
                    <input id="inp-card-name" placeholder="Como aparece en la tarjeta" style="
                        width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;border-radius:8px;
                        color:white;padding:10px 14px;font-size:14px;outline:none;transition:border-color 0.2s;
                    ">
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <label style="font-size:11px;color:#FFAEC9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">Fecha de vencimiento</label>
                        <input id="inp-card-exp" placeholder="MM/AA" maxlength="5" style="
                            width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;border-radius:8px;
                            color:white;padding:10px 14px;font-size:14px;outline:none;transition:border-color 0.2s;
                        ">
                    </div>
                    <div>
                        <label style="font-size:11px;color:#FFAEC9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">CVV</label>
                        <input id="inp-card-cvv" placeholder="•••" maxlength="3" type="password" style="
                            width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;border-radius:8px;
                            color:white;padding:10px 14px;font-size:14px;outline:none;transition:border-color 0.2s;
                        ">
                    </div>
                </div>

                ${!user.phone ? `
                <div style="margin-top:4px;">
                    <label style="font-size:11px;color:#FFAEC9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">Número de WhatsApp</label>
                    <input id="inp-card-phone" placeholder="Ej: 573001234567" style="
                        width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;border-radius:8px;
                        color:white;padding:10px 14px;font-size:14px;outline:none;transition:border-color 0.2s;
                    ">
                </div>
                ` : ''}

                <button id="btn-pagar" style="
                    background:linear-gradient(135deg,#880015,#FFAEC9);color:white;
                    border:none;border-radius:30px;padding:14px;font-weight:bold;font-size:16px;
                    cursor:pointer;width:100%;margin-top:4px;letter-spacing:0.5px;
                    transition:transform 0.2s,box-shadow 0.2s;
                ">🔐 Pagar $${precio}</button>

                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;justify-content:center;">
                    <input type="checkbox" id="chk-guardar-tarjeta" checked style="accent-color:#FFAEC9;width:15px;height:15px;cursor:pointer;">
                    <span style="color:#aaa;font-size:12px;">Guardar datos para próximas compras</span>
                </label>

                <p style="text-align:center;color:#555;font-size:11px;margin:0;">🔒 Tus datos están protegidos con encriptación SSL</p>
            </div>
        </div>`;

        document.body.appendChild(modal);

        // ── Cargar datos guardados si existen ──────────────────────────────
        const savedKey = `cardData_${user.email}`;
        const savedCard = JSON.parse(localStorage.getItem(savedKey) || 'null');
        if (savedCard) {
            // Rellenar campos
            const numInput = document.getElementById('inp-card-num');
            const nameInput = document.getElementById('inp-card-name');
            const expInput = document.getElementById('inp-card-exp');
            const cvvInput = document.getElementById('inp-card-cvv');

            numInput.value = savedCard.num;
            nameInput.value = savedCard.name;
            expInput.value = savedCard.exp;
            cvvInput.value = savedCard.cvv;

            // Actualizar la vista previa de la tarjeta
            const numRaw = savedCard.num.replace(/\s/g, '');
            const disp = numRaw.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
            document.getElementById('card-num-display').textContent = disp;
            document.getElementById('card-name-display').textContent = savedCard.name.toUpperCase();
            document.getElementById('card-exp-display').textContent = savedCard.exp;
            const tipo = numRaw[0] === '4' ? 'VISA' : numRaw[0] === '5' ? 'MASTERCARD' : numRaw.startsWith('34') || numRaw.startsWith('37') ? 'AMEX' : 'BLACK MARKET';
            document.getElementById('card-tipo').textContent = tipo;

            // Badge de "datos guardados"
            const badge = document.createElement('div');
            badge.style.cssText = 'background:#1a1a1a;border:1px solid #FFAEC9;border-radius:20px;padding:4px 12px;font-size:11px;color:#FFAEC9;text-align:center;margin-bottom:4px;';
            badge.textContent = '✅ Datos de tarjeta guardados cargados';
            document.getElementById('inp-card-num').parentNode.parentNode.insertBefore(badge, document.getElementById('inp-card-num').parentNode);
        }

        // Cerrar
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.getElementById('btn-cerrar-modal').addEventListener('click', () => modal.remove());

        // Focus styles
        modal.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('focus', () => inp.style.borderColor = '#FFAEC9');
            inp.addEventListener('blur', () => inp.style.borderColor = '#333');
        });

        // Live: número de tarjeta (formatea en grupos de 4)
        document.getElementById('inp-card-num').addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '').substring(0, 16);
            this.value = v.replace(/(.{4})/g, '$1 ').trim();
            const disp = v.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
            document.getElementById('card-num-display').textContent = disp;
            // Detectar tipo de tarjeta
            const tipo = v[0] === '4' ? 'VISA' : v[0] === '5' ? 'MASTERCARD' : v.startsWith('34') || v.startsWith('37') ? 'AMEX' : 'BLACK MARKET';
            document.getElementById('card-tipo').textContent = tipo;
        });

        // Live: nombre
        document.getElementById('inp-card-name').addEventListener('input', function () {
            document.getElementById('card-name-display').textContent = this.value.toUpperCase() || 'NOMBRE APELLIDO';
        });

        // Live: fecha (auto-inserta /)
        document.getElementById('inp-card-exp').addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '');
            if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2, 4);
            this.value = v;
            document.getElementById('card-exp-display').textContent = v || 'MM/AA';
        });

        // Botón pagar
        document.getElementById('btn-pagar').addEventListener('click', async function () {
            const num = document.getElementById('inp-card-num').value.replace(/\s/g, '');
            const name = document.getElementById('inp-card-name').value.trim();
            const exp = document.getElementById('inp-card-exp').value.trim();
            const cvv = document.getElementById('inp-card-cvv').value.trim();
            const phone = document.getElementById('inp-card-phone')?.value.trim() || user.phone;

            if (num.length < 16) { resaltarError('inp-card-num'); return; }
            if (name.length < 3) { resaltarError('inp-card-name'); return; }
            if (!/^\d{2}\/\d{2}$/.test(exp)) { resaltarError('inp-card-exp'); return; }
            if (cvv.length < 3) { resaltarError('inp-card-cvv'); return; }
            if (!phone || phone.length < 7) {
                if (document.getElementById('inp-card-phone')) resaltarError('inp-card-phone');
                else alert('Error: No se encontró número de teléfono.');
                return;
            }

            this.disabled = true;
            this.textContent = '⏳ Procesando pago...';

            // Simular pequeño delay de procesamiento
            await new Promise(r => setTimeout(r, 1800));

            try {
                const res = await fetch(`${API_URL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_email: user.email,
                        product_id: id,
                        product_nombre: nombre,
                        product_precio: precio,
                        phone: phone
                    })
                });
                const result = await res.json();
                if (result.success) {
                    // Guardar tarjeta si el checkbox está marcado
                    const guardar = document.getElementById('chk-guardar-tarjeta')?.checked;
                    if (guardar) {
                        localStorage.setItem(`cardData_${user.email}`, JSON.stringify({
                            num: document.getElementById('inp-card-num').value,
                            name: document.getElementById('inp-card-name').value,
                            exp: document.getElementById('inp-card-exp').value,
                            cvv: document.getElementById('inp-card-cvv').value
                        }));
                    }
                    document.getElementById('panel-pago').innerHTML = `
                        <div style="text-align:center;padding:20px 0;">
                            <div style="font-size:60px;margin-bottom:16px;animation:fadeIn 0.5s ease;">🎉</div>
                            <h2 style="color:#FFAEC9;margin-bottom:8px;">¡Pago aprobado!</h2>
                            <p style="color:#ccc;margin-bottom:6px;">${nombre}</p>
                            <p style="color:#FFAEC9;font-size:22px;font-weight:bold;margin-bottom:20px;">$${precio}</p>
                            
                            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">
                                <button id="btn-whatsapp-recibo" style="
                                    background:#25D366;color:white;border:none;border-radius:30px;
                                    padding:12px;font-weight:bold;font-size:14px;cursor:pointer;
                                    display:flex;align-items:center;justify-content:center;gap:8px;
                                ">
                                    <span style="font-size:18px;">💬</span> Ver recibo en WhatsApp
                                </button>
                                <button onclick="document.getElementById('modal-compra').remove()" style="
                                    background:none;color:#888;border:none;cursor:pointer;font-size:13px;text-decoration:underline;
                                ">Cerrar ventana</button>
                            </div>
                            
                            <p style="color:#555;font-size:11px;margin:0;">Se ha enviado un comprobante a tu correo: <br><strong>${user.email}</strong></p>
                        </div>`;

                    // Lógica del botón de WhatsApp
                    document.getElementById('btn-whatsapp-recibo')?.addEventListener('click', () => {
                        const msg = encodeURIComponent(`*RECIBO DE COMPRA - BLACK MARKET*\n\nHola ${result.userName},\nConfirmamos tu compra de:\n📦 *${nombre}*\n💰 Total: *$${precio}*\n\n¡Gracias por tu preferencia! 🛒`);

                        let rawPhone = result.phone ? result.phone.replace(/\D/g, '') : '';
                        // Si no tiene el 57 de Colombia, se lo ponemos para que no lo mande a otro país (+31)
                        if (rawPhone && !rawPhone.startsWith('57')) {
                            rawPhone = '57' + rawPhone;
                        }

                        window.open(`https://wa.me/${rawPhone}?text=${msg}`, '_blank');
                    });
                } else {
                    alert('Error: ' + result.msg);
                    modal.remove();
                }
            } catch (e) {
                alert('Error de conexión.');
                modal.remove();
            }
        });

        function resaltarError(id) {
            const el = document.getElementById(id);
            el.style.borderColor = '#ff4444';
            el.focus();
            setTimeout(() => el.style.borderColor = '#333', 2000);
        }
    }
}
