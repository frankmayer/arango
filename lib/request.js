/* 
 * Copyright (c) 2012-2013 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
 */

var BROWSER = (typeof window === 'object');
var utils = require('./utils');

function closure(db) {    
    "use strict";

    var xhr;

    /* Bring in Xhr support for nodejs or browser */
    if(!BROWSER) {

        xhr = function(method,path,options,data) {
            "use strict";

            var req = require(options.protocol).request;
            var p = db.promise();

            delete options.protocol;

            if(options.timeout) {
                request.socket.setTimeout(options.timeout);
                delete options.timeout;
            }

            options.method = method;
            options.path = path;

            if(!options.headers) options.headers = {};

            options.headers["content-length"] = data ? Buffer.byteLength(data) : 0;
            
            req(options,function(res) {
                var buf='';

                res.on('data',function(rdata){
                    buf+=rdata;
                }).on('end',function(){
                    try {  
                        buf = JSON.parse(buf);
                    } catch(e) { }

                    if(res.statusCode < 400) {
                        p.fulfill(buf);
                    } else {
                        p.reject(buf);
                    }
                }).on('error',function(error){
                    p.reject(error);
                });
            }).on('error',function(error) { 
                p.reject(error)
            }).end(data,options.encoding);
               
            return p;
        }
    } else xhr = require('ajax');

    function request(method,path,data,options,callback) { 

        if(typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        options = options ? options : {};

        options = utils.extend(true,{},db._server,options);       

        if(data) {
            try {
                data = JSON.stringify(data);
            } catch(err) {
                throw "failed to json stringify data";
            }
        }    

        if(db._name) {
            path = '/_db/' + db._name + path;
        }

        var res = xhr(method,path,options,data); 

        if(callback) {
            res.then(function(value){
                callback(undefined,value);    
            },function(reason){
                callback(1,reason);    
            });         
        }

        return res;    
    }

    return request;
}

module.exports = closure;        
