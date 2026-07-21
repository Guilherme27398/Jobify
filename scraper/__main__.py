"""Ponto de entrada para `python -m scraper`.

Os módulos do scraper importam-se entre si por nome de topo (funcionam também
como scripts avulsos), por isso garantimos a pasta do package no sys.path antes
de delegar no orquestrador.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from run import main  # noqa: E402

main()
