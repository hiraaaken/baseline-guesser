import type { CssPropertyData } from './data/types';
import type { CourseDefinition } from './courses';

export interface GeneratedQuestion {
	answer: CssPropertyData;
	choices: string[];
}

export function pickDistractors(
	properties: CssPropertyData[],
	answerIndex: number,
	windowSize: number,
	rng: () => number = Math.random
): CssPropertyData[] {
	const half = Math.floor(windowSize / 2);
	let start = Math.max(0, answerIndex - half);
	const end = Math.min(properties.length, start + windowSize);
	start = Math.max(0, end - windowSize);

	const windowCandidates: CssPropertyData[] = [];
	for (let i = start; i < end; i++) {
		if (i !== answerIndex) windowCandidates.push(properties[i]);
	}

	const distractors = sampleUnique(windowCandidates, 3, rng);

	if (distractors.length < 3) {
		const chosenNames = new Set([properties[answerIndex].name, ...distractors.map((d) => d.name)]);
		const fallbackPool = properties.filter((p) => !chosenNames.has(p.name));
		const need = 3 - distractors.length;
		distractors.push(...sampleUnique(fallbackPool, need, rng));
	}

	return distractors;
}

export function generateQuestions(
	properties: CssPropertyData[],
	course: CourseDefinition,
	rng: () => number = Math.random
): GeneratedQuestion[] {
	if (properties.length < 4) {
		throw new Error('4択を作るには最低4件のプロパティが必要です');
	}

	const usedIndices = new Set<number>();
	const questionCount = Math.min(course.questionCount, properties.length);
	const questions: GeneratedQuestion[] = [];

	for (let q = 0; q < questionCount; q++) {
		let answerIndex: number;
		do {
			answerIndex = Math.floor(rng() * properties.length);
		} while (usedIndices.has(answerIndex));
		usedIndices.add(answerIndex);

		const answer = properties[answerIndex];
		const distractors = pickDistractors(properties, answerIndex, course.distractorWindow, rng);
		const choices = shuffle([answer.name, ...distractors.map((d) => d.name)], rng);

		questions.push({ answer, choices });
	}

	return questions;
}

function sampleUnique<T>(arr: T[], n: number, rng: () => number): T[] {
	const pool = [...arr];
	const result: T[] = [];
	for (let i = 0; i < n && pool.length > 0; i++) {
		const idx = Math.floor(rng() * pool.length);
		result.push(pool.splice(idx, 1)[0]);
	}
	return result;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
