/**
 * Business enum labels — resolved via i18n (boat.type.*, boat.motorization.*).
 * Use boatTypeLabel() / motorizationLabel() in components so language switches update the UI.
 */

import i18n from '../i18n'
import { BoatType, MotorizationType } from '../types'

export function boatTypeLabel(type: BoatType): string {
  return i18n.t(`boat.type.${type}`)
}

export function motorizationLabel(type: MotorizationType): string {
  return i18n.t(`boat.motorization.${type}`)
}

const boatTypeKeys = Object.values(BoatType)

/** @deprecated Prefer boatTypeLabel(type) — kept for gradual migration */
export const BOAT_TYPE_LABELS = new Proxy({} as Record<BoatType, string>, {
  get: (_target, prop: string) => boatTypeLabel(prop as BoatType),
  ownKeys: () => boatTypeKeys,
  getOwnPropertyDescriptor: (_target, prop) => ({
    enumerable: true,
    configurable: true,
    value: boatTypeLabel(prop as BoatType),
  }),
})

const motorizationKeys = Object.values(MotorizationType)

/** @deprecated Prefer motorizationLabel(type) */
export const MOTORIZATION_LABELS = new Proxy({} as Record<MotorizationType, string>, {
  get: (_target, prop: string) => motorizationLabel(prop as MotorizationType),
  ownKeys: () => motorizationKeys,
  getOwnPropertyDescriptor: (_target, prop) => ({
    enumerable: true,
    configurable: true,
    value: motorizationLabel(prop as MotorizationType),
  }),
})
