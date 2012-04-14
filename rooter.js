
var URL = require('url'),
	http = require('http'),
	util = require('util');

var cityArray = ['suzhou', 'changshu', 'kunshan', 'nantong', 'zhongshan', 'shaoxing', 'wujiang'],
	mapUrls = ['http://www.subicycle.com/map.asp','http://www.csbike01.com/map.asp', 'http://www.ksbike01.com/map2.asp', 'http://www.ntbike.com/map.asp', 
			  'http://www.zsbicycle.com/zsbicycle/map.asp', 'http://www.sxbicycle.com/map1.asp', 'http://www.wjbicycle.com/wjbicycle/map.asp'],
	allBicyclesUrl = ['http://www.subicycle.com/szmap/ibikestation.asp' ,'http://www.csbike01.com/csmap/ibikestation.asp', 'http://www.ksbike01.com/ksmap/ibikestation.asp',
					  'http://www.ntbike.com/ntmap/ibikestation.asp','http://www.zsbicycle.com/zsbicycle/zsmap/ibikestation.asp',
					  'http://www.sxbicycle.com/sxmap/ibikestation.asp', 'http://www.wjbicycle.com/wjbicycle/wjmap/ibikestation.asp'],
	singleBicycleUrl = ['http://www.subicycle.com/szmap/ibikestation.asp?id=', 'http://www.csbike01.com/csmap/ibikestation.asp?id=', 'http://www.ksbike01.com/ksmap/ibikestation.asp?id=',
						'http://www.ntbike.com/ntmap/ibikestation.asp?id=', 'http://www.zsbicycle.com/zsbicycle/zsmap/ibikestation.asp?id=',
						'http://www.sxbicycle.com/sxmap/ibikestation.asp?id=', 'http://www.wjbicycle.com/wjbicycle/wjmap/ibikestation.asp?id='],
	cookieArray = [null, null, null, null, null, null, null];
	
function redirect(req, res){
	var pathUrl = req.url;
	if(pathUrl == '/favicon.ico'){
		return;
	}
	var pathObj = URL.parse(pathUrl, true);
	var paramObj = pathObj.query;	
	
	var city = paramObj.city;
	var id = paramObj.id;
	
	// console.log('redirect city = ' + city + ', id = ' + id);
	
	var index = getIndex(city);
	// console.log('redirect index = ' + index);
	
	console.log('time = ' + new Date().toGMTString());
	
	if(!cookieArray[index]){
		console.log('===========================New Cookie==================================');
		getCookie(index, id, res);		
	}else{
		console.log('===========================Old Cookie==================================');
		console.log('city = ' + city + ', id = ' + id);
		getBicycleInfo(index, id, res);
	}
	// getCookie(index, id, res);
}

function getIndex(city){
	var index = -1;
	for(var i in cityArray){
		if(cityArray[i] == city){
			index = i;
			break;
		}
	}
	return index;
}

function getCookie(index, id, res){
	var mapUrl = mapUrls[index];
	var options = URL.parse(mapUrl);
	
	options.headers = {
		Connection : 'keep-alive',
		Host : options.host		
	};
	// options.port = '80';
	
	var req = http.get(options, function(response) {
		response.setEncoding('utf8');

		response.on('end', function(){
			var cookie = response.headers['set-cookie'][0].split('\\;');
			console.log('getCookie cookie = ' + cookie);
			cookieArray[index] = cookie;
			getBicycleInfo(index, id, res);
			// keepSessinTask(index);
		});
	});
	req.on('error', function(){
		res.writeHeader(404, "404");
		res.end('404');
	});
}

function getBicycleInfo(index, id, res){
	var bicycleOption = URL.parse(getBicycleUrl(index, id));
	bicycleOption.headers = {
		Connection : 'keep-alive',
		Host : bicycleOption.host,
		cookie : cookieArray[index]
	}
	
	http.get(bicycleOption, function(response) {
		response.setEncoding('utf8');
		var data = '';	
		response.on('data', function(chunck) {
			data += chunck;
		});
		response.on('end', function(){
			if(data){
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end(data);
			}
		});
	});
}

function refreshCookieTask(){
	console.log('----------------------refreshCookieTask------------------------------');
	for(var i = 0; i < 2; i++){
		//first get cookie
		getCookieTask(i);
		//then refresh cookie every 20 minutes
		setInterval(getCookieTask, 1200000, [i]);
		//keep session in every 2 minutes
		// keepSessinTask(i);
	}
}

function getCookieTask(index){
	console.log('****************Refresh City ' + cityArray[index] +' cookie ****************')
	var mapUrl = mapUrls[index];
	var options = URL.parse(mapUrl);
	
	options.headers = {
		Connection : 'keep-alive',
		Host : options.host		
	};
	// options.port = '80';
	
	var req = http.get(options, function(response) {
		response.on('end', function(){
			var cookie = response.headers['set-cookie'][0].split('\\;');
			console.log('-----------Refresh Cookie city = ' + cityArray[index] + ', cookie = ' + cookie + ', time = ' + new Date().toGMTString());
			cookieArray[index] = cookie;
		});
	});
	req.on('error', function(){
		res.writeHeader(404, "404");
		res.end('404');
	});
}

function keepSessinTask(index){
	console.log('-------------start time = ' + new Date().toString());
	setInterval(getBicycleInfoTask, 120000, [index]);
}

function getBicycleInfoTask(index){
	console.log('================getBicycleInfoTask=========== index = ' + index);
	var bicycleOption = URL.parse(getBicycleUrl(index, 1));
	bicycleOption.headers = {
		Connection : 'keep-alive',
		Host : bicycleOption.host,
		cookie : cookieArray[index]
	}
	
	http.get(bicycleOption, function(response){
		response.on('data', function(chunck){
			console.log('************bicycle info = ' + chunck);
			if(chunck.length < 20){
				console.log('-------------end time = ' + new Date().toGMTString());
			}
		});
	});
}

function getBicycleUrl(index, id){
	var url = "";
	if(id){
		url = singleBicycleUrl[index] + id;
	}else{
		url = allBicyclesUrl[index];
	}
	return url;
}

exports.redirect = redirect;
exports.refreshCookieTask = refreshCookieTask;
