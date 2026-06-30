# Contable - Sistema de Gestion para Despacho Contable

Sistema web para la gestion administrativa de un despacho contable. Permite administrar clientes, servicios, pagos, y generar reportes financieros.

## Tecnologias

### Backend
- **Python 3.11** con **FastAPI**
- **SQLAlchemy** (async) como ORM
- **Alembic** para migraciones de base de datos
- **PostgreSQL 16** (produccion) / SQLite (desarrollo local)
- **JWT** para autenticacion
- Control de acceso basado en roles (RBAC)
- Registro de auditoria en todas las operaciones

### Frontend
- **React 19** con **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **shadcn/ui** como libreria de componentes
- **TanStack Query** para manejo de estado del servidor
- **React Router** para navegacion

### Infraestructura
- **Docker** y **Docker Compose** para contenedorizacion
- **Nginx** como servidor web para el frontend
- **Uvicorn** como servidor ASGI para el backend

## Requisitos Previos

### Para desarrollo con Docker (recomendado)
- Docker 20.10+
- Docker Compose 2.0+

### Para desarrollo local
- Python 3.11+
- Node.js 22+
- npm 10+

## Inicio Rapido con Docker

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd contable
```

2. Copiar el archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con los valores apropiados (ver seccion de Variables de Entorno).

4. Construir e iniciar los servicios:
```bash
docker-compose up --build
```

5. Acceder a la aplicacion:
   - Frontend: http://localhost
   - API Backend: http://localhost:8000
   - Documentacion API (Swagger): http://localhost:8000/docs

6. Credenciales por defecto:
   - Email: `admin@contable.com`
   - Contrasena: `admin123`

## Desarrollo Local

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El servidor de desarrollo del frontend se ejecuta en http://localhost:5173 y tiene un proxy configurado para redirigir las peticiones `/api` al backend en el puerto 8000.

## Variables de Entorno

Consultar el archivo `.env.example` para la lista completa de variables. Las principales son:

| Variable | Descripcion | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | URL de conexion a la base de datos | `sqlite+aiosqlite:///./contable.db` |
| `SECRET_KEY` | Clave secreta para firmar tokens JWT | `dev-secret-key-change-in-production` |
| `DEBUG` | Modo de depuracion | `true` |
| `CORS_ORIGINS` | Origenes permitidos para CORS | `["http://localhost:5173"]` |
| `SMTP_HOST` | Servidor SMTP para envio de correos | `localhost` |
| `SMTP_PORT` | Puerto del servidor SMTP | `587` |
| `DEFAULT_ADMIN_EMAIL` | Email del administrador inicial | `admin@contable.com` |
| `DEFAULT_ADMIN_PASSWORD` | Contrasena del administrador inicial | `admin123` |

## Estructura del Proyecto

```
contable/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuracion, seguridad, base de datos
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── routers/       # Endpoints de la API
│   │   ├── schemas/       # Esquemas Pydantic
│   │   ├── services/      # Logica de negocio (email, calculos, exportacion)
│   │   ├── middleware/    # Middleware (auditoria)
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── alembic/           # Migraciones de base de datos
│   ├── tests/             # Pruebas unitarias
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # Paginas de la aplicacion
│   │   ├── components/    # Componentes reutilizables
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilidades (API client, auth context)
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## API

La documentacion interactiva de la API esta disponible en:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints principales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/forgot-password` | Solicitar restablecimiento de contrasena |
| GET | `/api/users` | Listar usuarios |
| GET | `/api/clients` | Listar clientes |
| GET | `/api/services` | Listar servicios |
| GET | `/api/payments` | Listar pagos |
| GET | `/api/reports/monthly-revenue` | Reporte de ingresos mensuales |
| GET | `/api/reports/clients-balance` | Balance de clientes |
| GET | `/api/health` | Verificar estado del servicio |

## Migraciones de Base de Datos

Las migraciones se ejecutan automaticamente al iniciar la aplicacion. Para ejecutarlas manualmente:

```bash
cd backend

# Generar una nueva migracion
alembic revision --autogenerate -m "descripcion del cambio"

# Aplicar migraciones pendientes
alembic upgrade head

# Revertir ultima migracion
alembic downgrade -1
```

## Pruebas

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm run build
```

## Produccion

Para un despliegue en produccion, asegurese de:

1. Cambiar `SECRET_KEY` por una clave segura y aleatoria
2. Establecer `DEBUG=false`
3. Configurar un servidor SMTP real para el envio de correos
4. Cambiar las credenciales por defecto del administrador
5. Configurar HTTPS con un certificado SSL valido
6. Usar contrasenas seguras para la base de datos

## Licencia

Proyecto privado - Todos los derechos reservados.
