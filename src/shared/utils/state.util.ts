import type { BookingState } from '@domain/models/booking-store.model';
import type { AIResponseSchema } from '@infraestructure/ai/ai-response.schema';

/**
 * Extracts JSON data from mixed text that contains both plain text and JSON.
 * This is useful when OpenAI responses mix bot replies with structured data.
 *
 * @param text - The mixed text containing JSON fragments
 * @returns Extracted JSON object or null if extraction fails
 *
 * @example
 * const mixed = 'Hello! {"botReply":"Hi","petName":"Max"}';
 * const result = extractJSONFromMixedText(mixed);
 * // Result: { botReply: "Hi", petName: "Max" }
 */
export const extractJSONFromMixedText = (text: string): any | null => {
  try {
    // Primero intentar parsear como JSON normal
    try {
      return JSON.parse(text);
    } catch {
      // Continuar con extracción manual
    }

    // Buscar el último objeto JSON válido en el texto
    const jsonMatches = text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    const matches = Array.from(jsonMatches);

    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(matches[i][0]);
      } catch {
        continue;
      }
    }

    // Intentar extraer campos individuales (usar ÚLTIMA ocurrencia de cada campo)
    const extracted: any = {};

    // Patrones más flexibles para manejar texto mezclado
    const patterns = {
      botReply: /"botReply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g,
      preferredDate: /"preferredDate"\s*:\s*"([^"]+?)"/g,
      preferredTime: /"preferredTime"\s*:\s*"([^"]+?)"/g,
      servicesName: /"servicesName"\s*:\s*(\[[^\]]*\])/g,
      petSize: /"petSize"\s*:\s*(?:"([^"]*?)"|null)/g,
      petName: /"petName"\s*:\s*(?:"([^"]*?)"|null)/g,
      breedText: /"breedText"\s*:\s*"([^"]*?)"/g,
      ownerName: /"ownerName"\s*:\s*"([^"]*?)"/g,
      notes: /"notes"\s*:\s*"([^"]*?)"/g,
    };

    for (const [key, regex] of Object.entries(patterns)) {
      const allMatches = Array.from(text.matchAll(regex));
      if (allMatches.length > 0) {
        // Usar la ÚLTIMA ocurrencia
        const lastMatch = allMatches[allMatches.length - 1];

        if (key === 'servicesName') {
          try {
            extracted[key] = JSON.parse(lastMatch[1]);
          } catch {
            extracted[key] = [];
          }
        } else {
          const value = lastMatch[1];
          extracted[key] = value === 'null' || !value ? null : value;
        }
      }
    }

    return Object.keys(extracted).length > 0 ? extracted : null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to extract JSON from mixed text:', err);
    return null;
  }
};

/**
 * Extracts structured AI response from raw OpenAI output.
 * Handles cases where the response format is text with embedded JSON.
 *
 * @param rawOutput - The raw output array from OpenAI responses
 * @returns Extracted AIResponseSchema or null if extraction fails
 *
 * @example
 * const raw = [{ type: 'message', content: [{ type: 'output_text', text: '...' }] }];
 * const result = extractAIResponseFromRawOutput(raw);
 */
export const extractAIResponseFromRawOutput = (
  rawOutput: any[]
): AIResponseSchema | null => {
  if (!rawOutput || !Array.isArray(rawOutput)) return null;

  for (const item of rawOutput) {
    if (item.type === 'message' && item.content) {
      for (const content of item.content) {
        if (content.type === 'output_text') {
          // El texto puede estar en content.text o directamente en content
          const textContent = (content as any).text || '';
          if (textContent) {
            let extracted = extractJSONFromMixedText(textContent);

            // Si el JSON tiene un wrapper "booking_state", desanidarlo
            if (extracted && typeof extracted === 'object') {
              if (
                'booking_state' in extracted &&
                typeof extracted.booking_state === 'object'
              ) {
                extracted = extracted.booking_state;
              }
            }

            if (extracted) {
              return extracted as AIResponseSchema;
            }
          }
        }
      }
    }
  }

  return null;
};

/**
 * Gets a safe bot reply from AI response with fallback message.
 * Ensures the user always receives a response even if parsing fails.
 *
 * @param aiResponse - The AI response schema (can be null)
 * @returns A valid bot reply string
 *
 * @example
 * const reply = getSafeBotReply(null);
 * // Returns: "Disculpa, tuve un problema procesando tu mensaje. ¿Podrías repetirlo?"
 */
export const getSafeBotReply = (
  aiResponse: AIResponseSchema | null
): string => {
  if (aiResponse?.botReply && aiResponse.botReply.trim() !== '') {
    return aiResponse.botReply;
  }

  return 'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo? Si el problema persiste, puedo ayudarte a agendar tu cita paso a paso.';
};

/**
 * Merges a partial BookingState patch into a current state object.
 *
 * This utility applies only defined values from the patch, avoiding overwriting
 * existing data with undefined values. This is useful for preserving previously
 * stored information when updates are incomplete or null.
 *
 * @template T - The type of the current state (must extend Partial<BookingState>)
 * @param currentState - The base state object to patch
 * @param toPatch - The partial state updates to apply. Only defined values are merged.
 * @returns A new state object with merged values, preserving type T
 *
 * @example
 * const state: Partial<BookingState> = { ownerName: 'Juan', petName: 'Max' };
 * const patch: Partial<BookingState> = { ownerName: 'Carlos', notes: 'Nueva nota' };
 * const result = patchBookingState(state, patch);
 * // Result: { ownerName: 'Carlos', petName: 'Max', notes: 'Nueva nota' }
 *
 * @example
 * // Undefined values in patch do NOT overwrite existing values
 * const state: Partial<BookingState> = { petSize: 'LARGE' };
 * const patch: Partial<BookingState> = { petSize: undefined };
 * const result = patchBookingState(state, patch);
 * // Result: { petSize: 'LARGE' } (petSize is preserved)
 */
export const patchBookingState = <T extends Partial<BookingState>>(
  currentState: T,
  toPatch?: Partial<BookingState>
): T => {
  if (!toPatch) return currentState;

  let patchedState = { ...currentState } as T;

  (Object.keys(toPatch) as (keyof BookingState)[]).forEach((key) => {
    const value = toPatch[key];
    if (value !== undefined) {
      patchedState = { ...patchedState, [key]: value };
    }
  });

  return patchedState;
};
