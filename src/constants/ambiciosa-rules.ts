import { AmbiciosaOptionalRule, AmbiciosaRuleSettings } from '../types/ambiciosa';

export const AMBICIOSA_OPTIONAL_RULES: AmbiciosaOptionalRule[] = [
  {
    id: 'ambitionBust',
    name: 'Ambicion sin puntos',
    shortName: 'Ambicion',
    category: 'Castigos',
    description: 'Si alguien se ambiciona y termina sin nada, pierde 100 puntos.',
    actionLabel: 'Ambicion cero',
    points: -100,
  },
  {
    id: 'shortCutPenalty',
    name: 'Corte corto',
    shortName: 'Corte corto',
    category: 'Castigos',
    description: 'Si bajas algo menor, como rey, pero cortaste 100, se restan 150 puntos.',
    actionLabel: 'Corte corto',
    points: -150,
  },
  {
    id: 'droppedDice',
    name: 'Dado caido',
    shortName: 'Dado caido',
    category: 'Dados',
    description: 'Regla activa para decidir que pasa cuando un dado se sale de la mesa.',
  },
  {
    id: 'tripleJack',
    name: 'Triple Jack',
    shortName: 'Triple J',
    category: 'Especiales',
    description: 'Regla especial cuando salen tres jotas. El efecto se define por la mesa.',
  },
];

export const DEFAULT_AMBICIOSA_RULE_SETTINGS: AmbiciosaRuleSettings = {
  ambitionBust: true,
  shortCutPenalty: true,
  droppedDice: false,
  tripleJack: false,
};
