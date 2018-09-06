if(typeof window._coupangCMG_ !== "object")
	window._coupangCMG_ = [];

window._coupangCMG_.push(new function(){

	var empty = {},
		that = this,
		toolBelt = new function(){
			this.map = function(from, to, properties){
				if(!from) from = empty;
				for(var i=0; i<properties.length; i++){
					var lc = properties[i].toLowerCase(),
						v = from[lc];

					if(typeof v === "string" && (/[^0-9]/).test(v) === false && (/Id$/).test(properties[i]))
						v = parseInt(v,10);

					to[properties[i]] = (v !== undefined ? v : to[properties[i]]);
				}
			};

			this.paramaterize = function(url){
				var params = {},
					question = url.indexOf("?"),
					pattern = /(&|^\?)([^&=]*)([=]*)([^&]*)/g,
					match;

				if(question < 0)
					return params;

				url = url.substring(question, url.length);

				while((match = pattern.exec(url)) !== null)
					if(match[2].length)
						params[decodeURIComponent(match[2]).toLowerCase()] = (match[3].length ? decodeURIComponent(match[4]) : null);

				return params;
			};

			this.parseAll = function(a, parser){
				parser = parser || ((v) => {return v;});
				for(var i=0; i<a.length; i++)
					a[i] = parser(a[i],10);
				return a;
			};

			this.escape = function(s){
				return s.toString().replace(/[\\]*'/g, (match) => {
					if(match.length % 2 === 1)
						return "\\"+match;
					return match;
				});
			};

			var unsafe = /[^0-9a-z'"<>&;]/ig,
				special = {
					"pattern" : /['"&<>]/g,
					"\"": "&quot;",
					"'" : "&apos;",
					"<" : "&lt;",
					">" : "&gt;",
					"&" : "&amp;"
				};

			this.pad = function(s, l, c){
				while(s.length < l) s = c + s;
				return s;
			};

			this.htmlEncode = function(s){

				if(s === null || s === undefined)
					return "";

				s = s.toString().replace(special.pattern, (match) => {
					return special[match];
				}).replace(unsafe, (match) => {
					return "&#x"+toolBelt.pad(match.charCodeAt(0).toString(16), 4, "0")+";";
				});
				return s;
			};

			this.split = function(array, parser){
				return (typeof array === "string" ? toolBelt.parseAll(array.split(","), parser) : array);
			};

			this.format = function(){
				var target = arguments[0],
					i=1;
				return target.replace(/%s/g, (match) => {return (i >= arguments.length ? match : arguments[i++]);});
			};
		};

	function inject(markup, height, width){

		var el = document.createElement("iframe");

		el.style.border="0";
		el.scrolling="no";
		el.seamless="seamless";
		
		function loadCheck(){
			if(el.loaded !== true){
				el.loaded = true;
				if(typeof markup === "string"){
					
					var fcd = el.contentWindow.document;
					
					// give this iframe wrapper the same doctype as the parent page.	Otherwise
					// ajax requests from within the iframe don't have a referrer.
					var dts = "",
						dt = document.doctype;	
					
					if(!dt)
						dts = "<!DOCTYPE html>";
					else
						dts = "<!DOCTYPE "
							 + dt.name
							 + (dt.publicId ? ' PUBLIC "' + dt.publicId + '"' : '')
							 + (!dt.publicId && dt.systemId ? ' SYSTEM' : '') 
							 + (dt.systemId ? ' "' + dt.systemId + '"' : '')
							 + '>';
					
					fcd.open();
					fcd.write(dts+"<html><head></head><body style=\"margin:0;padding:0;height:"+height+";width:"+width+";\">"+markup+"</body></html>");
					
					if((/(MSIE|Trident|Edge)/).test(navigator.userAgent) === false)
						fcd.close(); // don't do this in IE, it crashes the browser.  MSFT quality FTW.
				}
			}
		}
		
		el.addEventListener("load", loadCheck);
		el.addEventListener("error", function(e){});
		el.addEventListener("abort", function(e){});

		el.style.height = height+"px";
		el.style.width = width+"px";

		currentScript.insertAdjacentElement("afterend", el);

		if(el.contentWindow && el.contentWindow.document){
			// in browsers where the iframe's content is immediately available, skip the load callback
			loadCheck();
		}
	}

	function euc(s){return encodeURIComponent(s);}

	var platform = "p", // p = pc, m = mobile
		linkTypes = [
			(mobileLink) => {
				// list link
				var match = (/^(?:k|co)upang:\/\/list\?.*?&?linkcode=([^&]*)$/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return "/n"+platform+"/categories/"+euc(decodeURIComponent(match[1]));
			},
			(mobileLink) => {
				// search link
				var match = (/^(?:k|co)upang:\/\/search\?/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return "/n"+platform+"/search"+mobileLink.slice(mobileLink.indexOf("?"));
			},
			(mobileLink) => {
				// exhibition
				var match = (/^(?:k|co)upang:\/\/promotion\?.*?&?promotionId=([^&]*)/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return "/n"+platform+"/promotion/"+euc(decodeURIComponent(match[1]));
			},
			(mobileLink) => {
				// product
				var match = (/^(?:k|co)upang:\/\/product\?/i).exec(mobileLink);
				if(match === null || match === undefined) return false;

				var params = toolBelt.paramaterize(mobileLink);
				return "/v"+platform+"/products/"+euc(params.pid)+(params.vendoritemid ? "?vendorItemId=" + euc(params.vendoritemid) : "");
			},
			(mobileLink) => {
				// vendor item package
				var match = (/^(?:k|co)upang:\/\/detail\?.*?&?coupangSrl=([^&]*)/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return "/n"+platform+"/products/"+euc(decodeURIComponent(match[1]));
			},
			(mobileLink) => {
				// download coupon
				var match = (/^(?:k|co)upang:\/\/event\?.*?&?bannerUrl=([^&]*)/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return decodeURIComponent(match[1]).replace(/\/v[mp]\//, () => {return "/v"+platform+"/";});
			},
			(mobileLink) => {
				// products/brand-shop?brandName=
				var match = (/^(?:k|co)upang:\/\/brandShop\?.*?&?brandName=([^&]*)/i).exec(mobileLink);
				if(match === null || match === undefined) return false;
				return "/n"+platform+"/products/brand-shop?brandName="+euc(decodeURIComponent(match[1]));
			},
			(mobileLink) => {return mobileLink;}
		];

	function getWebLink(mobileLink){
		for(var i=0; i<linkTypes.length; i++){
			var translated = linkTypes[i](mobileLink);
			if(translated !== false)
				return translated;
		}
		return mobileLink;
	}

	this.getWebLink = getWebLink;

	function findCurrentScript(){
		if(document.currentScript)
			return document.currentScript;

		for(var i=0; i<document.scripts.length; i++){
			var s = document.scripts[i];
			if((/cmg_request\.js/i).test(s.src) && s.getAttribute("cmg_tagged") !== "1"){
				s.setAttribute("cmg_tagged","1");
				return s;
			}
		}
		return {src:""}; // this line should never be reached unless there's a bug
	}

	function sendBeacon(url, async){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, async);
		try{xhr.send();}catch(ex){}
	}

	//window._coupangCMGScripts_ = (typeof window._coupangCMGScripts_ === "number" ? window._coupangCMGScripts_ || 0);
	var currentScript = findCurrentScript();

	//var tagParams = scriptTagParams();
	function adRequest(params, callback){
		var p = {
				url: document.location.href.toString(),
				referrer: document.referrer || undefined,
				//enableBotFiltering: true,
				placements: [{
					divName: "1",
					networkId: 10116,
					adTypes: [],
					zoneIds: [],
				}]
			},
			rootProperties = ["url","referrer","ip","user","keywords","blockedCreatives","isMobie","notrack"],
			placementProperties = ["divName","siteId","adTypes","zoneIds","campaignId","flightId","adId","clickUrl","eventIds","category"]; //"overrides","contentKeys"];

		//map(tagParams, p, rootProperties);
		//map(tagParams, p.placement, placementProperties);
		toolBelt.map(params, p, rootProperties);
		toolBelt.map(params, p.placements[0], placementProperties);

		if(p.user)
			p.user = {key:p.user};

		p.keywords = toolBelt.split(p.keywords);

		var p0 = p.placements[0];
		p0.adTypes = toolBelt.split(p0.adTypes, parseInt);
		p0.zoneIds = toolBelt.split(p0.zoneIds, parseInt);
		p0.eventIds = toolBelt.split(p0.eventIds, parseInt);

		if(p0.category){
			p0.properties = {category: p0.category};
			p0.category = undefined;
		}

		that.adzerkRequest = p;

		var xhr = new XMLHttpRequest();

		// daniel m

		xhr.onreadystatechange = function() {
		    if(this.readyState == 4){

		    	that.adzerkResponse = xhr.responseText;

		    	var json = JSON.parse(xhr.responseText),
		    		decision = json.decisions[p0.divName];

		    	if(decision === null || decision === undefined)
		    		callback(false);
		    	else{

		    		var destination = "#",
		    			image = "#";

		    		if(decision.contents && decision.contents.length && decision.contents[0].data){
		    			var data = decision.contents[0].data;
		    			destination = data.ctDestination ? data.ctDestination : destination; // TODO: figure out what to do with "coupang://" links
		    			image = data.ctImage1 ? data.ctImage1 : image;
		    		}

		    		var markup = "<script type=\"text/javascript\">%s;</script><a href=\"%s\" style=\"border:0;\" onclick=\"sendBeacon('%s',false);\" target=\"_parent\"><img src=\"%s\" onload=\"sendBeacon('%s',true);\" style=\"height:%spx; width:%spx;\" /></a>";
		    		markup = toolBelt.format(
		    			markup, 
		    			sendBeacon.toString(), 
		    			toolBelt.htmlEncode(getWebLink(destination)), 
		    			toolBelt.escape(decision.clickUrl), 
		    			toolBelt.htmlEncode(image), 
		    			toolBelt.escape(decision.impressionUrl), 
		    			toolBelt.htmlEncode(decision.height), 
		    			toolBelt.htmlEncode(decision.width)
		    		);

		    		inject(markup, decision.height, decision.width);

		    		callback(true);
		    	}
		    }
		}

		xhr.withCredentials = true;
		xhr.open("POST", "https://e-10116.adzerk.net/api/v2", true);
		xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		xhr.send(JSON.stringify(p));
	};

	adRequest(toolBelt.paramaterize(currentScript.src), () => {});
});