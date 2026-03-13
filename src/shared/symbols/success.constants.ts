export const SuccessMessages = {
  REMOVE_CLOSURE_DAY: '✅ Día no laborable eliminado exitosamente.',
  ADD_CLOSURE_DAY: '✅ Día no laborable registrado exitosamente.',
} as const;

export type SuccessMessage =
  (typeof SuccessMessages)[keyof typeof SuccessMessages];
