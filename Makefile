DRAFT ?= drafts/consulting/mckinsey-associate.html
PDF   ?= build/consulting/$(notdir $(basename $(DRAFT))).pdf

.PHONY: setup render verify score release clean

setup:                ## install the render/verify toolchain
	pip install -r pipeline/requirements.txt
	@command -v pdffonts >/dev/null || echo "Install poppler-utils for the verify step (apt-get install poppler-utils)"

render:
	python3 pipeline/render.py $(DRAFT) -o $(PDF)

verify: render
	python3 pipeline/verify.py $(PDF)

score: render
	pipeline/score.sh $(PDF)

release:
	pipeline/release.sh $(DRAFT)

clean:
	rm -rf build
