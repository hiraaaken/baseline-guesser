import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COURSES, isCourseId } from '$lib/server/courses';
import { properties } from '$lib/server/data/properties';
import { generateQuestions } from '$lib/server/quiz';
import type { CourseStartResponse, QuizQuestion } from '$lib/types';

const TOKEN_TTL_SECONDS = 60 * 15;

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json().catch(() => null)) as { courseId?: string } | null;
	const courseId = body?.courseId;

	if (typeof courseId !== 'string' || !isCourseId(courseId)) {
		throw error(400, 'invalid courseId');
	}

	const kv = platform?.env.QUIZ_KV;
	if (!kv) {
		throw error(500, 'QUIZ_KV binding is not configured');
	}

	const course = COURSES[courseId];
	const generated = generateQuestions(properties, course);

	const questions: QuizQuestion[] = await Promise.all(
		generated.map(async ({ answer, choices }) => {
			const questionToken = crypto.randomUUID();
			await kv.put(questionToken, answer.name, { expirationTtl: TOKEN_TTL_SECONDS });

			return {
				questionToken,
				baselineStatus: answer.baselineStatus,
				baselineDate: answer.baselineDate,
				support: answer.support,
				choices
			};
		})
	);

	return json({ questions } satisfies CourseStartResponse);
};
