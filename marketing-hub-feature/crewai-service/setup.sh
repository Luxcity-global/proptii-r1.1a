#!/bin/bash

# CrewAI Service Setup Script
echo "🚀 Setting up CrewAI Property Marketing Service..."

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11 or higher is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update .env with your API keys and configuration"
fi

# Create directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p temp

echo "✅ CrewAI service setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Start the service: python main.py"
echo "3. Or use Docker: docker-compose up crewai-service"
echo ""
echo "Required API keys:"
echo "- OPENAI_API_KEY (for CrewAI agents)"
echo "- ANTHROPIC_API_KEY (optional alternative)"
echo "- UK_PROPERTY_API_KEY (optional for enhanced data)"
echo "- EPC_API_KEY (optional for EPC data)"


