// Detecta intención de hablar con humano/doctora (simple, expandible)
export const wantsHuman = (text: string) => {
  const t = text.toLowerCase();

  return (
    t.includes('doctora') ||
    t.includes('doctor') ||
    t.includes('humano') ||
    t.includes('persona') ||
    t.includes('asesor') ||
    t.includes('llamar') ||
    t.includes('hablar con') ||
    t.includes('atencion') ||
    t.includes('atención') ||
    t.includes('representante') ||
    t.includes('vet') ||
    t.includes('veterinario') ||
    t.includes('veterinaria') ||
    t.includes('propietaria') ||
    t.includes('propietario') ||
    t.includes('encargada') ||
    t.includes('encargado')
  );
};
