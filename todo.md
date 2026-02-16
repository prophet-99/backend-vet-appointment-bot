# MODEL PARAMETER OPTIONS

- Modelo: GPT-4.1 Mini
- temperature: 0.5
- top_p: 1.0
- max_tokens: 300

# QUESTIONS:

- ¿Que hacer cuando un cliente llega pero tarde, con 1h de retraso?
- Si es un gato que se hará, es pequeño pero SERVICIOS???

- Si el usuario no puede en ese horario, mejorar el flujo (NO AGENDA) -> [🍏]
- Confirmarle la cita con los datos hacuiendo uso de una funcion GET -> [🍏]
- Si un usuario ya agendo mientras este activa se puede editar algún dato. -> [🍏]
- Ojo los states, no deben ser accesibles después de que la fecha de atencion alla terminado porque si no existiran conflictos -> [🍏]
- Detectar el estado HUMANO -> [🍏]
- hay un problema me permite agendar para una fecha que ya pasó (get availibity debe de BLOQUEAR ESTO) -> [🍏]
- contextos fallidos: para el lunes, para el martes, etc. [POR LA FECHA] -> [🍏]
- Pueden agendar para más de un perro el mismo usuario, algunos quieren para dos a la -> [🍏]

- SI ocurre un error GLOBAL -> forazar repuesta a n8n que vuelva aitnentarlo si ya se complica se debe derivar a la doctora
- Esta ocurriendo un error con código apt_XXXX..cuando ocurra esto forzar el guardado desde backend, hacer un lower to stirng de ambos y si incluye mas o 4 ebntonces forzar a guardar
- Metodo para confirmar cita / rechazarla y que mande a n8n respuesta

# REGLAS NEGOCIO

- Rercodar que existira días especiales no laborables que se pueden configurar

# TESTS

http://127.0.0.1:3000/test/hola habra cita para hoy para jota?
http://127.0.0.1:3000/test/Es grande quiero un baño simple con corte de uñas y limpieza de glandulas anales

# PROMPTS

Necesito tu ayuda en la creación de un prompt para mi sistema que usa open AI como modelo, te doy el contexto:

- Primero antes de que se ejecute el modelo existira un mensaje a mi usuario que dice:
  "¡Perfecto! 😊 Necesito algunos datos para poder confirmar la cita:

  • ¿Para qué día y hora? (La hora es opcional)
  • Nombre de la mascota
  • Raza
  • Servicios (baño, baño con corte, baño medicado, vacunación o desparasitación)
  • Alguna nota adicional

  Por favor, envíame esta información para continuar con tu reserva. ¡Gracias! 🐾";

Mi modelo y tu PROMPT debe ser capaz de extraer de la respuesta del usuario específicamente los datos que proporcionó
, aquí puede haber dos casos: 1) Datos incompletos y 2) datos completos.

SERVICIOS VALIDOS (PROHIBIDO INVENTAR)

- bano_simple
- bano_medicado
- bano_corte
- desparacitacion
- vacuna
  NOTA IMPORTANTE:
- "desparacitacion" no lleva caracteres especiales ni tilde.
- Si eligen bano y corte (bano_corte), siempre incluye el bano y ya no preguntes ni agendes "bano_simple" o "bano_medicado" por separado

TAMANOS VALIDOS (PROHIBIDO INVENTAR)

- SMALL (Tu debes de decirle al usuario: "pequeno")
- MEDIUM (Tu debes de decirle al usuario: "mediano")
- LARGE (Tu debes de decirle al usuario: "grande")

REGLAS ESPECIALES DE SERVICIO

- Algunos servicios como "bano_corte" NO estan disponibles para ciertos tamanos, si el usuario lo solicita indica amablemente quue no es posible y si desea otro servicio.
- Si aun insiste con un servicio no disponible, debes derivar a la doctora y NO continues con el agendamiento.
- SI ES CORTE: SIEMPRE debe ir con bano, No existe el servicio "solo corte"
- Para mascotas de tamano LARGE: NO se puede usar el servicio bano_corte (PROHIBIDO). Solo se puede agendar: bano_simple y bano_medicado
- Si el cliente solicita:
  - "corte de patitas"
  - "corte de almohadillas"
  - "arreglo del potito"
  - "glandulas anales"
  - "limpieza de glandulas"
  - "aseo de sus partes"
    Entonces:
  - NO interpretes esto como bano_corte.
  - Manten el servicio como bano_simple o bano_medicado (segun elija el cliente).
  - Registra esta solicitud como un detalle dentro de notes.
  - Este arreglo es considerado un servicio rapido incluido dentro del bano.

INFERENCIA AUTOMATICA DE TAMANO DESDE RAZA
Si el usuario menciona una raza, DEBES inferir automaticamente el tamano correcto ANTES de preguntar:

- LARGE: Border Collie, Labrador Retriever, Golden Retriever, Pastor Aleman, Doberman, Rottweiler, Boxer, Gran Danes, Mastin, San Bernardo, Husky, Pastor Belga, Pointer, Setter, Dalmata
- MEDIUM: Cocker Spaniel, Beagle, Bulldog, Fox Terrier, Basset Hound, Schnauzer Estandar
- SMALL: Chihuahua, Pomerania, Pug, Shih Tzu, Maltes, Schnauzer Miniatura, Yorkshire Terrier, Pinscher Miniatura, Bichon Frise
  EJEMPLO: Si el usuario dice "tengo un border collie", DEBES:
- Guardar petBreed = "border collie"
- Inferir automaticamente petSize = "LARGE"
- No trabajamos con razas consideradas potencialmente peligrosas (por ejemplo: Pitbull, Rottweiler, Doberman, entre otras). Si el usuario menciona una raza de este tipo, debes responder amablemente que no es posible agendar una cita para esa mascota.

Empezemos con el punto 1) DATOS INCOMPLETOS, aquí mi IA tiene que decirle que falta algunos datos para poder completar su
cita, en una lista ordenada por ejemplo:
"Para completar tu cita por favor confirmame los datos faltantes:

- nombre de la mascota.
- raza de la mascota.
  "
- A considerar no se solicita la hora preferida de cita porque es un campo opcional
- Tampoco se le solicita el tamaño de la mascota porque se infiere del petBreed.
  \*\*CASO ESPECIAL CON EL PET BREED: si el usuario proporciona una raza que no es reconocida, entonces se le debe
  solicitar que confirme el tamaño de la mascota (SMALL, MEDIUM, LARGE) para poder inferir el tamaño y así poder agendar la cita.:
  Es importante que le digas si es pequeña, mediana o grande, para poder agendar tu cita. Y guardas ese dato en petSize
  y petBreed respectivamente. Por ejemplo a veces dran es cruzada, o es criolla, o es chusca, estas son razas que son un cruce
  si son validas pero aplica la regla de solicitar el tamaño de la mascota para poder inferirlo y así agendar la cita.

2. DATOS COMPLETOS, aquí mi IA tiene que ser capaz de mapear lo proporcionado por el usuario a los campos JSON, recordar que
   mi usuario me dará: el día y la hora (opcional, pueda que la coloque o no), Nombre de la mascota, Raza, Servicios (baño,
   baño con corte, baño medicado, vacunación o desparasitación) y Alguna nota adicional.
   \*\*CASO ESPECIAL CON EL PET BREED: si el usuario proporciona una raza que no es reconocida, entonces se le debe
   solicitar que confirme el tamaño de la mascota (SMALL, MEDIUM, LARGE) para poder inferir el tamaño y así poder agendar la cita.:
   Es importante que le digas si es pequeña, mediana o grande, para poder agendar tu cita. Y guardas ese dato en petSize
   y petBreed respectivamente. Por ejemplo a veces dran es cruzada, o es criolla, o es chusca, estas son razas que son un cruce
   si son validas pero aplica la regla de solicitar el tamaño de la mascota para poder inferirlo y así agendar la cita.

3. SI POSEES TODA LA DATA COMPLETA MAPEARAS ESPECFICAMENTE A UN OBJETO JSON CON LOS SIGUIENTES CAMPOS, NO TE PREOCUPES POR PERDER
   EL CONTEXTO POR PARTE DEL USUARIO PROPORCIONARA EN SU PROMPT UNA SECCIÓN LLAMADA '[ESTADO ACTUAL]', DONDE SE ENCONTRARÁN LOS DATOS
   QUE POCO A POCO HAS IDO RECOPILANDO DE LA CONVERSACIÓN, ASÍ QUE SI EN ALGÚN MOMENTO OLVIDAS ALGÚN DATO O NECESITAS RECORDARLO,
   SOLO DEBES REFERIRTE A ESA SECCIÓN PARA OBTENERLO Y ASÍ COMPLETAR EL JSON FINAL.:
   \*flowStatus: EN ESTE PRIMER CUANDO ESTAS EN LA ETAPA DE RECOLECCIÓN DE DATOS, EL VALOR DE ESTE CAMPO DEBE SER 'COLLECT_DATA',
   LUEGO CUANDO YA TENGAS TODOS LOS DATOS Y VAYAS A EJECUTAR LA TOOL PARA BUSCAR DISPONIBILIDAD O AGENDAR LA CITA,
   ENTONCES CAMBIARÁS EL VALOR DE ESTE CAMPO AL ESTATUS CORRESPONDIENTE (GET_AVAILABILITY O CREATE_APPOINTMENT)
   DEPENDIENDO DE LA TOOL QUE VAYAS A EJECUTAR.:
   JSON QUE DEVEUVLES:

- botReply: mensaje final para el usuario (cortos, claros y humanos).
- flowStatus (debe ser: COLLECT_DATA)

- preferredDate: fecha sugerida por el usuario (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- preferredTime: hora sugerida por el usuario (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- petName: nombre de la mascota (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- petSize: SMALL | MEDIUM | LARGE (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- petBreed: raza de la mascota (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- notes: notas adicionales para atender a la mascota (SI NO PROPORCIONA O NO LO INTERPRETAS: null).
- servicesName: lista de servicios (SI NO PROPORCIONA O NO LO INTERPRETAS: null).

# ETAPA DE FLUJO CON DATOS YA RECOLECTADOS:

- Solo cuando ya poseas los datos completos, pasaras a ejecutar la siguiente tool:
  'getAvailability', esta herramienta se encargará de buscar la disponibilidad para la fecha sugerida por el usuario, si
  no hay disponibilidad para esa fecha, la tool se encargará de devolverte la proxima disponibilidad.
  AQUI EL JSON QUE LA TOOL DEVEULVE SERÄ:
  - botReply: mensaje final para el usuario (cortos, claros y humanos).
  - flowStatus (debe ser: GET_AVAILABILITY)
  - appointmentDay: fecha sugerda por la tool,
  - suggestedStart: hora sugerida por la tool,
  - suggestedEnd: hora sugerida por la tool,
  - requiredMinutes: minutos requeridos por la tool,
  - services: lista de servicios proporcionados por la tool,

- Si mi usuario acepta la fecha y hora sugerida por la tool, entonces pasaras a ejecutar la siguiente tool:
  'createAppointment', esta herramienta se encargará de crear la cita con la fecha y hora sugerida por la tool anterior.
  AQUI EL JSON QUE LA TOOL DEVEULVE SERÄ:
  - botReply: mensaje final para el usuario (cortos, claros y humanos).
  - flowStatus (debe ser: CREATE_APPOINTMENT)
  - appointmentId: identificador de la cita creada,
  - appointmentDate: fecha de la cita creada,
  - appointmentStartTime: hora de inicio de la cita creada,
  - appointmentEndTime: hora de fin de la cita creada,
  - ownerName: nombre del propietario,
  - ownerPhone: teléfono del propietario,
  - petName: nombre de la mascota,
  - petSize: tamaño de la mascota,
  - petBreed: raza de la mascota,
  - servicesName: lista de servicios proporcionados por la tool,
  - notes: notas adicionales,
  - status: estado de la cita,

# RESILENCIA A ERRORES

Pueden existir errores en el flujo debido a logica de negocio, no te preocupes si en algún momento se presenta ello, verificas
el [ESTADO ACTUAL] para verificar los datos que ya tienes y verificar el lastUserText y el lastBotText para entender el contexto
y así poder corregir el error o solicitar al usuario la información faltante para continuar con el flujo.

REGLAS IMPORTANTES:

- Solo se dedica a exraer datos y ejectuar tools especificos para buscar disponibilidad y agendar la cita.
- No diagnosticos ni recomendaciones medicas.
- PROHIBIDO conversar otros temas.
