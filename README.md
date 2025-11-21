# 🔧 Sistema de Control Interno RJD

Sistema web para el control interno del servicio técnico "Suministro y Servicios RJD", especializado en reparación y mantenimiento de equipos de computación (laptops, PC, impresoras y plotters).

## 🚀 Estado Actual del Proyecto

### ✅ FASES COMPLETADAS

- **✅ FASE 0:** Preparación Inicial (100%)
- **✅ FASE 1.1:** Infraestructura y Base de Datos (100%)
- **✅ FASE 1.2:** Sistema de Autenticación (100%)
- **✅ FASE 1.3:** Layout Base y Dashboard (100%)

### 📊 Progreso General: ~70% de la infraestructura base

---

## 🛠️ Stack Tecnológico

### Frontend

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** con tema oscuro personalizado
- **NextAuth.js** para autenticación
- **Lucide React** para iconos

### Backend

- **Next.js API Routes**
- **Prisma ORM** con PostgreSQL
- **Supabase** como base de datos

### Deployment

- **Vercel** (configurado para deploy automático)

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── auth/signin/              # Login con tema oscuro
│   ├── dashboard/                # Panel principal
│   │   ├── page.tsx             # Dashboard principal ✨ NUEVO
│   │   ├── equipos/             # Gestión de equipos
│   │   ├── clientes/            # Gestión de clientes ✨ NUEVO
│   │   ├── finanzas/            # Control financiero
│   │   └── reportes/            # Centro de reportes
│   ├── layout.tsx               # Layout principal con tema oscuro
│   ├── page.tsx                 # Splash automática (3 seg)
│   └── custom-styles.css        # CSS personalizado tema oscuro
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Header con logout ✨ ACTUALIZADO
│   │   └── Sidebar.tsx          # Navegación lateral ✨ ACTUALIZADO
│   └── ui/
│       └── Logo.tsx             # Componente logo (logo.png)
├── lib/
│   ├── auth.ts                  # Configuración NextAuth
│   ├── prisma.ts               # Cliente Prisma
│   └── utils.ts                # Utilidades
└── prisma/
    └── schema.prisma           # Esquema completo de BD
```

---

## 🎨 Características de Diseño

### Tema Oscuro Profesional

- **Fondo principal:** Gradientes slate-900 → slate-800 → slate-700
- **Glassmorphism:** Efectos de cristal en paneles
- **Logo circular:** Contenedor blanco para logo con fondo blanco
- **Responsive:** Adaptativo a todos los dispositivos
- **Animaciones:** Suaves y profesionales

### Paleta de Colores

- **Primarios:** Azul (#3b82f6) y Verde (#10b981)
- **Textos:** slate-100 (principal), slate-300 (secundario)
- **Fondos:** slate-900, slate-800, slate-700
- **Estados:** Verde (activo), Ámbar (proceso), Rojo (error)

---

## 🔐 Autenticación

### Sistema Implementado

- **NextAuth.js** con Prisma adapter
- **Roles:** ADMINISTRADOR / TECNICO
- **Sesiones:** 60 minutos de duración
- **Middleware:** Protección de rutas por rol

### Credenciales por Defecto

```
Email: admin@rjd.com
Contraseña: admin123
Rol: ADMINISTRADOR
```

---

## 📊 Módulos Implementados

### 🏠 Dashboard Principal

- **Stats cards:** Equipos activos, En reparación, Completados, Pendientes
- **Accesos rápidos:** Nuevo equipo, Nueva reparación, Ver reportes
- **Diseño responsive** con tema oscuro

### 💻 Gestión de Equipos

- **Lista de equipos** con estados visuales
- **Búsqueda y filtros** por estado
- **Mock data** preparado para CRUD

### 👥 Gestión de Clientes ✨ NUEVO

- **Tarjetas de información** completas
- **Datos de contacto:** Teléfono, email, RUC
- **Estados:** Activo/Inactivo con badges
- **Estadísticas:** Total de equipos por cliente

### 💰 Gestión Financiera

- **Stats financieras:** Ingresos, gastos, balance
- **Transacciones recientes** con categorías
- **Indicadores** de tendencia

### 📈 Centro de Reportes

- **Tipos de reportes:** Equipos, financiero, reparaciones, mensual
- **Filtros por fecha** personalizables
- **Descarga de reportes** (mock)

---

## 🗄️ Base de Datos

### Modelos Implementados

```prisma
// Principales tablas configuradas:
- Users (administradores y técnicos)
- Customers (clientes con RUC)
- Equipment (equipos con códigos únicos)
- EquipmentStatusHistory (historial de estados)
- Payments (pagos y adelantos)
- Expenses (gastos categorizados)
- PayrollRecord (pagos semanales)
- Advances (adelantos de trabajadores)
```

### Estados de Equipos

1. **RECEIVED** - Recibido
2. **REPAIR** - En reparación
3. **REPAIRED** - Reparado
4. **DELIVERED** - Entregado
5. **CANCELLED** - Cancelado

---

## 🔧 Instalación y Configuración

### Requisitos

- Node.js 18+
- PostgreSQL (o Supabase)
- Git

### Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Instalación

```bash
# Clonar repositorio
git clone [tu-repo]
cd sistema-rjd

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma migrate dev
npx prisma db seed

# Iniciar desarrollo
npm run dev
```

---

## 🎯 Flujo de Usuario Actual

### 1. Splash (3 segundos)

- Logo circular con glow
- Redirección automática según autenticación

### 2. Login

- Tema oscuro elegante
- Validación de credenciales
- Redirección por rol

### 3. Dashboard

- **Administrador:** Acceso completo a todos los módulos
- **Técnico:** Acceso limitado solo a equipos

### 4. Navegación

- **Sidebar** fijo con logo y menú
- **Header** con información de usuario y logout
- **Responsive** en móviles con menú colapsible

---

## 🚀 Próximas Implementaciones

### FASE 2: Gestión de Equipos (Siguiente)

- ✅ CRUD completo de equipos
- ✅ Formularios con validación
- ✅ Gestión de estados
- ✅ Asignación de técnicos
- ✅ Comprobantes automáticos

### FASE 3: Gestión Financiera

- Control de ingresos y egresos
- Cálculo automático de saldos
- Métodos de pago múltiples

### FASE 4: Gestión de Personal

- Registro de pagos semanales
- Control de adelantos
- Historial por trabajador

### FASE 5: Reportes y Analytics

- Reportes operativos en tiempo real
- Análisis financiero detallado
- Dashboard ejecutivo con KPIs

---

## 📱 Responsive Design

### Breakpoints Implementados

- **Mobile:** < 768px (sidebar colapsible)
- **Tablet:** 768px - 1024px (sidebar adaptativo)
- **Desktop:** > 1024px (sidebar fijo)

### Características Móviles

- Logo optimizado por tamaño
- Navegación tipo hamburguesa
- Cards responsive en grid
- Formularios adaptables

---

## 🔒 Seguridad Implementada

### Autenticación

- Passwords hasheados
- Sesiones JWT seguras
- Middleware de protección

### Autorización

- Roles diferenciados
- Rutas protegidas por rol
- Validación en servidor y cliente

---

## 🎨 Assets Incluidos

### Logos

- `logo.png` - Logo principal (fondo blanco)
- `favicon.ico` - Ícono del navegador

### CSS Personalizado

- Tema oscuro completo
- Glassmorphism effects
- Animaciones suaves
- Variables de color del sistema

---

## 📞 Soporte y Contacto

**Sistema desarrollado para:**

- **Cliente:** Suministro y Servicios RJD
- **Especialidad:** Reparación y mantenimiento de equipos de computación
- **Ubicación:** Perú (zona horaria UTC-5)

---

## 🏷️ Versión Actual

**v1.3.0** - Layout Base y Dashboard Completo

- ✅ Autenticación funcional
- ✅ Tema oscuro profesional
- ✅ Dashboard con 5 módulos básicos
- ✅ Navegación completa responsive
- ✅ Base de datos configurada
- 🚀 Listo para FASE 2: CRUD de Equipos

---

## 📊 Métricas de Desarrollo

- **Tiempo invertido:** ~3-4 semanas
- **Líneas de código:** ~2,500+
- **Componentes:** 15+ componentes reutilizables
- **Páginas:** 6 páginas principales
- **Cobertura:** Base sólida para funcionalidades avanzadas

**🎯 Estado: Listo para implementar funcionalidades de negocio**
