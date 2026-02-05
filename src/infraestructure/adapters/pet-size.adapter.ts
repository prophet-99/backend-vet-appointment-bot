import { PetSize as PrismaPetSize } from '@prisma/client';
import { PetSize as DomainPetSize } from '@domain/enums/pet-size.enum';

export class PetSizeAdapter {
  private static readonly toDomainMap: Record<PrismaPetSize, DomainPetSize> = {
    [PrismaPetSize.SMALL]: DomainPetSize.SMALL,
    [PrismaPetSize.MEDIUM]: DomainPetSize.MEDIUM,
    [PrismaPetSize.LARGE]: DomainPetSize.LARGE,
  };

  private static readonly toPrismaMap: Record<DomainPetSize, PrismaPetSize> = {
    [DomainPetSize.SMALL]: PrismaPetSize.SMALL,
    [DomainPetSize.MEDIUM]: PrismaPetSize.MEDIUM,
    [DomainPetSize.LARGE]: PrismaPetSize.LARGE,
  };

  static toDomain(prisma: PrismaPetSize): DomainPetSize {
    const mapped = this.toDomainMap[prisma];
    if (!mapped) {
      throw new Error(`Unknown Prisma PetSize: ${prisma}`);
    }

    return mapped;
  }

  static toPrisma(domain: DomainPetSize): PrismaPetSize {
    const mapped = this.toPrismaMap[domain];
    if (!mapped) {
      throw new Error(`Unknown Domain PetSize: ${domain}`);
    }

    return mapped;
  }
}
