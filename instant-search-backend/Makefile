# Makefile for instant-search-backend development operations

# Variables
PYTHON := python3
PIP := pip3
DOCKER_COMPOSE := docker compose
SERVICE_NAME := app
DEV_SERVICE_NAME := app-dev

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "Available targets:"
	@echo "  setup               Set up development environment"
	@echo "  build               Build Docker image"
	@echo "  up                  Start services with docker-compose"
	@echo "  up-dev              Start development services with hot reload"
	@echo "  down                Stop and remove containers"
	@echo "  restart             Restart services"
	@echo "  logs                Show service logs"
	@echo "  run-local           Run application locally"
	@echo "  migrate             Run database migrations"
	@echo "  seed                Seed database with sample data"
	@echo "  test                Run tests"
	@echo "  format              Format code"
	@echo "  health              Check application health"
	@echo "  clean               Clean up temporary files"
	@echo "  dev                 Complete development setup and start"
	@echo "  ci                  Run CI pipeline"

# Development environment setup
.PHONY: setup
setup: ## Set up development environment
	@echo "Setting up development environment..."
	$(PIP) install -r requirements.txt
	@echo "Development environment setup complete!"

# Docker operations
.PHONY: build
build: ## Build Docker image
	@echo "Building Docker image..."
	$(DOCKER_COMPOSE) build $(SERVICE_NAME)

.PHONY: up
up: ## Start services with docker-compose
	@echo "Starting services..."
	$(DOCKER_COMPOSE) up -d $(SERVICE_NAME)
	@echo "Services started. API available at http://localhost:8000"

.PHONY: up-dev
up-dev: ## Start development services with hot reload
	@echo "Starting development services with hot reload..."
	$(DOCKER_COMPOSE) --profile dev up -d $(DEV_SERVICE_NAME)
	@echo "Development services started. API available at http://localhost:8001"

.PHONY: down
down: ## Stop and remove containers
	@echo "Stopping services..."
	$(DOCKER_COMPOSE) down
	@echo "Services stopped."

.PHONY: restart
restart: down up ## Restart services

.PHONY: logs
logs: ## Show service logs
	$(DOCKER_COMPOSE) logs -f $(SERVICE_NAME)

.PHONY: logs-dev
logs-dev: ## Show development service logs
	$(DOCKER_COMPOSE) logs -f $(DEV_SERVICE_NAME)

# Local development operations
.PHONY: run-local
run-local: ## Run application locally (not in Docker)
	@echo "Starting application locally..."
	$(PYTHON) -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

.PHONY: run-local-env
run-local-env: ## Run application locally with .env.local
	@echo "Starting application locally with .env.local..."
	$(PYTHON) -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --env-file .env.local

# Database operations
.PHONY: migrate
migrate: ## Run database migrations
	@echo "Running database migrations..."
	$(PYTHON) -m alembic upgrade head
	@echo "Database migrations completed."

.PHONY: migrate-docker
migrate-docker: ## Run database migrations in Docker container
	@echo "Running database migrations in Docker..."
	$(DOCKER_COMPOSE) exec $(SERVICE_NAME) alembic upgrade head
	@echo "Database migrations completed."

.PHONY: migration-create
migration-create: ## Create new migration (usage: make migration-create MESSAGE="description")
	@if [ -z "$(MESSAGE)" ]; then \
		echo "Error: MESSAGE is required. Usage: make migration-create MESSAGE='description'"; \
		exit 1; \
	fi
	@echo "Creating new migration: $(MESSAGE)"
	$(PYTHON) -m alembic revision --autogenerate -m "$(MESSAGE)"

# Seed data operations
.PHONY: seed
seed: ## Seed database with sample data
	@echo "Seeding database with sample data..."
	$(PYTHON) -c "from scripts.seed_data import main; main()"
	@echo "Database seeding completed."

.PHONY: seed-docker
seed-docker: ## Seed database with sample data in Docker container
	@echo "Seeding database in Docker..."
	$(DOCKER_COMPOSE) exec $(SERVICE_NAME) python -c "from scripts.seed_data import main; main()"
	@echo "Database seeding completed."

# Testing operations
.PHONY: test
test: ## Run tests
	@echo "Running tests..."
	$(PYTHON) -m pytest -v
	@echo "Tests completed."

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	$(PYTHON) -m pytest --cov=. --cov-report=html --cov-report=term-missing -v
	@echo "Coverage report generated in htmlcov/"

.PHONY: test-docker
test-docker: ## Run tests in Docker container
	@echo "Running tests in Docker..."
	$(DOCKER_COMPOSE) exec $(SERVICE_NAME) python -m pytest -v
	@echo "Tests completed."

# Code quality operations
.PHONY: format
format: ## Format code with black and isort
	@echo "Formatting code..."
	$(PYTHON) -m black .
	$(PYTHON) -m isort .
	@echo "Code formatting completed."

.PHONY: lint
lint: ## Run linting with flake8
	@echo "Running linting..."
	$(PYTHON) -m flake8 .
	@echo "Linting completed."

.PHONY: type-check
type-check: ## Run type checking with mypy
	@echo "Running type checking..."
	$(PYTHON) -m mypy .
	@echo "Type checking completed."

.PHONY: quality-check
quality-check: format lint type-check ## Run all code quality checks

# Database management
.PHONY: db-reset
db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "WARNING: This will delete all database data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "Resetting database..."
	@rm -f data/app*.db*
	$(MAKE) migrate
	@echo "Database reset completed."

.PHONY: db-backup
db-backup: ## Backup database
	@echo "Creating database backup..."
	@mkdir -p backups
	@cp data/app.db backups/app_backup_$$(date +%Y%m%d_%H%M%S).db
	@echo "Database backup created in backups/"

# Health and status operations
.PHONY: health
health: ## Check application health
	@echo "Checking application health..."
	@curl -f http://localhost:8000/healthz || echo "Application is not healthy or not running"

.PHONY: status
status: ## Show service status
	@echo "Service status:"
	$(DOCKER_COMPOSE) ps

# Cleanup operations
.PHONY: clean
clean: ## Clean up temporary files and caches
	@echo "Cleaning up..."
	$(PYTHON) -c "import shutil, os; [shutil.rmtree(d, ignore_errors=True) for d in ['__pycache__', '.pytest_cache', 'htmlcov'] if os.path.exists(d)]"
	@echo "Cleanup completed."

.PHONY: clean-docker
clean-docker: ## Clean up Docker resources
	@echo "Cleaning up Docker resources..."
	$(DOCKER_COMPOSE) down --volumes --remove-orphans
	@docker system prune -f
	@echo "Docker cleanup completed."

# Development workflow shortcuts
.PHONY: dev
dev: setup migrate seed run-local-env ## Complete development setup and start

.PHONY: dev-docker
dev-docker: build up-dev migrate-docker seed-docker ## Complete Docker development setup

.PHONY: ci
ci: quality-check test ## Run CI pipeline (format, lint, type-check, test)