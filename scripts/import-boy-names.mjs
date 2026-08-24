// One-off import of Statistik Austria's Vornamen ODS export (boy names, sheet
// "Tabelle_12") into the `first_name` table. Safe to re-run: rows are
// upserted by name.
//
// Usage: node scripts/import-boy-names.mjs

import XLSX from 'xlsx';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const SOURCE_FILE = 'Vornamen_1984_bis_2025_original_Schreibweise.ods';
const SHEET_NAME = 'Tabelle_12';
const HEADER_ROWS = 3; // data starts at spreadsheet row 4 (0-indexed row 3)

function loadDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	const envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
	for (const line of envFile.split('\n')) {
		const match = /^DATABASE_URL=(.*)$/.exec(line.trim());
		if (match) return match[1].trim();
	}
	throw new Error('DATABASE_URL not found in environment or .env');
}

// Rank columns use 0 (displayed as "-" in the spreadsheet) to mean "not
// ranked" (only possible when the matching amount is also 0). Our schema
// models that as NULL rather than a fake rank of 0.
function toRank(value) {
	const n = Number(value);
	return n > 0 ? n : null;
}

function toAmount(value) {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}

function minRank(a, b) {
	if (a == null) return b;
	if (b == null) return a;
	return Math.min(a, b);
}

const filePath = path.resolve(SOURCE_FILE);
const workbook = XLSX.readFile(filePath, { raw: true });
const sheet = workbook.Sheets[SHEET_NAME];
if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found in ${SOURCE_FILE}`);

const rows = XLSX.utils.sheet_to_json(sheet, {
	header: 1,
	raw: true,
	defval: null,
	range: HEADER_ROWS
});

// Merge duplicate names present in the source (a handful of rows are
// genuinely duplicated for the same name): sum the additive amount columns
// and keep the better (lowest, non-null) rank for each period.
const byName = new Map();
for (const row of rows) {
	const [name, amountAllTime, rankAllTime, amountRecent, rankRecent] = row;
	if (!name || typeof name !== 'string') continue; // skip title/footer rows
	if (name.includes('-')) continue; // skip double names, e.g. "Aaron-Amadeus"

	const entry = {
		name: name.trim(),
		amountAllTime: toAmount(amountAllTime),
		rankAllTime: toRank(rankAllTime),
		amountRecent: toAmount(amountRecent),
		rankRecent: toRank(rankRecent)
	};

	const existing = byName.get(entry.name);
	if (!existing) {
		byName.set(entry.name, entry);
		continue;
	}
	existing.amountAllTime += entry.amountAllTime;
	existing.amountRecent += entry.amountRecent;
	existing.rankAllTime = minRank(existing.rankAllTime, entry.rankAllTime);
	existing.rankRecent = minRank(existing.rankRecent, entry.rankRecent);
}

const entries = [...byName.values()];
console.log(`Parsed ${rows.length} rows -> ${entries.length} unique names.`);

const databaseUrl = loadDatabaseUrl();
const db = new DatabaseSync(path.resolve(databaseUrl));

const upsert = db.prepare(`
	insert into first_name (id, name, rank_all_time, rank_recent, amount_all_time, amount_recent)
	values (lower(hex(randomblob(16))), :name, :rankAllTime, :rankRecent, :amountAllTime, :amountRecent)
	on conflict(name) do update set
		rank_all_time = excluded.rank_all_time,
		rank_recent = excluded.rank_recent,
		amount_all_time = excluded.amount_all_time,
		amount_recent = excluded.amount_recent
`);

db.exec('begin transaction');
try {
	for (const entry of entries) {
		upsert.run({
			name: entry.name,
			rankAllTime: entry.rankAllTime,
			rankRecent: entry.rankRecent,
			amountAllTime: entry.amountAllTime,
			amountRecent: entry.amountRecent
		});
	}
	db.exec('commit');
} catch (err) {
	db.exec('rollback');
	throw err;
}

console.log(`Upserted ${entries.length} boy names into first_name.`);
db.close();
