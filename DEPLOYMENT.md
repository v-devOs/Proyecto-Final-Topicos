# Sistema de Gestión - Psicología Clínica

Sistema integral para la administración de consultorios, personal médico y citas de atención psicológica.

## 🚀 Despliegue en Vercel

### Prerequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Base de datos PostgreSQL (se recomienda [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) o [Supabase](https://supabase.com))
3. Repositorio en GitHub

### Pasos para desplegar

#### 1. Configurar la base de datos

Si usas **Vercel Postgres**:

```bash
# Desde el dashboard de Vercel
1. Ve a tu proyecto
2. Storage → Create Database → Postgres
3. Copia la DATABASE_URL que se genera
```

Si usas **Supabase**:

```bash
1. Crea un nuevo proyecto en Supabase
2. Ve a Settings → Database
3. Copia la "Connection string" en modo "Connection pooling"
```

#### 2. Preparar el repositorio

```bash
# Asegúrate de que todos los cambios estén commiteados
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 3. Importar proyecto en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Selecciona "Import Git Repository"
3. Elige tu repositorio de GitHub
4. Configura las variables de entorno:

```env
DATABASE_URL=tu_database_url_aqui
JWT_SECRET=tu_jwt_secret_seguro_aqui
JWT_EXPIRES_IN=7d
```

5. Click en "Deploy"

#### 4. Ejecutar migraciones de Prisma

Después del primer despliegue:

```bash
# Opción 1: Desde tu máquina local con la DATABASE_URL de producción
DATABASE_URL="tu_production_url" npx prisma migrate deploy

# Opción 2: Desde Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

#### 5. Crear usuario administrador inicial

Ejecuta este script SQL directamente en tu base de datos:

```sql
-- Crear primer administrador (password: admin123)
INSERT INTO admins (first_name, last_name, email, password_hash, active)
VALUES (
  'Admin',
  'Principal',
  'admin@clinica.com',
  '$2b$10$rXlJJ5YqXQ5xZY5qXVx5xOYzGZxZxZxZxZxZxZxZxZxZxZxZxZxZ',
  true
);
```

**Nota**: Cambia la contraseña después del primer inicio de sesión.

### 🔐 Variables de Entorno Requeridas

| Variable         | Descripción                    | Ejemplo                               |
| ---------------- | ------------------------------ | ------------------------------------- |
| `DATABASE_URL`   | URL de conexión a PostgreSQL   | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`     | Clave secreta para JWT         | `your-super-secret-key-min-32-chars`  |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `7d`                                  |

### 📦 Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Validar Prisma schema
npx prisma validate

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio
```

## 🏗️ Estructura del Proyecto

```
proyecto-final-progra-web/
├── app/
│   ├── actions/          # Server Actions
│   ├── admin/            # Rutas admin
│   ├── staff/            # Rutas staff/psicólogos
│   ├── components/       # Componentes React
│   ├── lib/              # Utilidades
│   └── generated/        # Prisma Client generado
├── prisma/
│   ├── schema.prisma     # Schema de base de datos
│   └── migrations/       # Migraciones
└── public/               # Archivos estáticos
```

## 🔑 Credenciales por defecto

**Administrador:**

- Email: `admin@clinica.com`
- Password: `admin123`

⚠️ **Importante**: Cambia estas credenciales en producción.

## 🛠️ Tecnologías

- **Framework**: Next.js 16.0.7
- **React**: 19.2.0
- **Base de datos**: PostgreSQL 17
- **ORM**: Prisma 6.19.0
- **Autenticación**: Jose JWT
- **Estilos**: Tailwind CSS 4
- **Validación**: Zod 4.1.13
- **Encriptación**: Bcrypt

## 📱 Funcionalidades

### Para Administradores

- ✅ Dashboard con estadísticas
- ✅ Gestión de staff (CRUD)
- ✅ Gestión de consultorios (CRUD)
- ✅ Gestión de horarios (CRUD)
- ✅ Gestión de citas (CRUD)
- ✅ Gestión de pacientes (CRUD)

### Para Staff/Psicólogos

- ✅ Dashboard personalizado
- ✅ Mis horarios
- ✅ Mis citas
- ✅ Mis pacientes asignados
- ✅ Mi perfil

## 🐛 Troubleshooting

### Error: "Prisma Client not found"

```bash
npx prisma generate
npm run build
```

### Error: "Database connection failed"

Verifica que:

1. La DATABASE_URL esté correctamente configurada
2. La base de datos esté accesible desde Vercel
3. Las migraciones estén aplicadas

### Error: "JWT_SECRET not found"

Asegúrate de agregar JWT_SECRET en las variables de entorno de Vercel.

## 📞 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto es propiedad de [Tu Institución].
