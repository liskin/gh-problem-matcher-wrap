bwrap-home ?= $(shell command -v bwrap-home)

.PHONY: dist
dist:
	$(bwrap-home) npm install

.PHONY: clean
clean:
	git clean -ffdX
