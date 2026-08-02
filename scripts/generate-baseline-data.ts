import { features } from 'web-features';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { BaselineStatus, CssPropertyData } from '../src/lib/server/data/types.ts';

interface CompatKeyEntry {
	baseline: false | 'high' | 'low';
	baseline_high_date?: string;
	baseline_low_date?: string;
	support?: {
		chrome?: string;
		edge?: string;
		firefox?: string;
		safari?: string;
	};
}

interface Feature {
	kind: 'feature' | 'moved' | 'split';
	discouraged?: unknown;
	description?: string;
	status?: {
		by_compat_key?: Record<string, CompatKeyEntry>;
	};
}

const featureMap = features as unknown as Record<string, Feature>;

const OUTPUT_PATH = fileURLToPath(
	new URL('../src/lib/server/data/baseline-css-properties.json', import.meta.url)
);

// css.properties.<name> という素のプロパティキーのみを対象にする
// (css.properties.<name>.<context> のような値/文脈付きキーは除外)
const PLAIN_PROPERTY_KEY = /^css\.properties\.([a-zA-Z-]+)$/;

const properties: CssPropertyData[] = [];

for (const featureId of Object.keys(featureMap)) {
	const feature = featureMap[featureId];
	if (feature.kind !== 'feature') continue;

	const byCompatKey = feature.status?.by_compat_key;
	if (!byCompatKey) continue;

	for (const [compatKey, entry] of Object.entries(byCompatKey)) {
		const match = compatKey.match(PLAIN_PROPERTY_KEY);
		if (!match) continue;

		const name = match[1];

		if (name.startsWith('-')) continue;
		if (feature.discouraged) continue;

		const support = {
			chrome: entry.support?.chrome ?? null,
			edge: entry.support?.edge ?? null,
			firefox: entry.support?.firefox ?? null,
			safari: entry.support?.safari ?? null
		};

		if (entry.baseline === false) {
			properties.push({
				name,
				baselineStatus: 'limited',
				baselineDate: null,
				support,
				description: feature.description ?? ''
			});
			continue;
		}

		const baselineStatus: BaselineStatus = entry.baseline;
		const rawBaselineDate =
			baselineStatus === 'high' ? entry.baseline_high_date : entry.baseline_low_date;
		if (!rawBaselineDate) continue;
		const baselineDate = rawBaselineDate.replace('≤', '');

		properties.push({
			name,
			baselineStatus,
			baselineDate,
			support,
			description: feature.description ?? ''
		});
	}
}

const byName = new Map<string, CssPropertyData>();
for (const prop of properties) {
	const existing = byName.get(prop.name);
	if (!existing) {
		byName.set(prop.name, prop);
		continue;
	}
	if (existing.baselineStatus === 'limited' && prop.baselineStatus !== 'limited') {
		byName.set(prop.name, prop);
	} else if (
		existing.baselineStatus !== 'limited' &&
		prop.baselineStatus !== 'limited' &&
		(prop.baselineDate as string) < (existing.baselineDate as string)
	) {
		byName.set(prop.name, prop);
	}
}

const result = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

const datedCount = result.filter((p) => p.baselineStatus !== 'limited').length;
const limitedCount = result.length - datedCount;

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n');

console.log(
	`generated ${result.length} CSS properties (dated: ${datedCount}, limited: ${limitedCount}) -> ${OUTPUT_PATH}`
);
