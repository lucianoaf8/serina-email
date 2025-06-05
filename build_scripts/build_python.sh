#!/bin/bash

# build_python.sh
# This script prepares the Python backend for building or deployment.

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "Python Build Script Started..."

# Navigate to the backend directory
cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Error: Python virtual environment 'venv' not found in $BACKEND_DIR." 
    echo "Please run the setup steps in README.md to create it first."
    exit 1
fi

# Activate virtual environment
# This command is standard for bash. On Windows Git Bash, it should work.
# If using native Windows cmd/powershell, the activation script is venv\Scripts\activate.bat or .ps1
# However, package.json specifies 'bash build_scripts/build_python.sh', so bash syntax is appropriate.
echo "Activating Python virtual environment..."
# shellcheck disable=SC1091
source venv/bin/activate

# Ensure pip is up-to-date (optional, but good practice)
# echo "Upgrading pip..."
# pip install --upgrade pip

# Freeze dependencies
# This captures the exact versions of all installed packages, including dependencies of dependencies.
echo "Freezing Python dependencies to backend/frozen_requirements.txt..."
pip freeze > frozen_requirements.txt

# Deactivate virtual environment (optional, script will exit anyway)
# echo "Deactivating virtual environment..."
# deactivate

echo "Python Build Script Finished Successfully."

# Placeholder for future packaging steps (e.g., PyInstaller, Nuitka)
# echo "Next steps would involve packaging the Python app (e.g., with PyInstaller or Nuitka)." 

exit 0
