.PHONY: dev start stop status backend frontend install clean help load-env

# Load environment variables
load-env:
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v '^#' | xargs); \
	fi

# Default target
dev: load-env ## Start both frontend and backend
	@npm run dev

start: dev ## Alias for dev

stop: ## Stop all services
	@npm run stop

status: ## Check service status
	@npm run status

backend: load-env ## Start only backend
	@npm run dev:backend

frontend: load-env ## Start only frontend
	@npm run dev:frontend

install: ## Install all dependencies
	@npm install
	@npm run install:frontend

clean: ## Clean up log files and stop services
	@npm run stop
	@rm -f backend.log frontend.log .backend.pid .frontend.pid

help: ## Show this help message
	@echo "AutoHR Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick start: make dev" 