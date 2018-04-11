FROM node:latest

LABEL vendor="GrammarSoft ApS" \
	maintainer="Tino Didriksen <mail@tinodidriksen.com>" \
	com.grammarsoft.product="Caduceus" \
	com.grammarsoft.codename="caduceus"

ENV LANG=C.UTF-8 \
	LC_ALL=C.UTF-8

WORKDIR /usr/src/app

COPY . .

RUN npm install --only=production

ENV CADUCEUS_PORT=80
EXPOSE $CADUCEUS_PORT
CMD ["npm", "start"]
