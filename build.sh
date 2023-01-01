#!/usr/bin/env bash
# exit on error
set -o errexit

pip install uvicorn[standard] websockets wsproto
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
