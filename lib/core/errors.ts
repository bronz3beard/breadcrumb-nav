export type BreadcrumbErrorCode =
  | 'INVALID_PATH'
  | 'LABEL_WITHOUT_ROUTE'
  | 'LABELS_REQUIRE_ROUTES'
  | 'PARENT_CYCLE'
  | 'UNKNOWN_PARENT'
  | 'BASE_URL_REQUIRED'
  | 'INVALID_BASE_URL'

/** Every error this package throws. `code` is stable and documented; `message` is for humans. */
export class BreadcrumbError extends Error {
  readonly code: BreadcrumbErrorCode

  constructor(code: BreadcrumbErrorCode, message: string) {
    super(message)
    this.name = 'BreadcrumbError'
    this.code = code
  }
}
