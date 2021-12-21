include .env
export

ifndef source
override source = LOCAL
endif
ifndef target
override target = STAGING
endif

build:
	./run.sh
build-dummy:
	./run.sh dummy
deploy:
	rsync -a --del $($(source)) $($(target))