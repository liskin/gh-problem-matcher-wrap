import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function main() {
	const linters = core.getInput('linters', { required: true }).split(/[,\s]+/);
	const action = core.getInput('action') || 'run';
	const run = core.getInput('run', { required: action == 'run' });

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const problemMatchersPath = path.resolve(path.join(__dirname, '..', 'problem-matchers'));

	const problemMatcherFiles = linters.map(kind => path.join(problemMatchersPath, `${kind}.json`));
	const problemMatchers = await Array.fromAsync(
		problemMatcherFiles,
		async (file) => JSON.parse(await readFile(file, 'utf-8'))
	);
	const owners = problemMatchers.map(ms => ms.problemMatcher.map(m => m.owner)).flat();

	if (action == "run" || action == "add") {
		for (const file of problemMatcherFiles) {
			core.debug(`Add matcher: ${file}`)
			console.log(`::add-matcher::${file}`)
		}
	}

	if (action == "run") {
		try {
			await exec.exec(run);
		} catch (e) {
			core.setFailed(e.message);
		}
	}

	if (action == "run" || action == "remove") {
		for (const owner of owners) {
			core.debug(`Remove matcher: ${owner}`);
			console.log(`::remove-matcher owner=${owner}::`);
		}
	}
}

main().catch(e => {
	console.log(e);
	core.setFailed(e.message);
});
