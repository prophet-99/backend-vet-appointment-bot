# MODEL PARAMETER OPTIONS

- Modelo: GPT-4.1 Mini
- temperature: 0.5
- top_p: 1.0
- max_tokens: 300

# QUESTIONS:

- Si es un gato que se hará, es pequeño pero SERVICIOS???

# REGLAS NEGOCIO

- Rercodar que existira días especiales no laborables que se pueden configurar

# DB

psql -U postgres -d db_dog_glam_vet
\dt
\pset pager off
delete from booking_state where conversation_id='899129189958396:51932265652';
