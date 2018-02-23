/*!
 * Copyright 2018 GrammarSoft ApS <info@grammarsoft.com> at https://grammarsoft.com/
 * Developed by Tino Didriksen <mail@tinodidriksen.com>
 *
 * This project is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This project is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this project.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

const OS = require('os');
const Crypto = require('crypto');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.CADUCEUS_SECRET || OS.hostname() || 'caduceus';
//console.log('Port: %s, Secret: %s', PORT, SECRET);

function hmac_sha256_b64(data) {
	let hmac = Crypto.createHmac('sha256', SECRET);
	hmac.update(data);
	return hmac.digest('base64').replace(/=/g, '');
}

const wss = new WebSocket.Server({port: PORT});

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});

	ws.send('something');
});
