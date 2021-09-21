# Caduceus
Very simple message broker. Designed for login tokens for the [GrammarSoft Proofing Tools frontend](https://github.com/GrammarSoft/proofing-gasmso), but could be extended for anything.

## Environment Variables / App Settings
* `CADUCEUS_PORT` or `PORT`	Port to listen on; defaults to *3000*
* `CADUCEUS_SECRET`	Caduceus secret; defaults to the server's hostname

## External Dependencies
The code pulls in these external dependencies:
* `ws`: [Node.js WebSockets 8.x](https://github.com/websockets/ws) via [npm](https://www.npmjs.com/package/ws)
