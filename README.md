<div align="center">

# 🐾 Urban Pet Scheduling Bot

AI backend para agendamiento de citas veterinarias por WhatsApp.  
Conversaciones guiadas, disponibilidad en tiempo real y citas con codigo amigable.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![NestJS](https://img.shields.io/badge/NestJS-10+-red?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square)

</div>

---

## Lo esencial

- Chatbot con OpenAI Responses API y salidas estructuradas.
- Agenda: crear, consultar, cambiar (cancelar + crear), cancelar.
- IDs de cita faciles de recordar: `apt_XXXXXXXX`.
- Reglas de negocio por tamano, servicio y horarios.

## Stack

- NestJS + TypeScript
- PostgreSQL + Prisma
- OpenAI Responses API
- Luxon (zona horaria: America/Lima)

## Inicio rapido

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Variables de entorno

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_vet_reservation
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
APP_TIMEZONE=America/Lima
```

## Endpoints

```bash
GET /health
POST /chat
```

## Licencia

MIT

---

## 📂 Estructura del Proyecto

```
src/
├── main.ts                           # Entry point
├── application/
│   ├── controllers/
│   └── routes/
│       └── ai.routes.ts             # Rutas de Chat
├── domain/                          # Business Logic
│   ├── models/
│   │   ├── scheduler.model.ts       # Interfaces de agenda
│   │   ├── ai-provider.model.ts     # Interfaces IA
│   │   └── booking-store.model.ts   # Estado conversacional
│   ├── services/
│   │   ├── scheduler.service.ts     # Lógica de citas
│   │   ├── conversation.service.ts  # Gestión de conversación
│   │   └── booking-store.service.ts # Estado de usuario
│   ├── dtos/
│   └── enums/
├── infrastructure/
│   ├── ai/                          # OpenAI Integration
│   │   ├── ai-response.schema.ts    # Zod schema
│   │   ├── open-ai.client.ts        # OpenAI client
│   │   ├── open-ai.prompt.ts        # System prompt
│   │   └── open-ai.tools.ts         # Tool definitions
│   ├── db/
│   │   ├── prisma.ts                # Prisma client
│   │   └── repositories/            # Data access
│   ├── adapters/                    # Data transformers
│   └── orchestrators/
│       └── ai-provider.orchestator.ts # Tool execution + state merge
├── shared/
│   ├── utils/
│   │   ├── date.util.ts            # Manejo de fechas (Lima)
│   │   ├── time.util.ts            # Conversión HH:MM
│   │   ├── interval.util.ts        # Lógica de slots
│   │   ├── state.util.ts           # Extracción JSON/estado
│   │   └── appointment-id.util.ts  # Generador de IDs
│   └── symbols/
│       ├── business.constants.ts    # Configuración de negocio
│       └── error-codes.constants.ts # Códigos de error
└── prisma/
    ├── schema.prisma                # Modelos ORM
    ├── seed.ts                      # Datos iniciales
    └── migrations/                  # Historial de cambios
```

---

## 🎯 Características Avanzadas

### ✅ Extracción Inteligente de Datos

- Detecta razas de perros y infiere tamaño automáticamente
- Mapeo: Border Collie → LARGE, Chihuahua → SMALL, etc.
- Extrae múltiples servicios: baño_simple, baño_corte, baño_medicado, desparacitacion, vacuna

### ✅ Manejo Robusto de Errores

- Try/catch envolviendo `responses.parse`
- Fallback a `responses.create` + extracción JSON con regex
- Duplicates handling: usa **última ocurrencia** de JSON válido
- Logging detallado con separadores visuales

### ✅ Validación Antes de Agendar

- Checklist explícita de 7 datos requeridos
- No llama `createAppointment` sin completar todo
- Reintentos automáticos para datos incompletos

### ✅ Transacciones Atómicas

- Advisory locks PostgreSQL por fecha
- Previene race conditions en slots concurrentes
- Revalidación de overlaps dentro de transacción

### ✅ Expiración de Citas

- PENDING appointments expiran en 24 horas
- No bloquean slots nuevos después de expirar
- CONFIRMED appointments nunca expiran

---

## 📊 Modelos de Base de Datos

### Appointment

```prisma
model Appointment {
  id            String            @id  // apt_XXXXXXXX
  date          DateTime
  startTime     String            // HH:MM
  endTime       String            // HH:MM
  status        AppointmentStatus // PENDING | CONFIRMED | REJECTED | CANCELLED
  expiresAt     DateTime

  ownerName     String
  ownerPhone    String
  petName       String
  size          PetSize           // SMALL | MEDIUM | LARGE
  breedText     String?
  notes         String?

  items         AppointmentItem[] // Relación a servicios
}
```

### Service

```prisma
- bano_simple      // Baño estándar
- bano_medicado    // Baño con medicamento
- bano_corte       // Baño + corte
- desparacitacion  // Desparasitación
- vacuna           // Aplicación de vacuna
```

### Rules

- **DurationRule**: minutos por servicio + tamaño
- **BusinessRule**: límites diarios por servicio/tamaño
- **Closure**: días cerrados
- **WorkShift**: horarios laborales

---

## 🧪 Testing (Setup Available)

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## 🌍 Timezone & Locales

**Timezone Configurado**: `America/Lima` (UTC-5)

Todas las fechas se normalizan automáticamente:

- Input: "mañana" → Output: fecha en Lima
- Input: "tarde" → "14:00"
- Horario: Lun-Sab 09:00-16:00

---

## 📝 Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db_vet_reservation

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.7
OPENAI_TOP_P=1
OPENAI_MAX_TOKENS=1024

# App
APP_TIMEZONE=America/Lima
NODE_ENV=development
PORT=3000
```

---

## 🚨 Manejo de Errores

| Error                       | Causa                     | Solución                                |
| --------------------------- | ------------------------- | --------------------------------------- |
| `APPOINTMENT_SLOT_CONFLICT` | Hora ocupada              | Sugerir otra hora con `getAvailability` |
| `SERVICE_NOT_FOUND`         | Servicio inválido         | Mostrar servicios válidos al usuario    |
| `JSON_PARSE_ERROR`          | Respuesta OpenAI corrupta | Fallback a extracción manual            |
| `MISSING_DATA`              | Datos incompletos         | Pedir datos faltantes                   |

---

## 🔮 Roadmap Futuro

- [ ] Confirmación de citas por WhatsApp (2FA)
- [ ] Recordatorios automáticos 24h antes
- [ ] Dashboard admin para veterinario
- [ ] Integración con pasarela de pago
- [ ] Soporte para múltiples veterinarias
- [ ] Análisis de sentimiento en chat
- [ ] Recomendaciones de servicios basadas en IA

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**. Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

Desarrollado por el equipo de **Prophet Code** 🐾  
Chiclayo, Perú

---

## 📞 Soporte

¿Preguntas o sugerencias? Abre un issue en GitHub.

---

**⭐ Si te fue útil, ¡no olvides dejar una estrella!"**
