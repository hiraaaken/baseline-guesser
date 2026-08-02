import raw from './baseline-css-properties.json';
import type { CssPropertyData } from './types';

const all: CssPropertyData[] = raw as CssPropertyData[];

// quiz.ts の generateQuestions は baselineDate 昇順であることを前提にしている
export const properties: CssPropertyData[] = all
	.filter((p) => p.baselineStatus !== 'limited')
	.sort((a, b) => (a.baselineDate as string).localeCompare(b.baselineDate as string));

export const limitedProperties: CssPropertyData[] = all.filter(
	(p) => p.baselineStatus === 'limited'
);

export const propertiesByName: Map<string, CssPropertyData> = new Map(all.map((p) => [p.name, p]));
