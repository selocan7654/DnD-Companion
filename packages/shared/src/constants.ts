/** Policy `can(user, action, resource)` action identifiers — [R-004] */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

/** Policy `can(user, action, resource)` resource identifiers — [R-004] */
export enum Resource {
  CAMPAIGN = 'campaign',
  CHARACTER = 'character',
  HOMEBREW = 'homebrew',
  USER = 'user',
}
