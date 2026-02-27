FROM node:22-slim

# Railway серверінде браузер (Chromium) жұмыс істеуі үшін қажетті кітапханаларды орнату
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer-ге сервердегі орнатылған браузерді қолдануды бұйыру
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Жұмыс папкасын құру
WORKDIR /usr/src/app

# Пакеттерді көшіру және орнату
COPY package*.json ./
RUN npm install

# Қалған кодты көшіру
COPY . .

# Веб-сервердің порты
EXPOSE 3000

# Іске қосу командасы
CMD [ "npm", "start" ]
