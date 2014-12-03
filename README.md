## api-limiter(api limiter)


###usage

	var co = require('co');
	var Limiter= require('../');
	var moment = require('moment');

	//two requests per a second
	var limiter1 = new Limiter(2, 1000);

	 var a  = 0;
	 
	exports.test1 = function *(){
			
			
			limiter1.removeTokens(1, function(err, remainingRequests) {
				a+=1;
				console.log('send'+a)
			
			});

	}



	function sleep(ms) {
		return function (fn) {
			setTimeout(fn, ms);
		};
	}


	//co lower than 4
	co(function *() {
		while (true) {
			yield * exports.test1();
			//100ms请求一次
			yield sleep(100); 
		}
	})();