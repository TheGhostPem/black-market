const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('http://localhost:5000/api/login', {
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
      const response = await fetch('http://localhost:5000/api/register', {
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
        } catch(e) {}
    }

    try {
      const response = await fetch('http://localhost:5000/api/products', {
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
            const response = await fetch('http://localhost:5000/api/products');
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
        } catch (e) {}
        
        lista.forEach(producto => {
            const imagenSrc = producto.imagen ? producto.imagen : 'logo_mini.png'; // Imagen por defecto
            const descText = producto.descripcion || '';
            const isLong = descText.length > 70;
            const descCorta = isLong ? descText.substring(0, 70) + '...' : descText;
            
            window.productosData[producto.id] = { full: descText, short: descCorta };

            const descHTML = isLong 
                ? `<span id="text-${producto.id}">${descCorta}</span> <span id="toggle-${producto.id}" onclick="toggleDesc(${producto.id})" style="color: #FFAEC9; cursor: pointer; font-weight: bold; white-space: nowrap;">Ver más</span>`
                : `<span id="text-${producto.id}">${descText}</span>`;

            const showDelete = currentUserEmail && producto.user_email === currentUserEmail;
            const deleteBtnHtml = showDelete 
                ? `<button onclick="borrarProducto(${producto.id})" class="btn-borrar" style="background-color: #880015; color: white; border: none; border-radius: 30px; padding: 0 15px; font-size: 14px; cursor: pointer;" title="Eliminar Producto">❌</button>` 
                : '';

            const card = document.createElement('div');
            card.className = 'producto-card';
            card.innerHTML = `
                <img src="${imagenSrc}" alt="${producto.nombre}" onerror="this.src='logo_mini.png'">
                <div class="categoria">${producto.categoria}</div>
                <h3>${producto.nombre}</h3>
                <div class="descripcion" id="desc-container-${producto.id}">${descHTML}</div>
                <div class="precio">$${producto.precio}</div>
                <div class="card-buttons" style="display: flex; gap: 10px; width: 100%;">
                    <button style="flex: 1;">Comprar</button>
                    ${deleteBtnHtml}
                </div>
            `;
            catalogoContainer.appendChild(card);
        });
    }

    window.filtrarPor = function(categoria) {
        if (!window.todosLosProductos) return;
        if (categoria === 'Todos') {
            renderizarProductos(window.todosLosProductos);
        } else {
            const filtrados = window.todosLosProductos.filter(p => p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase());
            renderizarProductos(filtrados);
        }
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
                    <img src="${user.profile_pic || 'logo_mini.png'}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; background: white;" onerror="this.src='logo_mini.png'">
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

    window.cerrarSesion = function() {
        localStorage.removeItem('userSession');
        window.location.reload();
    };

    // Funcionalidad de Buscador Inteligente
    const searchInput = document.getElementById('buscar');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (!window.todosLosProductos) return;
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderizarProductos(window.todosLosProductos); // Restaurar si está vacío
                return;
            }

            // Diccionario de sinónimos mágicos
            const mapCategorias = {
                'mause': 'ratones', 'mouse': 'ratones', 'raton': 'ratones',
                'pc': 'cpu', 'compu': 'cpu', 'computadora': 'cpu', 'computador': 'cpu',
                'laptop': 'portatiles', 'portatil': 'portatiles', 'notebook': 'portatiles',
                'audifonos': 'auriculares', 'cascos': 'auriculares',
                'monitor': 'pantallas', 'tele': 'pantallas', 'tv': 'pantallas'
            };

            const categoriaBuscada = mapCategorias[query];

            const filtrados = window.todosLosProductos.filter(p => {
                // Filtra por sinónimos
                if (categoriaBuscada && p.categoria && p.categoria.toLowerCase() === categoriaBuscada) return true;
                
                // Filtra por nombre u descripción si incluyen la palabra
                const matchNombre = p.nombre && p.nombre.toLowerCase().includes(query);
                const matchDesc = p.descripcion && p.descripcion.toLowerCase().includes(query);
                
                return matchNombre || matchDesc;
            });
            renderizarProductos(filtrados);
        });
    }

    window.toggleDesc = function(id) {
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

    window.borrarProducto = async function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto definitivamente de la tienda?')) {
            try {
                let userEmail = null;
                const userSessionStr = localStorage.getItem('userSession');
                if (userSessionStr && userSessionStr !== "undefined") {
                    try { userEmail = JSON.parse(userSessionStr).email; } catch(e){}
                }

                const response = await fetch(`http://localhost:5000/api/products/${id}`, { 
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
}
