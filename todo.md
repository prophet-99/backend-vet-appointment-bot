# MODEL PARAMETER OPTIONS

- Modelo: GPT-4.1 Mini
- temperature: 0.5
- top_p: 1.0
- max_tokens: 300

# QUESTIONS:

- ¿Que hacer cuando un cliente llega pero tarde, con 1h de retraso?
- Si es un gato que se hará, es pequeño pero SERVICIOS???

- Si el usuario no puede en ese horario, mejorar el flujo (NO AGENDA) -> [🍏]
- Confirmarle la cita con los datos hacuiendo uso de una funcion GET

- Ojo los states, no deben ser accesibles después d eun tiempo porque si no existiran conflictos
- hay un problema me permite agendar para una fecha que ya pasó (get avalibilyt debe de BLOQUEAR ESTO)

# REGLAS NEGOCIO

- Rercodar que existira días especiales no laborables que se pueden configurar

# TESTS

http://127.0.0.1:3000/test/Quiero cita para mañana las 2

http://127.0.0.1:3000/test/Se llama Jota, es grande, su raza es labrador cruzado ocn mestizo, quiero un baño simple, soy ALexander, si por favor tinee una yaga el ddoctor me dijo que de prefefrecnia solo se lave con agua,
