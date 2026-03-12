export enum ServiceName {
  SIMPLE_BATH = 'bano_simple',
  MEDICATED_BATH = 'bano_medicado',
  CUT_BATH = 'bano_corte',
  DEWORMING = 'desparacitacion',
  VACCINATION = 'vacuna',
}

export const getServiceNames: () => string[] = () => {
  return Object.values(ServiceName);
};

export const getServiceDisplayNames: () => string[] = () => {
  const mappedNames: Record<ServiceName, string> = {
    [ServiceName.SIMPLE_BATH]: 'Baño simple',
    [ServiceName.MEDICATED_BATH]: 'Baño medicado',
    [ServiceName.CUT_BATH]: 'Baño con corte',
    [ServiceName.DEWORMING]: 'Desparasitación',
    [ServiceName.VACCINATION]: 'Vacunación',
  };

  return Object.values(ServiceName).map((service) => {
    return mappedNames[service];
  });
};
