export class ClosureStatusDto {
  closed: boolean;
  reason?: string;

  constructor(closed: boolean, reason?: string) {
    this.closed = closed;
    this.reason = reason;
  }

  static fromClosure(
    closure: { reason?: string | null } | null
  ): ClosureStatusDto {
    if (!closure) return new ClosureStatusDto(false);
    return new ClosureStatusDto(true, closure.reason ?? 'N/A');
  }
}
