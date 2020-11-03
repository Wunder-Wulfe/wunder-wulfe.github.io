const endpoint = "//games.roblox.com/v1/games/4953508391/servers/Public";
const resultBox = $("#result");
const reasonBox = $("#reason");

const Reponses = [
	["warn", "Maybe?", "Theres a few sweats online"],
	["warn", "Maybe?", "The server is pretty empty"],
	["warn", "Maybe?", "The ping is prety high"],
	["alert", "No.", "Nobody is playing"],
	["success", "Sure.", "There's quite a few people playing"]
];

const sweats = [
	347826216,
	284533122,
	194829277
];

const get = function(url) {
	return new Promise(resolve => $.ajax({
    		dataType: "jsonp",
    		url: url,
   		success: result => resolve(result)
  	}));
}

const contains = (arr2, arr1) => {
	return arr1.every(i => arr2.includes(i));
}

const severity = val => {
	return val == "alert" ? 2 : (val == "warn" ? 1 : 0);
}

const pickResponse = function(index) {
	if (severity(resultBox.class))
		[
			resultBox.class, 
			resultBox.textContent, 
			reasonBox.textContent
		] = Responses[index];
}

const answer = async function() {
	const result = await get(endpoint);
	let maxPlaying = 0;
	let sweats = 0;
	pickResponse(4);
	for (let server of result.data) {
		maxPlaying = Math.max(maxPlaying, server.playing);
		if (contains(server.playerIds, sweats))
			pickResponse(0);
		else if (server.ping >= 100)
			pickResponse(2);
	}
	if (result.data.length == 0)
		pickResponse(3);
	else if (maxPlaying <= 5)
		pickResponse(1);
}

answer();
