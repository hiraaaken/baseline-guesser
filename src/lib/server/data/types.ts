export type BaselineStatus = 'high' | 'low' | 'limited';

export interface CssPropertyData {
	name: string;
	baselineStatus: BaselineStatus;
	baselineDate: string | null;
	support: {
		chrome: string | null;
		edge: string | null;
		firefox: string | null;
		safari: string | null;
	};
	description: string;
}
