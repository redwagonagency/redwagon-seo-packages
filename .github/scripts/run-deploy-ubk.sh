#!/bin/bash
set -e
pip install paramiko -q
python3 /github/workspace/.github/scripts/deploy_ubk.py
