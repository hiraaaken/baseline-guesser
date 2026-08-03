export type BaselineStatus = 'high' | 'low' | 'limited';

interface CssPropertySupport {
	chrome: string | null;
	edge: string | null;
	firefox: string | null;
	safari: string | null;
}

export type CssPropertyData =
	| {
			name: string;
			baselineStatus: 'high' | 'low';
			baselineDate: string;
			support: CssPropertySupport;
			description: string;
	  }
	| {
			name: string;
			baselineStatus: 'limited';
			baselineDate: null;
			support: CssPropertySupport;
			description: string;
	  };
