export type CourseId = 'beginner' | 'intermediate' | 'advanced' | 'limited';

export interface CourseDefinition {
	id: CourseId;
	label: string;
	questionCount: number;
	// datedコース(beginner/intermediate/advanced)のみで使用
	distractorWindow?: number;
}

export const COURSES: Record<CourseId, CourseDefinition> = {
	beginner: {
		id: 'beginner',
		label: '初級',
		questionCount: 5,
		distractorWindow: 40
	},
	intermediate: {
		id: 'intermediate',
		label: '中級',
		questionCount: 10,
		distractorWindow: 16
	},
	advanced: {
		id: 'advanced',
		label: '上級',
		questionCount: 15,
		distractorWindow: 6
	},
	limited: {
		id: 'limited',
		label: '限定対応(Limited availability)',
		questionCount: 10
	}
};

export function isCourseId(value: string): value is CourseId {
	return value in COURSES;
}
