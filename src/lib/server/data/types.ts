export type BaselineStatus = 'high' | 'low' | 'limited';

interface CssPropertySupport {
	chrome: string | null;
	edge: string | null;
	firefox: string | null;
	safari: string | null;
}

interface CssPropertyBase {
	name: string;
	support: CssPropertySupport;
	description: string;
}

export interface DatedCssPropertyData extends CssPropertyBase {
	baselineStatus: 'high' | 'low';
	baselineDate: string;
}

export interface LimitedCssPropertyData extends CssPropertyBase {
	baselineStatus: 'limited';
	baselineDate: null;
}

export type CssPropertyData = DatedCssPropertyData | LimitedCssPropertyData;
