const core = require('@actions/core');
const exec = require('@actions/exec');
const path = require('path');

const linters = core.getInput('linters', { required: true }).split(/[,\s]+/);
const action = core.getInput('action') || 'run';
const run = core.getInput('run', { required: action == 'run' });

const problemMatchersPath = path.resolve(path.join(__dirname, '..', 'problem-matchers'));

async function main() {
	const problemMatcherFiles = linters.map(kind => path.join(problemMatchersPath, `${kind}.json`));
	const problemMatchers = problemMatcherFiles.map(file => require(file));
	const owners = problemMatchers.map(ms => ms.problemMatcher.map(m => m.owner)).flat();

	if (action == "run" || action == "add") {
		for (const file of problemMatcherFiles) {
			console.log(`Add matcher: ${file}`)
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
			console.log(`Remove matcher: ${owner}`);
			console.log(`::remove-matcher owner=${owner}::`);
		}
	}
}

main().catch(e => core.setFailed(e.message));
