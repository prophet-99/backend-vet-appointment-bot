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
- Detectar el estado HUMANO

- hay un problema me permite agendar para una fecha que ya pasó (get avalibilyt debe de BLOQUEAR ESTO)
- Pueden agendar para más de un perro el mismo usuario, algunos quieren para dos a la
- Metodo para confirmar cita / rechazarla y que mande a n8n respuesta
- SI ocurre un error GLOBAL -> forazar repuesta a n8n que vuelva aitnentarlo si ya se complica se debe derivar a la doctora

# REGLAS NEGOCIO

- Rercodar que existira días especiales no laborables que se pueden configurar

# TESTS

http://127.0.0.1:3000/test/Quiero cita para mañana las 2

http://127.0.0.1:3000/test/Se llama Jota, es grande, su raza es labrador cruzado ocn mestizo, quiero un baño simple, soy ALexander, si por favor tinee una yaga el ddoctor me dijo que de prefefrecnia solo se lave con agua,

http://127.0.0.1:3000/test/Hola soy el papa de Lucky
http://127.0.0.1:3000/test/Fecha para hoy en la tarde, corte mas baño, es border collie, soy Leonsardo Anthony, tener cuidado con su colita esta raspada por un accidente
