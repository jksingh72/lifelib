#!/bin/bash
# Check if the script is being sourced (required to update current session PATH)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    echo "Please source this script so it updates your current session:"
    echo "    source env.sh"
    exit 1
fi

LIFELIB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Prepend virtualenv binaries and project root to PATH
export PATH="${LIFELIB_ROOT}:${LIFELIB_ROOT}/venv_lifelib/bin:${PATH}"
export PYTHONPATH="${LIFELIB_ROOT}:${PYTHONPATH}"
export VIRTUAL_ENV="${LIFELIB_ROOT}/venv_lifelib"

# Convenient shortcut variable to libraries folder
export LIB="${LIFELIB_ROOT}/lifelib/libraries"

echo "✓ Lifelib session activated for this terminal!"
echo "  • Run any model:   run-model <product>  (e.g. 'run-model term_life')"
echo "  • List all models: run-model list"
echo "  • Jump to libs:    cd \$LIB"
