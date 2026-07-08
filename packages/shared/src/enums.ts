export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum AuditAction {
  ROLE_CHANGED = 'ROLE_CHANGED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  CONTENT_EDITED = 'CONTENT_EDITED',
  CONTENT_DELETED = 'CONTENT_DELETED',
}

export enum AuditTargetType {
  USER = 'USER',
  CAMPAIGN = 'CAMPAIGN',
  CHARACTER = 'CHARACTER',
  HOMEBREW = 'HOMEBREW',
}

export enum CharacterVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum HomebrewStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum HomebrewType {
  BACKGROUND = 'BACKGROUND',
  FEAT = 'FEAT',
  MAGIC_ITEM = 'MAGIC_ITEM',
  MONSTER = 'MONSTER',
  SPELL = 'SPELL',
  SUBCLASS = 'SUBCLASS',
}

export enum UploadPurpose {
  AVATAR = 'avatar',
  PORTRAIT = 'portrait',
  BANNER = 'banner',
  HOMEBREW_IMAGE = 'homebrew-image',
}

export enum Source {
  PHB = 'PHB',
  DMG = 'DMG',
  MM = 'MM',
  XGTE = 'XGTE',
  TCOE = 'TCOE',
  FTOD = 'FTOD',
  VRGR = 'VRGR',
  MPMM = 'MPMM',
  SCAG = 'SCAG',
  ERLW = 'ERLW',
  EGW = 'EGW',
  GGR = 'GGR',
  SAiS = 'SAiS',
  SatO = 'SatO',
  AAG = 'AAG',
  BGG = 'BGG',
  PAitM = 'PAitM',
  BMT = 'BMT',
  PHB2024 = 'PHB2024',
  DMG2024 = 'DMG2024',
  MM2024 = 'MM2024',
  HOMEBREW = 'HOMEBREW',
}
