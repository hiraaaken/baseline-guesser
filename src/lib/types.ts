import type { BaselineStatus, CssPropertyData } from './server/data/types';

export type { BaselineStatus };
export type { CourseId } from './server/courses';

export interface QuizQuestion {
	questionToken: string;
	baselineStatus: BaselineStatus;
	baselineDate: string | null;
	support: CssPropertyData['support'];
	choices: string[];
}

export interface CourseStartResponse {
	questions: QuizQuestion[];
}

export interface AnswerRequest {
	questionToken: string;
	choice: string;
}

export interface AnswerResult {
	correct: boolean;
	correctAnswer: string;
	description?: string;
}
