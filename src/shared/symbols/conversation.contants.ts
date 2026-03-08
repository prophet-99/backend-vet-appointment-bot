const WELCOME_MESSAGE =
  'Hola, soy Glamy 🤖, el asistente virtual de The Urban Pet 🐶.';

const VET_DETAILS_MESSAGE = `🐾 *The Urban Pet – Chiclayo*

¡Gracias por tu interés! 💛  
Aquí tienes nuestra información:

📍 *Dirección*  
Los Tumbos 211, Chiclayo 14008, Peru  
https://maps.app.goo.gl/mmBQptvUNyz8K2wq7

🕒 *Horario de atención*  
Lunes a Sabado de 9:00 a 18:30 hrs.

📞 *Teléfono*  
Este es el número por el que te estás comunicando.

🛁 *Servicios disponibles*
• Grooming  
• Baños  
• Vacunación  
• Desparasitación  

Si necesitas otro servicio, puedes preguntarnos directamente por aquí ✨  
Estaremos encantados de ayudarte.
`;

const HUMAN_ESCALATION_MESSAGE =
  'Perfecto 🙌 Te paso con la doctora. Puede que esté atendiendo a una mascotita en este momento, pero ni bien termine te escribe por aquí 🐶';

const MENU_SELECTION_REQUIRED_MESSAGE =
  '📌 Por favor, elige una opción del menú para continuar. ¡Así podré ayudarte mejor!';

const CREATE_BOOKING_MESSAGE = `¡Perfecto! 😊 Necesito algunos datos para poder confirmar la cita:

• ¿Para qué día y hora? (La hora es opcional)
• Nombre de la mascota
• Raza
• Servicios (baño, baño con corte, baño medicado, vacunación o desparasitación)
• Alguna nota adicional

👉 Si deseas agendar para más de una mascota, realiza la reserva de cada una por separado. Así podremos encontrar el mejor horario para cada perrito y darte una experiencia más personalizada 🐶✨

Envíame estos datos y seguimos con tu reserva. ¡Gracias! 🐾`;

const DELETE_BOOKING_MESSAGE =
  '¡Gracias por avisarnos! 😊 Para cancelar tu cita, solo necesito el *número de reserva*. Si deseas, puedes contarme el motivo de tu cancelación; eso nos ayudará a seguir mejorando. 🐾';

function BOOKING_SUMMARY_MESSAGE(
  strings: TemplateStringsArray,
  data: {
    appointmentId: string;
    appointmentDate: string;
    appointmentStartTime: string;
    ownerName: string;
    ownerPhone: string;
    petName: string;
    petSize: string;
    petBreed: string;
    servicesName: string[];
    notes: string;
    status: string;
  }
) {
  return `
✅ ¡Tu cita está confirmada!

🆔 *Código de reserva*: ${data.appointmentId}
📅 *Fecha*: ${data.appointmentDate}
⏰ *Hora*: ${data.appointmentStartTime}
🐾 *Mascota*: ${data.petName} (${data.petBreed}, ${data.petSize})
🛁 *Servicios*: ${data.servicesName.join(', ')}
📝 *Notas*: ${data.notes}
📋 *Estado*: ${data.status}
👤 *Dueño*: ${data.ownerName} (${data.ownerPhone})

Por favor, guarda este código de reserva para cualquier consulta o cambio.
¡Gracias por confiar en The Urban Pet! 💛🐶
`.trim();
}

const REJECTED_APPOINTMENT_MESSAGE = `Lamentamos informarte que, por ahora, la doctora no podrá atender tu cita. 😔 En breve te escribirá para explicarte el motivo y ayudarte a reprogramarla.`;

const ACCEPTED_APPOINTMENT_MESSAGE = `¡Buenas noticias! ✨ La doctora confirmó tu cita. 😊 ¡Te esperamos con mucho cariño en The Urban Pet! 🐾`;

export {
  WELCOME_MESSAGE,
  VET_DETAILS_MESSAGE,
  HUMAN_ESCALATION_MESSAGE,
  MENU_SELECTION_REQUIRED_MESSAGE,
  CREATE_BOOKING_MESSAGE,
  DELETE_BOOKING_MESSAGE,
  BOOKING_SUMMARY_MESSAGE,
  REJECTED_APPOINTMENT_MESSAGE,
  ACCEPTED_APPOINTMENT_MESSAGE,
};
