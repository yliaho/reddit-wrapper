var assert = require('assert');
var should = require('should');
var secrets = require('../secrets/secrets');
const nock = require('nock');

const Wrapper = require('../reddit-wrapper');
var redditConn = Wrapper(secrets.redditOptions);

describe("API Basic Operations", function() {
	it("Get Request", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	});
	it("POST Request", (done) => {
		redditConn.api.post("/api/hide", {
			"id": "t3_6arf2r",
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	});
	it("PUT Request", (done) => {
		redditConn.api.put("/api/v1/me/friends/juicypasta", {
			"name": "juicypasta",
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	});
	it("PATCH Request", (done) => {
		redditConn.api.patch("/api/v1/me/prefs/", {
			"over_18": true,
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	});
	it("Get Token", (done) => {
		redditConn.api.get_token()
		.then(function(results) {
			let token = results[0];
			token.should.be.ok();
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	})
});

describe("Trying too much delay, success after waiting", function() {
	beforeEach(() => {
		var rOptions = secrets.redditOptions;
		rOptions.retry_on_wait = true;
		redditConn = Wrapper(rOptions);

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.once()
		.reply(200, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.reply(200, {});
	})

	it("Get Request and delay for 3 seconds", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			should(err).not.be.ok();
			done();
		});
	});
});

describe("Trying too much delay, error after waiting", function() {
	beforeEach(() => {
		var rOptions = secrets.redditOptions;
		rOptions.retry_on_wait = true;
		redditConn = Wrapper(rOptions);

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.once()
		.reply(200, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.once()
		.reply(200, {
			json: {
				ratelimit: 3,
			},
		});
	})

	it("Get Request and delay for 3 seconds", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			// Should not reach here, timeout if we do.
		})
		.catch(function(err) {
			should(err).be.ok();
			done();
		});
	});
});

describe("Server Error, retry max 5 times. Sixth and final retry is success. No delay.", function() {
	beforeEach(() => {
		var rOptions = secrets.redditOptions;
		rOptions.retry_on_server_error = 5;
		rOptions.retry_delay = 1;
		redditConn = Wrapper(rOptions);

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.thrice()
		.reply(500, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.twice()
		.reply(500, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.once()
		.reply(200, {});
	})

	it("Get Request and delay for 3 seconds", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			// Should not reach here, timeout if we do.
		});
	});
});

describe("Server Error, retry max 5 times. Sixth and final retry is error again. No delay.", function() {
	beforeEach(() => {
		var rOptions = secrets.redditOptions;
		rOptions.retry_on_server_error = 5;
		rOptions.retry_delay = 1;
		redditConn = Wrapper(rOptions);

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.thrice()
		.reply(500, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.thrice()
		.reply(500, {
			json: {
				ratelimit: 3,
			},
		});
	})

	it("Get Request and delay for 3 seconds", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			// Should not reach here, timeout if we do.
		})
		.catch(function(err) {
			should(err).be.ok();
			done();
		});
	});
});

describe("Server Error, retry max 2 times. Third time is success. 2s delay.", function() {
	beforeEach(() => {
		var rOptions = secrets.redditOptions;
		rOptions.retry_on_server_error = 5;
		rOptions.retry_delay = 2;
		redditConn = Wrapper(rOptions);

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.twice()
		.reply(500, {
			json: {
				ratelimit: 3,
			},
		});

		nock("https://oauth.reddit.com")
		.get("/subreddits/mine/subscriber?limit=2")
		.once()
		.reply(200, {});
	})

	it("Get Request and delay for 3 seconds", (done) => {
		redditConn.api.get("/subreddits/mine/subscriber", {
			limit: 2,
		})
		.then(function(results) {
			let responseCode = results[0];
			let data = results[1];

			console.log("Response code: " + responseCode);
			responseCode.should.be.equal(200);
			done();
		})
		.catch(function(err) {
			// Should not reach here, timeout if we do.
		});
	});
});
