.PHONY: vendor import transpile build

vendor: vendor/emocre-tools vendor/emocre-creatures
	yarn install

vendor/emocre-tools:
	git clone https://github.com/afonsof/emocre-tools.git vendor/emocre-tools
	rm -f vendor/emocre-tools/.yarnrc.yml vendor/emocre-tools/yarn.lock

vendor/emocre-creatures:
	git clone --filter=blob:none --sparse git@github.com:afonsof/emocre-creatures.git vendor/emocre-creatures
	cd vendor/emocre-creatures && git sparse-checkout set art

import:
	IMPORT_DATA_DIR="$(PWD)/data" IMPORT_ENV_PATH="$(PWD)/.env" IMPORT_PRESSKIT_PATH="$(PWD)/press-kit.md" yarn workspace @emocre/tools import

transpile:
	node -r ts-node/register tools/transpile.ts

build:
	yarn build
