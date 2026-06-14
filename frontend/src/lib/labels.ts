/**
 * Traductions françaises des énumérations métier.
 * Source unique pour tous les composants - évite les divergences entre vues.
 * Typage strict avec les enums : si une valeur est ajoutée à l'enum, TypeScript
 * signalera immédiatement une clé manquante ici.
 */

import { BoatType, MotorizationType } from '../types'

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.SAILBOAT]: 'Voilier',
  [BoatType.CATAMARAN]: 'Catamaran',
  [BoatType.MOTORBOAT]: 'Bateau à moteur',
  [BoatType.INFLATABLE]: 'Pneumatique',
  [BoatType.YACHT]: 'Yacht',
  [BoatType.PONTOON]: 'Péniche',
  [BoatType.DINGHY]: 'Dériveur',
}

export const MOTORIZATION_LABELS: Record<MotorizationType, string> = {
  [MotorizationType.NONE]: 'Aucun',
  [MotorizationType.INBOARD]: 'Inboard',
  [MotorizationType.OUTBOARD]: 'Hors-bord',
  [MotorizationType.ELECTRIC]: 'Électrique',
  [MotorizationType.HYBRID]: 'Hybride',
}
