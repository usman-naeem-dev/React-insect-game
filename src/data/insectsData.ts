import Beetle from '../assets/insects/Beetle.png';
import Ant from '../assets/insects/Ant.png';
import Wasp from '../assets/insects/Wasp.png';
import type { InsectType } from '../game/types';

export interface InsectSpecies {
  id: number;
  imgSrc: string;
  name: InsectType;
  /** Base score before the combo multiplier. */
  points: number;
  /** Crawl speed in px/s before the difficulty scale is applied. */
  speed: number;
  /** Relative chance of being picked by the auto-spawner. */
  weight: number;
}

export const insectsData: InsectSpecies[] = [
  {
    id: 0,
    imgSrc: Beetle,
    name: 'Beetle',
    points: 10,
    speed: 55,
    weight: 4,
  },
  {
    id: 1,
    imgSrc: Ant,
    name: 'Ant',
    points: 15,
    speed: 95,
    weight: 3,
  },
  {
    id: 2,
    imgSrc: Wasp,
    name: 'Wasp',
    points: 25,
    speed: 150,
    weight: 2,
  },
];

export const speciesByName = (name: string): InsectSpecies | undefined =>
  insectsData.find((species) => species.name === name);

const totalWeight = insectsData.reduce((sum, s) => sum + s.weight, 0);

/** Weighted random pick — beetles are common, wasps are the rare high-value target. */
export const randomSpecies = (): InsectSpecies => {
  let roll = Math.random() * totalWeight;
  for (const species of insectsData) {
    roll -= species.weight;
    if (roll <= 0) return species;
  }
  return insectsData[0];
};
