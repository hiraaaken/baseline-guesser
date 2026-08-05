import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { propertiesByName } from '$lib/server/data/properties';
import type { AnswerResult } from '$lib/types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json().catch(() => null)) as
		| { questionToken?: string; choice?: string }
		| null;
	const questionToken = body?.questionToken;
	const choice = body?.choice;

	if (typeof questionToken !== 'string' || typeof choice !== 'string') {
		throw error(400, 'invalid request body');
	}

	const kv = platform?.env.QUIZ_KV;
	if (!kv) {
		throw error(500, 'QUIZ_KV binding is not configured');
	}

	const correctAnswer = await kv.get(questionToken);
	if (correctAnswer === null) {
		throw error(410, 'question expired or already answered');
	}

	await kv.delete(questionToken);

	const description = propertiesByName.get(correctAnswer)?.description;

	return json({
		correct: choice === correctAnswer,
		correctAnswer,
		description
	} satisfies AnswerResult);
};
