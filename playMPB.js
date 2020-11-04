const endpoint = "//cors-anywhere.herokuapp.com/https://games.roblox.com/v1/games/4953508391/servers/Public";
const resultBox = $("#result").get(0);
const reasonBox = $("#reason").get(0);

const Responses = [
	["warn", "Maybe?", "Theres one or more sweats online"],
	["warn", "Maybe?", "The server is pretty empty"],
	["warn", "Maybe?", "The ping is prety high"],
	["alert", "No.", "Nobody is playing"],
	["alert", "No.", "Everyone on the server is sweaty"],
	["success", "Sure.", "There's quite a few people playing"]
];

const sweats = [
	347826216,	// bIuejaay
	284533122,	// jeffmlgrekt
	194829277,	// Stranglings
	60840677,	// hackerDuDMeN
	56460109	// soccerfan4321
];

const get = async function() {
	return new Promise(resolve => $.getJSON(endpoint, resolve));
}

const contains = (arr1, arr2) => {
	let occurrences = 0;
	for (var item of arr1)
		if (arr2.includes(item))
			occurrences++;
	return occurrences;
}

const severity = val => {
	return val === "alert" ? 2 : (val === "warn" ? 1 : 0);
}

let curSevereness = 0;
const pickResponse = function(index) {
	let sev = severity(resultBox.class);
	if (sev >= curSevereness) {
		[
			resultBox.className, 
			resultBox.textContent, 
			reasonBox.textContent
		] = Responses[index];
		curSevereness = sev;
	}
}

const answer = async function() {
	const result = await get();
	let maxPlaying = 0;
	let count;
	pickResponse(5);
	for (var server of result.data) {
		maxPlaying = Math.max(maxPlaying, server.playing);
		count = contains(server.playerIds, sweats);
		if (count == maxPlaying)
			pickResponse(4);
		else if (count > 0)
			pickResponse(0);
		else if (server.ping >= 100)
			pickResponse(2);
	}
	if (result.data.length === 0)
		pickResponse(3);
	else if (maxPlaying <= 5)
		pickResponse(1);
}

answer();
