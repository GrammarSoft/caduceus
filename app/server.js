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

const PORT = process.env.CADUCEUS_PORT || process.env.PORT || 3000;
const SECRET = process.env.CADUCEUS_SECRET || OS.hostname() || 'caduceus';
console.log('Port: %s, Secret: %s', PORT, SECRET);

let channels = {};
const wss = new WebSocket.Server({port: PORT});

function hmac_sha256_b64(data) {
	let hmac = Crypto.createHmac('sha256', SECRET);
	hmac.update(data);
	return hmac.digest('base64').replace(/=/g, '');
}

function verify_signature(data, sig) {
	let v = hmac_sha256_b64(data);
	return (v === sig);
}

function noop() {
}

function heartbeat() {
	this.isAlive = true;
}

function terminate(ws) {
	if (ws.cName && channels.hasOwnProperty(ws.cName)) {
		delete channels[ws.cName];
	}
	ws.close();
	return ws.terminate();
}

function send(ws, data) {
	return ws.send(JSON.stringify(data));
}

function incoming(message) {
	try {
		let msg = JSON.parse(message);

		if (msg.a === 'create-channel') {
			if (!verify_signature(msg.a, msg.sig)) {
				send(this, {a: msg.a, e: 'invalid-sig'});
				return terminate(this);
			}
			const name = Crypto.randomBytes(32).toString('base64').replace(/=/g, '').replace(/\+/g, '_').replace(/\//g, '-');
			channels[name] = {
				cTime: Date.now(),
				ws: null,
			};
			console.log('Created channel %s', name);
			send(this, {a: msg.a, r: name});
			return terminate(this);
		}
		else if (msg.a === 'listen-channel') {
			if (!channels.hasOwnProperty(msg.name)) {
				send(this, {a: msg.a, e: 'no-such-channel'});
				return terminate(this);
			}
			if (channels[msg.name].ws) {
				send(this, {a: msg.a, e: 'channel-occupied'});
				return terminate(this);
			}
			console.log('Listener attached on channel %s', msg.name);
			channels[msg.name].ws = this;
			this.cName = msg.name;
			send(this, {a: msg.a, r: true});
		}
		else if (msg.a === 'push-channel') {
			if (!verify_signature(msg.a+msg.name, msg.sig)) {
				send(this, {a: msg.a, e: 'invalid-sig'});
				return terminate(this);
			}
			if (!channels.hasOwnProperty(msg.name)) {
				send(this, {a: msg.a, e: 'no-such-channel'});
				return terminate(this);
			}
			if (!channels[msg.name].ws) {
				send(this, {a: msg.a, e: 'channel-empty'});
				return terminate(this);
			}
			console.log('Pushing to channel %s', msg.name);
			send(channels[msg.name].ws, msg.data);
			terminate(this);
			terminate(channels[msg.name].ws);
		}
		else {
			console.log('Error: Unexpected data "%s"', message);
			return terminate(this);
		}
	}
	catch (e) {
		console.log('Error: Exception caught while handling "%s":', message);
		console.log(e);
		return terminate(this);
	}
}

wss.on('connection', function connection(ws) {
	ws.isAlive = true;
	ws.cTime = Date.now();
	ws.cName = null;
	ws.on('pong', heartbeat);

	ws.on('message', incoming);
});

const reaper = setInterval(function reaper() {
	// Timeout after 10 minutes
	let timeout = Date.now() - 10*60*1000;

	for (let name in channels) {
		if (!channels.hasOwnProperty(name)) {
			continue;
		}
		if (channels[name].cTime < timeout) {
			console.log('Channel timeout: 10 minute hard limit');
			if (channels[name].ws) {
				send(channels[name].ws, {e: 'channel-timeout'});
				channels[name].ws.terminate();
			}
			delete channels[name];
			continue;
		}
	}

	wss.clients.forEach(function each(ws) {
		if (ws.isAlive === false) {
			console.log('Socket timeout: 20 second ping');
			return terminate(ws);
		}
		if (ws.cTime < timeout) {
			console.log('Socket timeout: 10 minute hard limit');
			send(ws, {e: 'ws-timeout'});
			return terminate(ws);
		}

		ws.isAlive = false;
		ws.ping(noop);
	});
}, 20000);
