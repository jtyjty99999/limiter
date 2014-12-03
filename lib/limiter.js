/**
 * limiter - columbus limiter
 *
 * @author tianyi.jiangty@alibaba-inc
 * @date 2014-11-23
 */

'use strict';


/*对令牌桶算法的封装*/

var TokenBucket = require('./bucket');



var RateLimiter = function(tokensPerInterval, interval) {

//初始化一个令牌生成器。单位时间内产生的令牌=单位时间创建的最大令牌
  this.tokenBucket = new TokenBucket(tokensPerInterval, tokensPerInterval,
    interval);
  
  // 初始化的时候，默认“添加”一次令牌
  this.tokenBucket.availableBucket = tokensPerInterval;
  
  this.curIntervalStart = +new Date();
  this.tokensThisInterval = 0;
};

RateLimiter.prototype = {
  tokenBucket: null,
  curIntervalStart: 0,
  tokensThisInterval: 0,
  
  //拿走令牌并操作
  removeTokens: function(count, callback) {
    // 判断是否超出一次移除的最大数量
    if (count > this.tokenBucket.bucketSize) {
      throw 'avoid max bucket';
      return false;
    }
    
    var self = this;
    var now = Date.now();
    
    // 如果时间已经过去很久了，就把起点拉到当前时间，并重新执行
    if (now - this.curIntervalStart >= this.tokenBucket.interval) {
      this.curIntervalStart = now;
      this.tokensThisInterval = 0;
    }
    
    // 如果当前没有足够的令牌，便等待
    if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval) {

        var waitInterval = Math.ceil(
          this.curIntervalStart + this.tokenBucket.interval - now);

        setTimeout(function() {
          self.tokenBucket.removeTokens(count, afterTokensRemoved);
        }, waitInterval);
      return false;
    }
    
    // 执行令牌桶中移除令牌的操作
    return this.tokenBucket.removeTokens(count, afterTokensRemoved);

	//定义一个移除后的后续操作
    function afterTokensRemoved(err, tokensRemaining) {
      if (err) return callback(err, null);

      self.tokensThisInterval += count;
      callback(null, tokensRemaining);
    }
  },

//一个同步方法，只执行移除操作。返回移除成功与否
  tryRemoveTokens: function(count) {
  
    if (count > this.tokenBucket.bucketSize)
      return false;

    var now = Date.now();


    if (now - this.curIntervalStart >= this.tokenBucket.interval) {
      this.curIntervalStart = now;
      this.tokensThisInterval = 0;
    }

    // 移除失败
    if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval)
      return false;

    // 移除成功
    return this.tokenBucket.tryRemoveTokens(count);
  },

//获取当前令牌桶中的剩余令牌
  getTokensRemaining: function () {
    return this.tokenBucket.availableBucket;
  }
};

module.exports = RateLimiter;