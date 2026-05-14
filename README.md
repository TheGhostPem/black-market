# 🛒 Black Market — Tienda E-Commerce

> Plataforma de compra y venta de productos tecnológicos y electrodomésticos, con autenticación real, pasarela de pago simulada y notificaciones por correo.

---

## 📌 Descripción

**Black Market** es una aplicación web full-stack de tipo e-commerce enfocada en la compra/venta de **tecnología y electrodomésticos**. Permite a los usuarios registrarse, iniciar sesión (de forma tradicional o con Google), publicar productos, comprarlos y recibir facturas por correo electrónico.

---

## 🧱 Arquitectura del Proyecto

```
proyecto estudio/
│
├── index.html              # Página de inicio / Bienvenida
├── login.html              # Página de inicio de sesión y registro
├── pagina.html             # Catálogo de productos (tienda principal)
├── agregar_producto.html   # Formulario para publicar un producto
│
├── script.js               # Lógica del frontend (sesión, catálogo, pago, búsqueda)
├── index.css               # Estilos globales
├── pagina.css              # Estilos específicos de la tienda
│
├── logo black market.png   # Logo oficial
├── logo_mini.png           # Avatar por defecto de usuarios
│
└── server/
    ├── app.js              # Servidor principal (Express + MySQL + Nodemailer)
    ├── package.json        # Dependencias del backend
    ├── .env                # Variables de entorno (NO subir a Git)
    └── .env.example        # Plantilla de variables de entorno
```

---

## ⚙️ Tecnologías Utilizadas

### Frontend
| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de las páginas |
| CSS3 (Vanilla) | Estilos, glassmorphism, animaciones |
| JavaScript (Vanilla) | Lógica de sesión, catálogo, pago y búsqueda |
| Google Identity API | Login con cuenta de Google |

### Backend
| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución |
| Express.js v5 | Framework del servidor REST |
| MySQL2 | Conexión a la base de datos |
| Nodemailer | Envío de correos de confirmación |
| google-auth-library | Verificación de tokens de Google |
| dotenv | Manejo de variables de entorno |
| nodemon | Recarga automática en desarrollo |
| CORS | Habilitación de peticiones cruzadas |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) con la base de datos `black_market` creada
- Una cuenta de Gmail con [contraseña de aplicación](https://myaccount.google.com/apppasswords) habilitada
- Un proyecto en [Google Cloud Console](https://console.cloud.google.com/) con OAuth 2.0 configurado

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/TheGhostPem/black-market.git
cd black-market
```

### 2. Configurar la base de datos MySQL

Crea la base de datos y las tablas necesarias ejecutando el siguiente SQL en MySQL Workbench (o tu cliente preferido):

```sql
CREATE DATABASE IF NOT EXISTS black_market;
USE black_market;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone_number VARCHAR(20),
    profile_pic VARCHAR(500) DEFAULT 'logo_mini.png'
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    imagen VARCHAR(500),
    user_email VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(150) NOT NULL,
    product_id INT,
    product_nombre VARCHAR(200),
    product_precio DECIMAL(10, 2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configurar las variables de entorno

Dentro de la carpeta `server/`, copia el archivo de ejemplo:

```bash
cd server
copy .env.example .env
```

Luego edita el archivo `.env` con tus credenciales reales:

```env
# Credenciales de correo (Gmail)
GMAIL_USER=tu_correo@gmail.com
GMAIL_PASS=tu_contraseña_de_aplicacion

# Client ID de tu proyecto de Google Cloud
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
```

> ⚠️ **Importante:** El archivo `.env` está en `.gitignore` y **nunca debe subirse al repositorio**.

### 4. Instalar dependencias del backend

```bash
# Desde la carpeta server/
npm install
```

### 5. Iniciar el servidor

```bash
npm run dev
```

El servidor se iniciará en: **`http://localhost:5000`**

La tienda principal estará disponible en: **`http://localhost:5000/pagina.html`**

---

## 🔌 Endpoints de la API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Verifica que el servidor está activo |
| `POST` | `/api/register` | Registra un nuevo usuario |
| `POST` | `/api/login` | Inicia sesión con email y contraseña |
| `POST` | `/api/google-login` | Inicia sesión con cuenta de Google |
| `PUT` | `/api/users/profile_pic` | Actualiza la foto de perfil del usuario |
| `GET` | `/api/products` | Obtiene todos los productos del catálogo |
| `POST` | `/api/products` | Publica un nuevo producto (con filtro de moderación) |
| `PUT` | `/api/products/:id` | Edita descripción y precio de un producto |
| `DELETE` | `/api/products/:id` | Elimina un producto (solo dueño o admin) |
| `POST` | `/api/orders` | Procesa una compra y envía correos de confirmación |

---

## ✨ Funcionalidades Principales

### 👤 Autenticación
- Registro con nombre, correo, contraseña y teléfono
- Login tradicional con email + contraseña
- **Login con Google** (OAuth2 verificado en el backend)
- Sesión persistente usando `localStorage`
- Cambio de foto de perfil (por URL)

### 🛍️ Catálogo de Productos
- Listado dinámico de productos desde la base de datos
- Filtro por **categorías** (Auriculares, Teclados, Ratones, CPU, etc.)
- **Búsqueda inteligente con algoritmo de Levenshtein** (tolera errores ortográficos)
- Sinónimos de categorías (`mouse` → `ratones`, `laptop` → `portátiles`, etc.)
- Expandir/colapsar descripciones largas con "Ver más / Ver menos"

### 🔐 Control de Roles
- Los **administradores** (`blackmarketcorreo@gmail.com`, `juanjoherrera022@gmail.com`) pueden editar y borrar cualquier producto
- Los **dueños** solo pueden editar/borrar sus propios productos
- El resto de usuarios solo pueden ver y comprar

### 🛡️ Moderación de Contenido
- Filtro automático en el backend que rechaza productos con contenido inapropiado (drogas, armas, contenido adulto, ropa, muebles, vehículos, etc.)
- Black Market solo acepta publicaciones de **electrónica y tecnología**

### 💳 Pasarela de Pago Simulada
- Modal de pago con **vista previa animada de la tarjeta en tiempo real**
- Detección automática del tipo de tarjeta (VISA, MASTERCARD, AMEX)
- Formateo automático del número (grupos de 4 dígitos)
- Guardado opcional de datos de tarjeta en `localStorage`
- Solicitud de número de WhatsApp en la primera compra

### 📧 Notificaciones por Correo (Nodemailer)
- **Al comprador:** Recibo HTML elegante con resumen del pedido, número de orden y fecha
- **Al vendedor:** Notificación automática con datos de contacto del comprador

---

## 👥 Roles y Permisos

| Rol | Ver productos | Comprar | Publicar | Editar (propio) | Editar (cualquiera) | Borrar (cualquiera) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Visitante (sin login) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Usuario registrado | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🗂️ Categorías Permitidas

- 🎧 Auriculares
- ⌨️ Teclados
- 🖱️ Ratones
- 🖥️ Monitores / Pantallas
- 💻 Portátiles
- 🖳 CPU / Computadores de escritorio
- 📱 Smartphones
- 🎮 Videojuegos / Consolas
- 🔌 Electrodomésticos

---

## 🔒 Seguridad

- Las contraseñas de usuarios de Google se generan aleatoriamente y nunca son expuestas
- Los tokens de Google se verifican **del lado del servidor** usando `google-auth-library`
- Las variables sensibles (credenciales de correo, Client ID de Google) están en `.env` y excluidas del control de versiones
- El servidor valida la propiedad del producto antes de permitir editar o borrar

---

## 📁 Variables de Entorno Requeridas

| Variable | Descripción |
|---|---|
| `GMAIL_USER` | Correo Gmail desde el cual se envían los recibos |
| `GMAIL_PASS` | Contraseña de aplicación de Gmail (no la contraseña normal) |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth 2.0 de Google Cloud Console |

---

## 👨‍💻 Autor

**TheGhost** — Proyecto de clase de desarrollo web full-stack.

- GitHub: [@TheGhostPem](https://github.com/TheGhostPem)
- Ubicación: Cartago, Valle, Colombia 🇨🇴

---

## 📄 Licencia

ISC — Libre para uso educativo.
