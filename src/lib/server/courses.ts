export type CourseId = 'beginner' | 'intermediate' | 'advanced';

export interface CourseDefinition {
	id: CourseId;
	label: string;
	questionCount: number;
	distractorWindow: number;
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
	}
};

export function isCourseId(value: string): value is CourseId {
	return value in COURSES;
}
