export type BreadcrumbErrorCode = 'INVALID_PATH'

/** Every error this package throws. `code` is stable and documented; `message` is for humans. */
export class BreadcrumbError extends Error {
  readonly code: BreadcrumbErrorCode

  constructor(code: BreadcrumbErrorCode, message: string) {
    super(message)
    this.name = 'BreadcrumbError'
    this.code = code
  }
}
