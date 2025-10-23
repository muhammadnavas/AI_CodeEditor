#!/bin/bash

# AI Code Editor - Production Setup Script
# This script sets up the entire production environment

set -e  # Exit on error

echo "======================================"
echo "AI Code Editor - Production Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
print_success "Docker is installed"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi
print_success "Docker is running"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Skipping local development setup."
    SKIP_NODE=true
else
    print_success "Node.js is installed ($(node --version))"
    SKIP_NODE=false
fi

echo ""
echo "======================================"
echo "Step 1: Environment Configuration"
echo "======================================"

# Check if .env exists
if [ -f ".env" ]; then
    print_warning ".env file already exists. Skipping creation."
else
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created"
    
    # Generate API key
    print_info "Generating secure API key..."
    if command -v node &> /dev/null; then
        API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        # Update .env file with generated API key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/your-secure-api-key-here/$API_KEY/" .env
        else
            sed -i "s/your-secure-api-key-here/$API_KEY/" .env
        fi
        print_success "API key generated and added to .env"
        echo ""
        print_warning "IMPORTANT: Save this API key - you'll need it for API requests"
        echo -e "${GREEN}API_KEY=$API_KEY${NC}"
    else
        print_warning "Node.js not available. Please generate API key manually:"
        echo "Run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    fi
    
    echo ""
    print_warning "IMPORTANT: Edit .env file and add your OPENAI_API_KEY"
    echo "You can get one from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key to .env..."
fi

echo ""
echo "======================================"
echo "Step 2: Pull Docker Images"
echo "======================================"

print_info "Pulling required Docker images for code execution..."
echo "This may take a few minutes..."

# Array of images to pull
images=(
    "node:18-alpine"
    "python:3.11-alpine"
    "openjdk:17-alpine"
    "gcc:latest"
)

for image in "${images[@]}"; do
    print_info "Pulling $image..."
    if docker pull "$image" &> /dev/null; then
        print_success "$image pulled successfully"
    else
        print_error "Failed to pull $image"
        exit 1
    fi
done

echo ""
echo "======================================"
echo "Step 3: Install Dependencies"
echo "======================================"

if [ "$SKIP_NODE" = false ]; then
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
    
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
else
    print_warning "Skipping dependency installation (Node.js not available)"
    print_info "Dependencies will be installed inside Docker containers"
fi

echo ""
echo "======================================"
echo "Step 4: Docker Compose Setup"
echo "======================================"

print_info "Building and starting Docker containers..."
docker-compose up -d --build

echo ""
print_info "Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "All services are running!"
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Services are running:"
echo "  • Frontend:  http://localhost:3000"
echo "  • Backend:   http://localhost:3001"
echo "  • Database:  localhost:5432"
echo "  • Redis:     localhost:6379"
echo ""
echo "Useful commands:"
echo "  • View logs:      docker-compose logs -f"
echo "  • Stop services:  docker-compose down"
echo "  • Restart:        docker-compose restart"
echo ""
echo "Test the setup:"
echo "  curl http://localhost:3001/health"
echo ""
print_warning "Remember to keep your API key secure!"
echo ""
