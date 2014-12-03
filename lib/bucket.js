/**
 * bucket - bucket util
 *
 * @author tianyi.jiangty@alibaba-inc
 * @date 2014-11-23
 */

'use strict';


var TokenBucket = function(bucketSize, tokensPerInterval, interval) {

//单位时间内，可请求的最大令牌数
  this.bucketSize = bucketSize;
 
//单位时间内，产生的令牌数
  this.tokensPerInterval = tokensPerInterval;

 //定义 单位时间
  this.interval = interval;
  
  //可用令牌数量
  this.availableBucket = 0;
  
  //最近一次添加令牌的时间
  this.lastAdd = +new Date();

};

TokenBucket.prototype = {

	//私有方法，移除固定数量令牌	
  removeTokens: function(count, callback) {
    var self = this;
   
    
	//避免一次请求过多的令牌数量
    if (count > this.bucketSize) {
		throw 'avoid max bucket';
		return false;
    }
    
    //添加令牌
    this.addBucket();
	
    
    //如果令牌数量不够，计算需要等待的时间，并等待相应的时间后再移除令牌
    if (count > this.availableBucket){
	
      return waitForNewBucket();
	  
	  }

      // 移除相应数量的令牌，并返回此时可用的令牌数量
      this.availableBucket -= count;
      callback(null, this.availableBucket);
      return true;

    
		function waitForNewBucket() {
			//计算获取可用令牌需要等待多长时间
			var waitInterval = Math.ceil(
					(count - self.availableBucket) * (self.interval / self.tokensPerInterval));
					
			//延时执行		
			setTimeout(function () {
				self.removeTokens(count, callback);
			}, waitInterval);
			
			return false;
		}
    },

	
	//同步方法，不需要传入回调函数，只做取令牌并返回成功与否
  tryRemoveTokens: function(count) {
  

    if (count > this.bucketSize)
      return false;
    
	//添加新令牌
    this.addBucket();

   //移除失败
    if (count > this.availableBucket)
      return false;


    //移除令牌
    this.availableBucket -= count;
    return true;
  },

  //添加新令牌
  addBucket: function() {
    if (!this.tokensPerInterval) {
      this.availableBucket = this.bucketSize;
      return;
    }
    
    var now = +new Date();
	
	//计算距离上一次添加令牌过了多长时间
    var elapsd = Math.max(now - this.lastAdd, 0);
    this.lastAdd = now;
    
	//根据这个流逝的时间计算应该添加的令牌数量
    var bucketNumber = elapsd * (this.tokensPerInterval / this.interval);
	
    this.availableBucket = Math.min(this.availableBucket + bucketNumber, this.bucketSize);
  }
};

module.exports = TokenBucket;