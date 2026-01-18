PYTHON := python3
VENV := .venv
REQS := requirements.txt

PYTHON_BIN := $(VENV)/bin/python
PIP_BIN := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

build:
	$(PYTHON) -m venv $(VENV)
	$(PYTHON_BIN) -m pip install --upgrade pip
	$(PIP_BIN) install -r $(REQS)

run:
	PYTHONPATH=$(PWD) $(UVICORN) app.main:app --reload

clean:
	rm -rf $(VENV)

help:
	@echo "Available targets:"
	@echo "  make build  -> create venv & install deps"
	@echo "  make run    -> run FastAPI"
	@echo "  make clean  -> delete venv"
