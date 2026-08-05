import raw from './baseline-css-properties.json';
import type { CssPropertyData } from './types';

const all: CssPropertyData[] = raw as CssPropertyData[];

// quiz.ts の generateQuestions は baselineDate 昇順であることを前提にしている
// (baselineDateを持たないlimitedは末尾に寄せる)
export const properties: CssPropertyData[] = [...all].sort((a, b) => {
	const dateA = a.baselineDate ?? '9999-99-99';
	const dateB = b.baselineDate ?? '9999-99-99';
	return dateA.localeCompare(dateB);
});

export const propertiesByName: Map<string, CssPropertyData> = new Map(all.map((p) => [p.name, p]));
