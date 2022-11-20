# GitHub Action: Problem Matcher wrapper

[![GitHub License](https://img.shields.io/github/license/liskin/gh-problem-matcher-wrap)](https://github.com/liskin/gh-problem-matcher-wrap/blob/master/LICENSE)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/liskin/gh-problem-matcher-wrap?sort=semver)](https://github.com/liskin/gh-problem-matcher-wrap/releases)
[![GitHub commits since latest release (by SemVer)](https://img.shields.io/github/commits-since/liskin/gh-problem-matcher-wrap/latest/master?sort=semver)](https://github.com/liskin/gh-problem-matcher-wrap/commits/master)

**Linter errors as annotations, even for fork PRs.**

Wrap your linter invocations with [Problem Matcher][] [add/remove][] to let
GitHub actions detect any errors and warnings and show them as annotations. As
opposed to existing Actions which use the Checks API, this one works correctly
even for Pull Requests from forks, which is otherwise [problematic][problem]
and probably isn't getting fixed [any time soon][problem-detail].

[Problem Matcher]: https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
[add/remove]: https://github.com/actions/toolkit/blob/master/docs/commands.md#problem-matchers
[problem]: https://github.com/actions/toolkit/issues/133
[problem-detail]: https://github.com/actions/toolkit/issues/133#issuecomment-535514071

**Problem Matcher wrapper** works differently (and happens to be much simpler):

1. Tell GitHub Actions how to recognize errors in linter output
2. Run the linter, any way you like (run command, docker, another action, …)
3. Tell GitHub Actions to stop looking for errors of this particular linter so
   that we can safely run other linters

A screenshot and an example (further down) is worth a thousand words:

![screenshot](https://user-images.githubusercontent.com/300342/94590765-83cca700-0287-11eb-871a-8e3c488e3188.png)

## Usage

```yaml
    - name: flake8
      uses: liskin/gh-problem-matcher-wrap@v2
      with:
        linters: flake8
        run: flake8 src/
    - name: mypy
      uses: liskin/gh-problem-matcher-wrap@v2
      with:
        linters: mypy
        run: mypy --show-column-numbers src/
    - name: isort
      uses: liskin/gh-problem-matcher-wrap@v2
      with:
        linters: isort
        run: isort --check src/
    - name: pytest
      uses: liskin/gh-problem-matcher-wrap@v2
      with:
        linters: pytest
        run: pytest
```

```yaml
    - uses: liskin/gh-problem-matcher-wrap@v2
      with:
        action: add
        linters: flake8, mypy
    - name: Lint
      run: |
        # possibly complex multiline shell script
        flake8 src/
        mypy --show-column-numbers src/
    - uses: liskin/gh-problem-matcher-wrap@v2
      with:
        action: remove
        linters: flake8, mypy
```

### Parameters

* `linters`
  * Comma or whitespace separated list of Problem Matchers to add/remove.
  * (Required)
* `run`
  * Command to run.
  * (Required unless `action` is `add` or `remove`)
* `action`
  * If set to `add` or `remove`, do not run any command, just add/remove Problem Matchers.
  * (Default: `run`)

### Supported linters

* [flake8](https://flake8.pycqa.org/)
* [gcc](https://gcc.gnu.org/)
* [isort](https://pycqa.github.io/isort/)
* [mypy](http://mypy-lang.org/)
* [pytest](https://pytest.org/)
* [shellcheck](https://github.com/koalaman/shellcheck#readme) (`-f gcc` + gcc problem matcher)

For details, sources and licenses of individual problem matchers, see
[problem-matchers/](problem-matchers/).

Pull Requests with additional linters welcome!

### Annotation Limitations

GitHub imposes limitations on the total number of annotations a step or job may create [[Source 1](https://github.community/t/annotation-limitation/17998/2)][[Source 2](https://github.community/t/maximum-number-of-annotations-that-can-be-created-using-github-actions-logging-commands/16991)]. If a linter finds more problems than what may be annotated, only a random subset of the reported errors/warnings will be annotated. In either case, all found errors are reported in the action's logs. The exact limitations are:

- 10 warning annotations and 10 error annotations per step
- 50 annotations per job (sum of annotations from all the steps)
- 50 annotations per run (separate from the job annotations, these annotations aren’t created by users


One approach to (partially) counteract this limitation is to split the linting into multiple steps/jobs. This can be done on a per linter or per folder basis. Example:

```yaml
jobs:
  # this job can annotate up to 50 errors/warnings
  lint_core:
    ...
    steps:
      ...
      # this step can annotate up to 10 errors/warnings
      - name: Flake8 Module1
        uses: liskin/gh-problem-matcher-wrap@v2
        with:
          linters: flake8
          run: flake8 src/core/module1
      # this step can annotate an additional 10
      - name: Flake8 Module2
        uses: liskin/gh-problem-matcher-wrap@v2
        with:
          linters: flake8
          run: flake8 src/core/module2
  # this job can annotate an additioanal 50 errors/warnings
  lint_plugins:
    ...
    steps:
      ...
      # this step can annotate up to 10 errors/warnings
      - name: Flake8
        uses: liskin/gh-problem-matcher-wrap@v2
        with:
          linters: flake8
          run: flake8 src/plugins/ 
```
