.PHONY: start test

BIN = ./node_modules/.bin

start:
	@node index

test:
	@$(BIN)/semistandard
	@$(BIN)/mocha
