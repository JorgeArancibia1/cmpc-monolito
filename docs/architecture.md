# Arquitectura — CMPC Libros

## Visión general

Sistema desacoplado: una SPA React consume una API REST NestJS que persiste en PostgreSQL
mediante Prisma. El paquete `@cmpc/contracts` define los esquemas de validación y los tipos,
y es consumido tanto por el backend (validación + OpenAPI) como por el frontend (formularios),
garantizando una única fuente de verdad.

```mermaid
flowchart TB
  subgraph Cliente
    UI[SPA React<br/>Vite · Tailwind · TanStack Query · React Hook Form]
  end
  subgraph Contratos["@cmpc/contracts (Zod)"]
    C[Esquemas + tipos]
  end
  subgraph API[API NestJS]
    G[Guards<br/>JWT · RBAC]
    P[ZodValidationPipe]
    I[Interceptors<br/>Transform · Audit · Logging]
    F[Filtro de errores<br/>mensajes claros]
    R[(BooksRepository<br/>abstracción)]
  end
  DB[(PostgreSQL)]
  IMG[Cloudinary]

  UI -->|HTTPS · Bearer| G --> P --> I
  I --> R --> DB
  I --> IMG
  I --> F
  C -. valida .-> UI
  C -. valida + OpenAPI .-> P
  UI -. refresh cookie httpOnly .-> G
```

## Flujo de una petición de listado

```mermaid
sequenceDiagram
  participant C as SPA
  participant A as API
  participant DB as PostgreSQL
  C->>A: GET /api/books?search=&sort=&page= (Bearer)
  A->>A: JwtAuthGuard + RolesGuard
  A->>A: ZodValidationPipe valida y normaliza la query
  A->>DB: SELECT con filtros, orden y paginación (deletedAt IS NULL)
  DB-->>A: filas + total
  A->>A: TransformInterceptor → { success, data, meta }
  A-->>C: 200 OK
```

## Autenticación (JWT con rotación de refresh)

- **Access token** (15 min) en memoria del cliente → mitiga XSS.
- **Refresh token** (7 días) en cookie `httpOnly`, con su hash almacenado en la base de datos.
- **RBAC**: las operaciones de escritura requieren rol `ADMIN` (`RolesGuard` + `@Roles`).

## Capas del backend (SOLID)

- **Controllers** — orquestan HTTP y documentan en Swagger.
- **Services** — lógica de negocio. `BooksService` depende de la interfaz `BooksRepository`
  (inversión de dependencias), no de Prisma.
- **Repository** — `PrismaBooksRepository` encapsula consultas y **transacciones** (sincroniza
  la tabla puente `book_authors` de forma atómica).
- **Transversal** — filtro de errores (mensajes claros), interceptores (transformación de
  respuesta, auditoría, logging) y guards globales.

## Manejo de errores

Toda excepción se traduce a una respuesta uniforme con mensajes en lenguaje simple. Los errores
de validación incluyen el detalle por campo (`fields`), que el frontend muestra junto a cada
input. Los errores técnicos (base de datos, fallos internos) nunca se exponen al usuario.

## Modelo de datos

7 tablas normalizadas a BCNF, con restricciones de integridad (`CHECK`) a nivel de base de datos
y la disponibilidad derivada del stock. Ver [`database.dbml`](database.dbml).

```mermaid
erDiagram
  users ||--o{ audit_logs : registra
  publishers ||--o{ books : edita
  genres ||--o{ books : clasifica
  books ||--o{ book_authors : tiene
  authors ||--o{ book_authors : escribe
  books {
    uuid id PK
    string title
    string isbn UK
    decimal price
    int stock
    uuid publisher_id FK
    uuid genre_id FK
    timestamp deleted_at
  }
  book_authors {
    uuid book_id FK
    uuid author_id FK
  }
```

## Despliegue

| Componente | Plataforma |
|-----------|------------|
| Frontend (estático) | Vercel |
| Backend (Docker) | Render |
| Base de datos | PostgreSQL gestionado (Neon) |
| Imágenes | Cloudinary |

El sistema sigue la metodología Twelve-Factor; ver [`adr/0006-twelve-factor.md`](adr/0006-twelve-factor.md).
