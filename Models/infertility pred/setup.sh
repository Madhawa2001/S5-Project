#!/bin/bash

echo "Setting up Infertility Prediction Project..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Verify installations
echo ""
echo "Verifying critical packages..."
python -c "import pandas; print('pandas', pandas.__version__)" 2>/dev/null || echo "❌ pandas failed"
python -c "import pyreadstat; print('pyreadstat installed')" 2>/dev/null || echo "❌ pyreadstat failed"
python -c "import streamlit; print('streamlit', streamlit.__version__)" 2>/dev/null || echo "❌ streamlit failed"
python -c "import mlxtend; print('mlxtend installed')" 2>/dev/null || echo "❌ mlxtend failed"
python -c "import sklearn; print('scikit-learn', sklearn.__version__)" 2>/dev/null || echo "❌ scikit-learn failed"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "   1. Activate environment: source venv/bin/activate"
echo "   2. Run data merging: jupyter notebook datamerge.ipynb"
echo "   3. Run Apriori analysis: jupyter notebook apriori.ipynb"
