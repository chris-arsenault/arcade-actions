.PHONY: ci install lint typecheck test test-coverage format format-check terraform-check terraform-validate terraform-test build dev preview deploy

ci: lint typecheck test-coverage format-check terraform-check build terraform-test

install:
	cd frontend && pnpm install --frozen-lockfile
lint:
	cd frontend && pnpm lint
typecheck:
	cd frontend && pnpm typecheck
test:
	cd frontend && pnpm test
test-coverage:
	cd frontend && pnpm exec vitest run --coverage --reporter=default --reporter=junit --outputFile=coverage/junit.xml
format:
	cd frontend && pnpm format
	terraform fmt -recursive infrastructure/terraform/
format-check:
	cd frontend && pnpm format:check
terraform-check:
	terraform fmt -check -recursive infrastructure/terraform/
terraform-validate:
	terraform -chdir=infrastructure/terraform init -backend=false -input=false
	terraform -chdir=infrastructure/terraform validate
terraform-test: terraform-validate
	terraform -chdir=infrastructure/terraform test
build:
	cd frontend && pnpm build
dev:
	cd frontend && pnpm dev
preview:
	cd frontend && pnpm preview
deploy:
	./scripts/deploy.sh
