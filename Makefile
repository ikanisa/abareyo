.PHONY: dev test e2e backend-migrate backend-seed env-check k8s-apply k8s-namespace validate-deployment

dev:
	npm run dev

test:
	npm run test

e2e:
	E2E_API_MOCKS=1 NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api/e2e npx playwright test

backend-migrate:
	cd backend && npm ci && npx prisma generate && npm run prisma:migrate

backend-seed:
	cd backend && npm run seed

env-check:
	cd backend && npm run env:check

validate-deployment:
	npm run validate:deployment

validate-deployment-full:
	npm run validate:deployment -- --check-k8s --check-services

k8s-namespace:
	kubectl apply -f k8s/namespace.yaml

k8s-apply: k8s-namespace
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/frontend-deployment.yaml

.PHONY: deps-cloudflare tunnel-up tunnel-bg tunnel-down caddy-up caddy-bg caddy-down

deps-cloudflare:
	./scripts/mac/install_cloudflared.sh

tunnel-up:
	./scripts/mac/tunnel_up.sh

tunnel-bg:
	./scripts/mac/tunnel_bg.sh

tunnel-down:
	./scripts/mac/tunnel_down.sh

caddy-up:
	docker compose up -d caddy

caddy-bg: caddy-up

caddy-down:
	docker compose rm -sf caddy
