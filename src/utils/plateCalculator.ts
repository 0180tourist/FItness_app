import { PlateInventoryItem, PlateCalculationResult } from '../types/workout';

export const DEFAULT_PLATES: PlateInventoryItem[] = [
  { weight: 20, pairs: 2, enabled: true, color: '#3B82F6' }, // 20kg 파랑
  { weight: 15, pairs: 1, enabled: true, color: '#EAB308' }, // 15kg 노랑
  { weight: 10, pairs: 2, enabled: true, color: '#10B981' }, // 10kg 초록
  { weight: 5, pairs: 2, enabled: true, color: '#F3F4F6' },  // 5kg 흰색
  { weight: 2.5, pairs: 2, enabled: true, color: '#4B5563' },// 2.5kg 검정
  { weight: 1.25, pairs: 2, enabled: true, color: '#9CA3AF' } // 1.25kg 은색
];

export function getPlateColor(weight: number): string {
  switch (weight) {
    case 25: return '#EF4444'; // 빨강
    case 20: return '#3B82F6'; // 파랑
    case 15: return '#EAB308'; // 노랑
    case 10: return '#10B981'; // 초록
    case 5: return '#F3F4F6';  // 흰색
    case 2.5: return '#4B5563'; // 검정
    case 1.25: return '#9CA3AF'; // 은색
    default: return '#A855F7';
  }
}

/**
 * Calculates optimal plate combination for one side of a barbell
 */
export function calculatePlates(
  targetWeight: number,
  barWeight = 20,
  inventory: PlateInventoryItem[] = DEFAULT_PLATES
): PlateCalculationResult {
  // If target weight is less than or equal to bar weight
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      perSideWeight: 0,
      platesPerSide: [],
      totalActualWeight: barWeight,
      differenceKg: Math.max(0, barWeight - targetWeight),
      isExact: targetWeight === barWeight,
      isImpossible: false
    };
  }

  const neededPerSide = (targetWeight - barWeight) / 2;

  // Strictly filter enabled plates with at least 1 pair
  const activePlates = (inventory || [])
    .filter(p => p && p.enabled === true && p.pairs > 0 && p.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  // If no active plates are enabled
  if (activePlates.length === 0) {
    return {
      targetWeight,
      barWeight,
      perSideWeight: 0,
      platesPerSide: [],
      totalActualWeight: barWeight,
      differenceKg: targetWeight - barWeight,
      isExact: targetWeight === barWeight,
      isImpossible: targetWeight > barWeight
    };
  }

  // Flatten available plates per side: each plate up to `pairs` times
  const availablePlates: number[] = [];
  activePlates.forEach(p => {
    for (let i = 0; i < p.pairs; i++) {
      availablePlates.push(p.weight);
    }
  });

  const maxPossiblePerSide = availablePlates.reduce((sum, w) => sum + w, 0);

  // If even all plates combined cannot reach target
  if (maxPossiblePerSide < neededPerSide) {
    // Return all available plates
    const grouped = groupPlates(availablePlates, activePlates);
    const totalActualWeight = barWeight + 2 * maxPossiblePerSide;
    return {
      targetWeight,
      barWeight,
      perSideWeight: maxPossiblePerSide,
      platesPerSide: grouped,
      totalActualWeight,
      differenceKg: targetWeight - totalActualWeight, // underflow
      isExact: false,
      isImpossible: true
    };
  }

  // 1. Try to find EXACT match with branch-and-bound (favoring larger plates)
  const exactCombo = findCombination(activePlates, neededPerSide, true);
  if (exactCombo) {
    return {
      targetWeight,
      barWeight,
      perSideWeight: neededPerSide,
      platesPerSide: groupPlates(exactCombo, activePlates),
      totalActualWeight: targetWeight,
      differenceKg: 0,
      isExact: true,
      isImpossible: false
    };
  }

  // 2. No exact match found -> Find minimal overflow combo (sum > neededPerSide, minimal sum)
  const overflowCombo = findMinimalOverflow(activePlates, neededPerSide);
  if (overflowCombo) {
    const overflowSum = overflowCombo.reduce((acc, val) => acc + val, 0);
    const totalActualWeight = barWeight + 2 * overflowSum;
    return {
      targetWeight,
      barWeight,
      perSideWeight: overflowSum,
      platesPerSide: groupPlates(overflowCombo, activePlates),
      totalActualWeight,
      differenceKg: totalActualWeight - targetWeight,
      isExact: false,
      isImpossible: false
    };
  }

  // Fallback
  return {
    targetWeight,
    barWeight,
    perSideWeight: 0,
    platesPerSide: [],
    totalActualWeight: barWeight,
    differenceKg: Math.abs(barWeight - targetWeight),
    isExact: false,
    isImpossible: true
  };
}

/**
 * Finds exact combination using DFS prioritizing larger plates
 */
function findCombination(
  activePlates: PlateInventoryItem[],
  target: number,
  exactOnly: boolean
): number[] | null {
  const EPSILON = 0.001;
  let bestResult: number[] | null = null;

  function dfs(plateIndex: number, currentSum: number, currentSelection: number[]): boolean {
    if (Math.abs(currentSum - target) < EPSILON) {
      bestResult = [...currentSelection];
      return true;
    }
    if (currentSum > target + EPSILON) {
      return false;
    }
    if (plateIndex >= activePlates.length) {
      return false;
    }

    const plate = activePlates[plateIndex];

    // Try picking 0 up to plate.pairs of this plate, descending to use more larger plates
    for (let count = plate.pairs; count >= 0; count--) {
      const addedSum = count * plate.weight;
      if (currentSum + addedSum <= target + EPSILON) {
        const nextSelection = [...currentSelection];
        for (let i = 0; i < count; i++) {
          nextSelection.push(plate.weight);
        }
        if (dfs(plateIndex + 1, currentSum + addedSum, nextSelection)) {
          return true;
        }
      }
    }
    return false;
  }

  dfs(0, 0, []);
  return bestResult;
}

/**
 * Finds minimal combination with sum > target
 */
function findMinimalOverflow(
  activePlates: PlateInventoryItem[],
  target: number
): number[] | null {
  const EPSILON = 0.001;
  let minOverflowSum = Infinity;
  let bestCombo: number[] | null = null;

  function dfs(plateIndex: number, currentSum: number, currentSelection: number[]) {
    // If we've already exceeded our best known overflow, prune
    if (currentSum >= minOverflowSum) {
      return;
    }

    // If currentSum > target, this is a candidate overflow
    if (currentSum > target + EPSILON) {
      if (currentSum < minOverflowSum || (Math.abs(currentSum - minOverflowSum) < EPSILON && (!bestCombo || currentSelection.length < bestCombo.length))) {
        minOverflowSum = currentSum;
        bestCombo = [...currentSelection];
      }
      return;
    }

    if (plateIndex >= activePlates.length) {
      return;
    }

    const plate = activePlates[plateIndex];

    for (let count = plate.pairs; count >= 0; count--) {
      const nextSelection = [...currentSelection];
      for (let i = 0; i < count; i++) {
        nextSelection.push(plate.weight);
      }
      dfs(plateIndex + 1, currentSum + count * plate.weight, nextSelection);
    }
  }

  dfs(0, 0, []);
  return bestCombo;
}

function groupPlates(
  plates: number[],
  inventory: PlateInventoryItem[]
): { weight: number; count: number; color: string }[] {
  const counts: Record<number, number> = {};
  plates.forEach(w => {
    counts[w] = (counts[w] || 0) + 1;
  });

  const sortedWeights = Object.keys(counts)
    .map(Number)
    .sort((a, b) => b - a);

  return sortedWeights.map(weight => {
    const item = inventory.find(p => p.weight === weight);
    return {
      weight,
      count: counts[weight],
      color: item?.color || getPlateColor(weight)
    };
  });
}
