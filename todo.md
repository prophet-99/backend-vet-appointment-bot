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

- Pueden agendar para más de un perro el mismo usuario, algunos quieren para dos a la
- SI ocurre un error GLOBAL -> forazar repuesta a n8n que vuelva aitnentarlo si ya se complica se debe derivar a la doctora
- Esta ocurriendo un error con código apt_XXXX..cuando ocurra esto forzar el guardado desde backend, hacer un lower to stirng de ambos y si incluye mas o 4 ebntonces forzar a guardar
- Metodo para confirmar cita / rechazarla y que mande a n8n respuesta

# REGLAS NEGOCIO

- Rercodar que existira días especiales no laborables que se pueden configurar

# TESTS

http://127.0.0.1:3000/test/hola habra cita para hoy para jota?
http://127.0.0.1:3000/test/Es grande quiero un baño simple con corte de uñas y limpieza de glandulas anales
