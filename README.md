# 🏢 Sistema de Control Interno - Suministro y Servicios RJD

**Sistema web profesional** para el control interno de servicios técnicos especializados en reparación y mantenimiento de equipos de computación (laptops, PC, impresoras y plotters).

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

## 🎯 Estado del Proyecto

### ✅ FASE 1: INFRAESTRUCTURA (100% Completada)

- [x] **Proyecto Next.js 15** con TypeScript
- [x] **Base de datos PostgreSQL** con Prisma ORM
- [x] **Autenticación NextAuth.js** con roles diferenciados
- [x] **Layout responsive** con tema oscuro profesional
- [x] **Variables de entorno** y configuración completa

### ✅ FASE 2.1: CRUD DE CLIENTES (100% Completada)

- [x] **API Routes completas** (GET, POST, PUT, DELETE)
- [x] **Formularios con validación** en tiempo real
- [x] **Tabla profesional** con ordenamiento y filtros
- [x] **Acciones directas** (ver, editar, eliminar)
- [x] **Búsqueda avanzada** por nombre, teléfono, RUC
- [x] **Paginación funcional** con navegación
- [x] **Validaciones peruanas** (teléfono y RUC)
- [x] **Manejo de errores** y notificaciones toast

### 🔄 FASE 2.2: CRUD DE TÉCNICOS (Siguiente)

- [ ] Gestión completa de usuarios técnicos
- [ ] Control de disponibilidad y especialidades
- [ ] Asignación de equipos y carga de trabajo

### 🔄 FASE 3: GESTIÓN DE EQUIPOS (Pendiente)

- [ ] Registro de equipos con código único
- [ ] Estados y flujo de reparación
- [ ] Asignación automática a técnicos
- [ ] Comprobantes de ingreso

## 🛠️ Stack Tecnológico

### **Frontend**

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático y desarrollo robusto
- **Tailwind CSS** - Styling moderno y responsive
- **Lucide React** - Iconos profesionales
- **React Query (TanStack)** - Gestión de estado del servidor

### **Backend**

- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Manejo de base de datos tipado
- **NextAuth.js** - Autenticación y autorización
- **Zod** - Validación de esquemas

### **Base de Datos**

- **PostgreSQL** - Base de datos principal
- **Supabase** - Hosting de base de datos
- **Prisma Client** - ORM generado automáticamente

### **Herramientas de Desarrollo**

- **ESLint & Prettier** - Linting y formateo
- **Git** - Control de versiones
- **Vercel** - Deployment y hosting

## 🚀 Instalación y Configuración

### **Prerrequisitos**

- Node.js 18+ LTS
- Git
- Cuenta en Supabase (para base de datos)

### **1. Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/sistema-rjd.git
cd sistema-rjd
```

### **2. Instalar dependencias**

```bash
npm install
```

### **3. Configurar variables de entorno**

Crear archivo `.env.local`:

```env
# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_SECRET="tu-secret-muy-largo-y-seguro"
NEXTAUTH_URL="http://localhost:3000"

# Opcional: Configuración de sesiones
NEXTAUTH_SESSION_DURATION=86400
```

### **4. Configurar base de datos**

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate dev

# Seedear datos iniciales (opcional)
npx prisma db seed
```

### **5. Ejecutar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Acceso al Sistema

### **Usuario Administrador (Por defecto)**

- **Email:** `admin@rjd.com`
- **Contraseña:** `admin123`
- **Rol:** ADMINISTRADOR
- **Permisos:** Acceso completo a todas las funcionalidades

### **Usuarios Técnicos**

- **Rol:** TECNICO
- **Permisos:** Solo acceso al módulo de estados de equipos

## 🎨 Características Destacadas

### **🎯 Gestión de Clientes**

- ✅ **CRUD completo** con validaciones
- ✅ **Tabla profesional** con ordenamiento por columnas
- ✅ **Filtros avanzados** por estado y búsqueda
- ✅ **Acciones directas** con colores distintivos
- ✅ **Paginación** con navegación intuitiva
- ✅ **Validaciones peruanas** para teléfono (9 dígitos) y RUC (11 dígitos)

### **🔐 Sistema de Autenticación**

- ✅ **Roles diferenciados** (Administrador/Técnico)
- ✅ **Protección de rutas** por permisos
- ✅ **Sesiones persistentes** con expiración configurable
- ✅ **Middleware de seguridad** automático

### **🎨 Interfaz de Usuario**

- ✅ **Tema oscuro profesional** con paleta azul/púrpura
- ✅ **Componentes reutilizables** y modulares
- ✅ **Responsive design** para móvil, tablet y desktop
- ✅ **Transiciones suaves** y efectos de hover
- ✅ **Notificaciones toast** para feedback del usuario

### **⚡ Performance y Optimización**

- ✅ **React Query** para cache inteligente
- ✅ **Componentes optimizados** sin re-renders innecesarios
- ✅ **Lazy loading** y code splitting
- ✅ **Validación en cliente y servidor**

## 📊 Estructura del Proyecto

```
sistema-rjd/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/
│   │   │   ├── 📁 auth/[...nextauth]/    # Autenticación NextAuth
│   │   │   └── 📁 clients/               # API endpoints de clientes
│   │   ├── 📁 dashboard/
│   │   │   ├── 📁 clientes/              # Página de gestión de clientes
│   │   │   └── 📄 layout.tsx             # Layout del dashboard
│   │   ├── 📄 layout.tsx                 # Layout principal
│   │   └── 📄 providers.tsx              # Providers globales
│   ├── 📁 components/
│   │   └── 📁 clients/                   # Componentes de clientes
│   │       ├── 📄 ClientForm.tsx         # Formulario de cliente
│   │       ├── 📄 ClientTable.tsx        # Tabla de clientes
│   │       ├── 📄 ConfirmModal.tsx       # Modal de confirmación
│   │       └── 📄 Pagination.tsx         # Componente de paginación
│   ├── 📁 hooks/
│   │   └── 📄 useClients.ts              # Hook personalizado para clientes
│   ├── 📁 lib/
│   │   ├── 📄 auth.ts                    # Configuración NextAuth
│   │   ├── 📄 prisma.ts                  # Cliente Prisma
│   │   └── 📁 validations/
│   │       └── 📄 client.ts              # Validaciones Zod
│   ├── 📁 types/
│   │   └── 📄 client.ts                  # Tipos TypeScript
│   └── 📁 styles/
│       └── 📄 globals.css                # Estilos globales
├── 📄 prisma/schema.prisma               # Esquema de base de datos
├── 📄 next.config.js                     # Configuración Next.js
├── 📄 tailwind.config.ts                 # Configuración Tailwind
└── 📄 package.json                       # Dependencias y scripts
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint

# Base de datos
npx prisma generate  # Generar cliente Prisma
npx prisma migrate dev # Aplicar migraciones en desarrollo
npx prisma studio    # Abrir Prisma Studio (GUI de BD)

# Utilidades
npm run clean        # Limpiar cache de Next.js
```

## 🎯 Próximas Características

### **FASE 2.2: Gestión de Técnicos**

- [ ] CRUD completo de usuarios técnicos
- [ ] Sistema de especialidades y habilidades
- [ ] Control de disponibilidad y carga de trabajo
- [ ] Dashboard de productividad

### **FASE 3: Gestión de Equipos**

- [ ] Registro con código único alfanumérico (RJD-YMD-NNNN)
- [ ] Estados: Recibido → Reparación → Reparado → Entregado
- [ ] Asignación automática de técnicos
- [ ] Comprobantes de ingreso automáticos
- [ ] Sistema de notificaciones

### **FASE 4: Gestión Financiera**

- [ ] Control de ingresos y egresos
- [ ] Adelantos y saldos pendientes
- [ ] Reportes de rentabilidad
- [ ] Análisis por período

### **FASE 5: Reportes y Analytics**

- [ ] Dashboard ejecutivo con KPIs
- [ ] Reportes operativos y financieros
- [ ] Análisis de tendencias
- [ ] Exportación de datos

## 🤝 Contribución

### **Flujo de Desarrollo**

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m "feat: descripción"`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### **Estándares de Código**

- **Conventional Commits** para mensajes
- **ESLint** configurado con reglas estrictas
- **TypeScript strict mode** habilitado
- **Prettier** para formateo automático

## 📝 Changelog

### **v0.2.0** - CRUD Clientes Completo (Actual)

- ✅ Sistema completo CRUD de clientes
- ✅ Tabla profesional con acciones directas
- ✅ Validaciones peruanas (teléfono/RUC)
- ✅ API routes con manejo de errores
- ✅ Formularios optimizados sin cascading renders
- ✅ Fix para Next.js 15 (params como Promise)

### **v0.1.0** - Infraestructura Base

- ✅ Proyecto Next.js 15 + TypeScript
- ✅ Autenticación con NextAuth.js
- ✅ Base de datos con Prisma ORM
- ✅ Layout profesional responsive
- ✅ Configuración inicial completa

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para preguntas, problemas o sugerencias:

- 📧 **Email:** soporte@rjdsuministros.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/tu-usuario/sistema-rjd/issues)
- 📖 **Documentación:** [Wiki del Proyecto](https://github.com/tu-usuario/sistema-rjd/wiki)

---

**Desarrollado con ❤️ para Suministro y Servicios RJD**
