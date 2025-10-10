.PHONY: dev test e2e backend-migrate backend-seed env-check k8s-apply k8s-namespace

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

k8s-namespace:
	kubectl apply -f k8s/namespace.yaml

k8s-apply: k8s-namespace
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
