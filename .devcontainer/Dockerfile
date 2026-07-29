FROM debian:trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash dev \
    && mkdir -p /workspace \
    && chown dev:dev /workspace

USER dev
ENV PATH="/home/dev/.local/share/mise/shims:/home/dev/.local/bin:$PATH"

RUN curl https://mise.run | sh

# Node LTS + aube (mise作者謹製のnpm互換パッケージマネージャ)
RUN mise use -g node@lts aqua:jdx/aube@latest
RUN mise trust -a || true

WORKDIR /workspace
