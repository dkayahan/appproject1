/** 
 * Reads METU Sabancı treebank asyncly
 * Returns input as callback
 */
function readTreeBank(callback){
	var file = "./METUSABANCI_treebank.conll";
	console.log("Reading treebank from: "+file);
	var xmlReq = new XMLHttpRequest();
		xmlReq.open("GET", file, true);
		xmlReq.onreadystatechange = function(){
        if(xmlReq.readyState === 4){
            if(xmlReq.status === 200 || xmlReq.status == 0){
                callback(xmlReq.responseText);
            }
        }
    }
	xmlReq.send();
}

/**
 * Returns corpus as an array of sentence object = {words: ["word1", "word2", "word3"], tags: ["tag1", "tag2", "tag3"]}
 * Tokens that starts with "_" is ignored during METU Sabancı parse
 * @param text = text to be parsed
 */
function parseCorpus(text){
	console.log("Parsing METU SABANCI Treebank into corpus");
	var sentencesInMETU = text.split("\n\n"); //Divide by empty lines
	console.log("Number of sentences in METU SABANCI Treebank is: ", sentencesInMETU.length);
	var corpus = new Array();
	for(var i = 0; i<sentencesInMETU.length; i++){ //Parse each sentence for word and POS
		var lineOfSentence = sentencesInMETU[i].split("\n"); //Each line of sentence: Ex/ ﻿1	Peşreve	peşrev	Noun	Noun	A3sg|Pnon|Dat	2	OBJECT	_	_
		var sentenceOfCorpus = {words:[], tags: [], getSentence: function(){
			return this.words.join(" ");
		}, getPOSTag: function(){
			return this.tags.join(" ");
		}};
		for(var j = 0; j<lineOfSentence.length; j++){ //Parse each line of sentence
			var wordOfLine = lineOfSentence[j].split("	"); //3 spaces to divide into words
			if(wordOfLine[1] != "_"){ //Ignore words marked with underscore _
				sentenceOfCorpus.words.push(wordOfLine[1]); //word in sentence
				sentenceOfCorpus.tags.push(wordOfLine[3]); //POS tag
			}
		}
		corpus.push(sentenceOfCorpus);
	}
	console.log("Size of corpus: ", corpus.length);
	return corpus;
}

/**
 * Divides given corpus into training(90%) and test(%10)
 * Manipulates on parameter!
 */
function divideCorpusRandomly(corpus){
	var testLength = Math.round(corpus.length/10); //10% of corpus is test
	var testData = new Array();
	for(var i=0; i<testLength; i++){ //For each time randomly select an entry in corpus for test data
		var rand = Math.floor(Math.random()*corpus.length);
		testData.push(corpus[rand]); //add to test corpus
		corpus.splice(rand, 1); //remove test data from corpus. Remaining part will be training corpus
	}
	return {"train": corpus, "test":testData};
}

/**
 * Display train and test datasets
 * @param dataSet
 */
function displayCorpus(dataSet){
	var tb = document.createElement("table");
	var tr = document.createElement("tr");
	var th = document.createElement("th");
	th.innerHTML = "Train Data ("+ dataSet.train.length + ")";
	tb.appendChild(th);
	th = document.createElement("th");
	th.innerHTML = "Test Data ("+ dataSet.test.length + ")";
	tb.appendChild(th);
	for(var i=0; i<dataSet.train.length; i++){
		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.innerHTML = dataSet.train[i].getSentence() + " <i>(" + dataSet.train[i].getPOSTag() + ")</i>";
		tr.appendChild(td);
		td = document.createElement("td");
		if(typeof dataSet.test[i] !== "undefined"){
			td.innerHTML = dataSet.test[i].getSentence() + " <i>(" + dataSet.test[i].getPOSTag() + ")</i>";
		};
		tr.appendChild(td);
		tb.appendChild(tr);
	}
	document.body.appendChild(tb);
}

function init(){
	readTreeBank(function(response){
		var corpus = parseCorpus(response);
		//console.log("Corpus:", corpus);
		//console.log(corpus[0].getSentence());
		//console.log(corpus[0].getPOSTag());
		//console.log(corpus[0].words);
		//console.log(corpus[0].tags);
		var dataSet = divideCorpusRandomly(corpus);
		console.log("DataSet: ",dataSet);
		displayCorpus(dataSet);
	});
}
