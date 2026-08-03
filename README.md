# HGW — Salud y Bienestar

Plataforma web tipo e-commerce híbrido para productos de salud y bienestar. Combina un catálogo público con un panel administrativo completo. Los pedidos se gestionan manualmente vía WhatsApp.

## Tecnologías

### Frontend
- **React 18** + **TypeScript 5** — UI framework con tipado estricto
- **Vite 5** — Build tool ultrarrápido
- **TailwindCSS 3** — Estilos utilitarios con diseño mobile-first
- **React Router DOM 6** — Enrutamiento SPA
- **Zustand 4** — Estado global (auth + carrito)
- **TanStack Query 5** — Server state y caché
- **React Hook Form 7** + **Zod 3** — Formularios con validación
- **Axios** — HTTP client
- **react-hot-toast** — Notificaciones toast

### Backend
- **NestJS 10** — Framework backend modular
- **TypeScript 5** — Tipado estricto
- **Prisma ORM 5** — ORM moderno para base de datos
- **SQLite** — Base de datos embebida (sin servidor)
- **JWT (jsonwebtoken)** — Autenticación stateless
- **Bcrypt** — Hashing de contraseñas
- **Multer** — Subida de archivos
- **Class Validator / Class Transformer** — Validación de DTOs

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

## Instalación paso a paso

```bash
# 1. Ir al directorio del proyecto
cd hgw-platform

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Inicializar base de datos
npx prisma generate
npx prisma migrate dev --name init

# 5. Cargar datos iniciales (admin + productos de ejemplo)
npm run seed

# 6. Iniciar backend
npm run dev

# 7. En otra terminal — instalar dependencias del frontend
cd ../frontend
npm install

# 8. Configurar variables de entorno del frontend
cp .env.example .env
# Editar VITE_WHATSAPP_NUMBER con tu número

# 9. Iniciar frontend
npm run dev
```

## URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend público | http://localhost:5173 |
| Panel admin | http://localhost:5173/admin/dashboard |
| API backend | http://localhost:3000/api |
| Archivos estáticos | http://localhost:3000/uploads |

## Credenciales iniciales

```
Admin:
  Email:    admin@hgw.com  (configurable en .env)
  Password: Admin123!      (configurable en .env)
```

## Variables de entorno

### Backend

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Ruta a la base de datos SQLite | `file:./dev.db` |
| `JWT_SECRET` | Clave secreta para firmar JWT | `mi_clave_secreta_larga` |
| `JWT_EXPIRES_IN` | Duración del token JWT | `7d` |
| `ADMIN_EMAIL` | Email del administrador inicial | `admin@tudominio.com` |
| `ADMIN_PASSWORD` | Contraseña del admin inicial | `Admin123!` |
| `ADMIN_NAME` | Nombre del administrador inicial | `Administrador` |
| `WHATSAPP_NUMBER` | Número WhatsApp con código de país | `573208228748` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |

### Frontend

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |
| `VITE_WHATSAPP_NUMBER` | Número WhatsApp | `573208228748` |

## Estructura del proyecto

```
hgw-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Modelos de base de datos
│   │   └── seed.ts          # Seed automático
│   ├── src/
│   │   ├── auth/            # Autenticación JWT
│   │   ├── users/           # Gestión de usuarios (admin)
│   │   ├── products/        # CRUD de productos
│   │   ├── categories/      # CRUD de categorías
│   │   ├── reviews/         # Reseñas y moderación
│   │   ├── orders/          # Pedidos
│   │   ├── uploads/         # Subida de imágenes
│   │   ├── common/          # Guards, decorators, filtros
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── prisma.service.ts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/      # Landing, Catálogo, Detalle, Carrito, Auth, Perfil
│   │   │   └── admin/       # Dashboard, Productos, Categorías, Reseñas, Pedidos, Usuarios
│   │   ├── components/
│   │   │   ├── ui/          # Button, Input, Modal, Pagination, etc.
│   │   │   ├── catalog/     # ProductCard
│   │   │   ├── chatbot/     # Chatbot de preguntas frecuentes
│   │   │   └── layout/      # Componentes de layout
│   │   ├── services/        # Axios services por módulo
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── store/           # Zustand stores (auth + cart)
│   │   ├── layouts/         # PublicLayout, AdminLayout
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # WhatsApp utilities
│   ├── .env
│   └── package.json
└── README.md
```

## Arquitectura

### Frontend/Backend

La aplicación sigue una arquitectura cliente-servidor clásica:

- **Frontend** (React + Vite): SPA que se comunica con el backend via REST API. El enrutamiento es del lado del cliente con React Router.
- **Backend** (NestJS): API REST modular con autenticación JWT. Cada funcionalidad es un módulo independiente.

### Autenticación

1. El usuario se registra o inicia sesión
2. El backend valida credenciales y devuelve un JWT
3. El frontend almacena el token en localStorage (Zustand persist)
4. Cada petición incluye el token en el header `Authorization: Bearer <token>`
5. El backend verifica el token con Passport.js + JWT Strategy
6. Los roles (USER/ADMIN) se verifican con un RolesGuard

### Sistema de pedidos por WhatsApp

1. El usuario agrega productos al carrito (persistente en localStorage)
2. Al hacer checkout, se registra el pedido en la base de datos
3. Se genera un mensaje de WhatsApp con el detalle del pedido
4. Se abre WhatsApp Web/app con el mensaje predefinido
5. El administrador gestiona el pedido manualmente desde el panel admin

## Funcionalidades

- Catálogo de productos con filtros (categoría, búsqueda, ordenamiento)
- Carrito de compras persistente (localStorage)
- Generación automática de pedidos vía WhatsApp
- Reseñas y calificaciones con moderación (PENDING → APPROVED)
- Panel administrativo completo (Dashboard, CRUD, moderación)
- Subida y gestión de imágenes (hasta 5 por producto)
- Autenticación con roles (USER / ADMIN)
- Chatbot de preguntas frecuentes (FAQ interactivo)
- Diseño mobile-first responsive
- Landing page con productos destacados

## Licencia

MIT
