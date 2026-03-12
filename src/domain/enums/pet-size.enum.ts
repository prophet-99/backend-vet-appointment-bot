export enum PetSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export const getPetSizeDisplayName = (size: PetSize): string => {
  const displayNames: Record<PetSize, string> = {
    [PetSize.SMALL]: 'Pequeño',
    [PetSize.MEDIUM]: 'Mediano',
    [PetSize.LARGE]: 'Grande',
  };

  return displayNames[size];
};
