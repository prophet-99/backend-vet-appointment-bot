import { InteractionOption as DomainInteractionOption } from '@domain/enums/interaction-option.enum';

export class InteractionOptionAdapter {
  private static readonly toDomainMap: Record<string, DomainInteractionOption> =
    {
      ['MENU_BOOK']: DomainInteractionOption.MENU_CREATE,
      ['MENU_CANCEL_BOOK']: DomainInteractionOption.MENU_CANCEL,
      ['MENU_INFO']: DomainInteractionOption.MENU_INFO,
      ['MENU_HUMAN']: DomainInteractionOption.MENU_HUMAN,
      ['MENU_SHOW_OPTIONS']: DomainInteractionOption.MENU_SHOW_OPTIONS,
    };

  static toDomain(
    interactionOption: string | undefined
  ): DomainInteractionOption | undefined {
    if (!interactionOption) return undefined;

    const mapped = this.toDomainMap[interactionOption];
    if (!mapped) return undefined;

    return mapped;
  }
}
