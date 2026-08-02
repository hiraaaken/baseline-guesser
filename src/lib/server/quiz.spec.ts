import { describe, expect, it } from 'vitest';
import {
	generateQuestions,
	pickDistractors,
	generateLimitedQuestions,
	pickDistractorsBySupportPattern
} from './quiz';
import type { CssPropertyData } from './data/types';
import type { CourseDefinition } from './courses';

function makeProperties(count: number): CssPropertyData[] {
	return Array.from({ length: count }, (_, i) => ({
		name: `prop-${i}`,
		baselineStatus: 'high',
		baselineDate: `2000-01-${String((i % 28) + 1).padStart(2, '0')}`,
		support: { chrome: '1', edge: '1', firefox: '1', safari: '1' },
		description: `description for prop-${i}`
	}));
}

function sequentialRng(seed = 0) {
	let value = seed;
	return () => {
		value = (value + 0.137) % 1;
		return value;
	};
}

describe('pickDistractors', () => {
	it('十分な件数がある場合、window内から正解と異なる3件を返す', () => {
		const properties = makeProperties(100);
		const answerIndex = 50;
		const windowSize = 10;
		const distractors = pickDistractors(properties, answerIndex, windowSize, sequentialRng());

		expect(distractors).toHaveLength(3);
		const names = distractors.map((d) => d.name);
		expect(new Set(names).size).toBe(3);
		expect(names).not.toContain(properties[answerIndex].name);

		// windowの範囲(answerIndex±5付近)に収まっていること
		for (const d of distractors) {
			const idx = properties.indexOf(d);
			expect(Math.abs(idx - answerIndex)).toBeLessThanOrEqual(windowSize);
		}
	});

	it('配列の端でwindowが偏っても3件返す', () => {
		const properties = makeProperties(20);
		const distractors = pickDistractors(properties, 0, 10, sequentialRng());
		expect(distractors).toHaveLength(3);
		expect(distractors.map((d) => d.name)).not.toContain(properties[0].name);
	});

	it('windowが極端に小さくても、全体プールへのフォールバックで3件揃える', () => {
		const properties = makeProperties(20);
		const distractors = pickDistractors(properties, 5, 1, sequentialRng());
		expect(distractors).toHaveLength(3);
		const names = distractors.map((d) => d.name);
		expect(new Set(names).size).toBe(3);
		expect(names).not.toContain(properties[5].name);
	});

	it('プロパティ総数がwindowサイズより少なくても3件揃える', () => {
		const properties = makeProperties(5);
		const distractors = pickDistractors(properties, 2, 40, sequentialRng());
		expect(distractors).toHaveLength(3);
	});
});

describe('generateQuestions', () => {
	const course: CourseDefinition = {
		id: 'beginner',
		label: '初級',
		questionCount: 5,
		distractorWindow: 10
	};

	it('コースで指定した問題数を生成する', () => {
		const properties = makeProperties(100);
		const questions = generateQuestions(properties, course, sequentialRng());
		expect(questions).toHaveLength(course.questionCount);
	});

	it('各問題は正解を含む重複のない4択を持つ', () => {
		const properties = makeProperties(100);
		const questions = generateQuestions(properties, course, sequentialRng());

		for (const q of questions) {
			expect(q.choices).toHaveLength(4);
			expect(new Set(q.choices).size).toBe(4);
			expect(q.choices).toContain(q.answer.name);
		}
	});

	it('同じ生成の中で正解が重複しない', () => {
		const properties = makeProperties(100);
		const questions = generateQuestions(properties, course, sequentialRng());
		const answerNames = questions.map((q) => q.answer.name);
		expect(new Set(answerNames).size).toBe(answerNames.length);
	});

	it('プロパティ数が問題数より少ない場合、問題数を切り詰める', () => {
		const properties = makeProperties(3 + 4); // 4択に必要な最低件数はギリギリ確保
		const smallCourse: CourseDefinition = { ...course, questionCount: 20 };
		const questions = generateQuestions(properties, smallCourse, sequentialRng());
		expect(questions.length).toBeLessThanOrEqual(properties.length);
	});
});

function makeLimitedProperty(
	name: string,
	support: Partial<CssPropertyData['support']>
): CssPropertyData {
	return {
		name,
		baselineStatus: 'limited',
		baselineDate: null,
		support: { chrome: null, edge: null, firefox: null, safari: null, ...support },
		description: `description for ${name}`
	};
}

describe('pickDistractorsBySupportPattern', () => {
	it('対応ブラウザのパターンが近い(Hamming距離が小さい)ものを優先して選ぶ', () => {
		const properties = [
			makeLimitedProperty('answer', { chrome: '1', edge: '1', firefox: '1', safari: '1' }),
			makeLimitedProperty('close-1', { chrome: '1', edge: '1', firefox: '1', safari: null }), // distance 1
			makeLimitedProperty('close-2', { chrome: '1', edge: '1', firefox: null, safari: '1' }), // distance 1
			makeLimitedProperty('close-3', { chrome: '1', edge: null, firefox: '1', safari: '1' }), // distance 1
			makeLimitedProperty('far-1', {}), // distance 4(全非対応)
			makeLimitedProperty('far-2', { firefox: '1' }) // distance 3
		];

		const distractors = pickDistractorsBySupportPattern(properties, 0, sequentialRng());
		const names = distractors.map((d) => d.name).sort();

		expect(names).toHaveLength(3);
		expect(names).not.toContain('answer');
		expect(names).toEqual(['close-1', 'close-2', 'close-3']);
	});
});

describe('generateLimitedQuestions', () => {
	function makeLimitedProperties(count: number): CssPropertyData[] {
		return Array.from({ length: count }, (_, i) =>
			makeLimitedProperty(`limited-${i}`, {
				chrome: i % 2 === 0 ? '1' : null,
				edge: i % 3 === 0 ? '1' : null,
				firefox: i % 4 === 0 ? '1' : null,
				safari: i % 5 === 0 ? '1' : null
			})
		);
	}

	it('指定した問題数を生成する', () => {
		const properties = makeLimitedProperties(30);
		const questions = generateLimitedQuestions(properties, 10, sequentialRng());
		expect(questions).toHaveLength(10);
	});

	it('各問題は正解を含む重複のない4択を持つ', () => {
		const properties = makeLimitedProperties(30);
		const questions = generateLimitedQuestions(properties, 10, sequentialRng());

		for (const q of questions) {
			expect(q.choices).toHaveLength(4);
			expect(new Set(q.choices).size).toBe(4);
			expect(q.choices).toContain(q.answer.name);
		}
	});

	it('正解が重複しない', () => {
		const properties = makeLimitedProperties(30);
		const questions = generateLimitedQuestions(properties, 10, sequentialRng());
		const names = questions.map((q) => q.answer.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
