export interface ParsedSet {
  setNumber: number;
  targetWeight: number;
  targetReps: number;
}

export interface ParsedExercise {
  exerciseName: string;
  sets: ParsedSet[];
}

export const AI_PROMPT_COPY_TEMPLATE = `Create a workout routine in this exact CSV format without units:
[Exercise Name], [Set Number], [Weight], [Reps]

Example:
Dumbbell Press, 1, 10, 10
Dumbbell Press, 2, 10, 11
Dumbbell Press, 3, 12, 8
Bench Press, 1, 60, 10
Bench Press, 2, 80, 8
Bench Press, 3, 90, 6`;

export const SAMPLE_AI_ROUTINE_TEXT = `Dumbbell Press, 1, 10, 10
Dumbbell Press, 2, 10, 11
Dumbbell Press, 3, 12, 8
Bench Press, 1, 60, 10
Bench Press, 2, 80, 8
Bench Press, 3, 90, 6
Barbell Row, 1, 50, 10
Barbell Row, 2, 60, 8
Barbell Row, 3, 60, 8`;

/**
 * Intelligent parser that handles:
 * 1. Recommended CSV format: Exercise Name, Set Number, Weight, Reps
 * 2. Units in cells: "Dumbbell Press, 1세트, 10kg, 10회"
 * 3. Conversational / bullet list lines: "1. Bench Press: 60kg 10 reps, 80kg 8 reps"
 */
export function parseAIRoutineText(rawText: string): ParsedExercise[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

  // Intermediate flat parsed rows: { exerciseName, setNumber, weight, reps }
  const flatRows: { exerciseName: string; setNumber?: number; weight: number; reps: number }[] = [];

  for (const line of lines) {
    // Check if line is CSV / comma / tab / pipe separated
    // Matches: Name, Set, Weight, Reps
    const parts = line.split(/[,;\t|]+/).map(p => p.trim());

    if (parts.length >= 4) {
      // Possible CSV row: [Name, Set, Weight, Reps]
      const name = cleanExerciseName(parts[0]);
      const setVal = extractNumber(parts[1]);
      const weightVal = extractNumber(parts[2]);
      const repsVal = extractNumber(parts[3]);

      if (name && !isNaN(weightVal) && !isNaN(repsVal)) {
        flatRows.push({
          exerciseName: name,
          setNumber: !isNaN(setVal) && setVal > 0 ? setVal : undefined,
          weight: Math.max(0, weightVal),
          reps: Math.max(1, repsVal)
        });
        continue;
      }
    } else if (parts.length === 3) {
      // Shorthand: Name, Weight, Reps
      const name = cleanExerciseName(parts[0]);
      const weightVal = extractNumber(parts[1]);
      const repsVal = extractNumber(parts[2]);

      if (name && !isNaN(weightVal) && !isNaN(repsVal)) {
        flatRows.push({
          exerciseName: name,
          weight: Math.max(0, weightVal),
          reps: Math.max(1, repsVal)
        });
        continue;
      }
    }

    // Fallback: Free text line with colon or dash or numbers
    // e.g. "1. Bench Press: 60kg 10, 80kg 8" or "Squat - 100kg x 5, 110kg x 5"
    parseFreeTextLine(line, flatRows);
  }

  // Group flatRows by exerciseName while maintaining original discovery order
  const exerciseMap: Map<string, ParsedSet[]> = new Map();

  for (const row of flatRows) {
    const normName = row.exerciseName;
    if (!exerciseMap.has(normName)) {
      exerciseMap.set(normName, []);
    }
    const sets = exerciseMap.get(normName)!;
    const nextSetNumber = row.setNumber || sets.length + 1;

    sets.push({
      setNumber: nextSetNumber,
      targetWeight: row.weight,
      targetReps: row.reps
    });
  }

  // Ensure sets inside each exercise are sorted by setNumber
  const result: ParsedExercise[] = [];
  exerciseMap.forEach((sets, name) => {
    sets.sort((a, b) => a.setNumber - b.setNumber);
    // Renumber sequentially in case set numbers had gaps
    const normalizedSets = sets.map((s, idx) => ({
      ...s,
      setNumber: idx + 1
    }));
    result.push({
      exerciseName: name,
      sets: normalizedSets
    });
  });

  return result;
}

function cleanExerciseName(raw: string): string {
  // Strip leading list numbers like "1.", "1)", "-", "•"
  return raw.replace(/^[\d]+[\.\)\-]?\s*/, '').replace(/^[-•*]\s*/, '').trim();
}

function extractNumber(str: string): number {
  if (!str) return NaN;
  // Match first decimal or integer in string: e.g. "10kg" -> 10, "12.5" -> 12.5, "2세트" -> 2
  const match = str.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : NaN;
}

function parseFreeTextLine(
  line: string,
  output: { exerciseName: string; setNumber?: number; weight: number; reps: number }[]
) {
  // Try splitting by ':' or '-'
  let namePart = '';
  let restPart = line;

  if (line.includes(':')) {
    const split = line.split(':');
    namePart = cleanExerciseName(split[0]);
    restPart = split.slice(1).join(':');
  } else if (line.includes('-')) {
    const split = line.split('-');
    namePart = cleanExerciseName(split[0]);
    restPart = split.slice(1).join('-');
  }

  if (!namePart) {
    // If no separator, attempt to separate name from first number
    const match = line.match(/^([^\d]+)(.*)$/);
    if (match) {
      namePart = cleanExerciseName(match[1]);
      restPart = match[2];
    }
  }

  if (!namePart) return;

  // Now scan restPart for set patterns: e.g. "60kg x 10", "80kg 8reps", "80kg 8"
  // Split multiple sets by commas or slashes
  const setChunks = restPart.split(/[,/]+/).map(c => c.trim()).filter(Boolean);

  let setCounter = 1;
  for (const chunk of setChunks) {
    // Check pattern: [Weight] ... [Reps]
    const numbers = chunk.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 2) {
      const weight = parseFloat(numbers[0]);
      const reps = parseInt(numbers[1], 10);
      output.push({
        exerciseName: namePart,
        setNumber: setCounter++,
        weight,
        reps
      });
    }
  }
}
