#!/bin/bash

# TrustLens Development Setup Script

set -e

echo "🚀 Setting up TrustLens development environment..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 Installing pnpm..."
        npm install -g pnpm@8.15.0
    fi

    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed. Please install Python >= 3.10"
        exit 1
    fi

    # Check Poetry (for Python packages)
    if ! command -v poetry &> /dev/null; then
        echo "📦 Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker is not installed. Some features may not work."
    fi

    echo "✅ Prerequisites check complete"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing Node.js dependencies..."
    pnpm install

    echo "🐍 Installing Python dependencies..."
    cd packages/sdk-py && poetry install && cd ../..

    echo "✅ Dependencies installed"
}

# Setup environment
setup_environment() {
    echo "🔧 Setting up environment..."

    if [ ! -f .env.local ]; then
        cp .env.example .env.local
        echo "📝 Created .env.local from template"
        echo "⚠️  Please edit .env.local with your configuration"
    fi

    echo "✅ Environment setup complete"
}

# Setup database
setup_database() {
    echo "🗄️  Setting up database..."

    if command -v docker &> /dev/null; then
        echo "🐳 Starting database with Docker..."
        docker-compose up -d postgres redis

        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        sleep 10

        echo "📊 Running database migrations..."
        cd packages/api && npm run migrate && cd ../..

        echo "✅ Database setup complete"
    else
        echo "⚠️  Docker not available. Please set up PostgreSQL and Redis manually."
        echo "   PostgreSQL: Create database 'trustlens'"
        echo "   Redis: Start Redis server on port 6379"
    fi
}

# Build packages
build_packages() {
    echo "🔨 Building packages..."
    pnpm build
    echo "✅ Build complete"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    pnpm test
    echo "✅ Tests complete"
}

# Start development servers
start_dev_servers() {
    echo "🚀 Starting development servers..."

    if command -v docker &> /dev/null; then
        echo "🐳 Starting with Docker..."
        docker-compose up -d

        echo ""
        echo "🎉 TrustLens is now running!"
        echo ""
        echo "📱 Web App:     http://localhost:3000"
        echo "🔌 API:         http://localhost:8080"
        echo "📖 Docs:        http://localhost:3001"
        echo "🧠 Model API:   http://localhost:8090"
        echo ""
        echo "📊 Database:    postgresql://postgres:postgres@localhost:5432/trustlens"
        echo "🔄 Redis:       redis://localhost:6379"
        echo ""
        echo "To stop: docker-compose down"
        echo "To view logs: docker-compose logs -f"
    else
        echo "💻 Starting in development mode..."
        echo "Please start the following in separate terminals:"
        echo "  cd packages/api && npm run dev"
        echo "  cd packages/webapp && npm run dev"
        echo "  cd packages/model && python -m uvicorn main:app --reload"
    fi
}

# Main execution
main() {
    echo "TrustLens Development Setup"
    echo "=========================="
    echo ""

    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    build_packages

    # Ask if user wants to run tests
    read -p "🧪 Run tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi

    # Ask if user wants to start dev servers
    read -p "🚀 Start development servers? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_dev_servers
    fi

    echo ""
    echo "🎉 Setup complete! Happy coding!"
    echo ""
    echo "📚 Next steps:"
    echo "  1. Edit .env.local with your configuration"
    echo "  2. Check the README.md for detailed documentation"
    echo "  3. Visit http://localhost:3000 to see the app"
    echo ""
    echo "💬 Need help? Check our docs or open an issue!"
}

# Run main function
main "$@"