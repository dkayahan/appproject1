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
function divideCorpusRandomly(corpus, random){
	var testLength = Math.round(corpus.length/10); //10% of corpus is test
	var testData = new Array();
	var randHistory = new Array();
	var previousRand = JSON.parse(localStorage.getItem("randSequence"));
	for(var i=0; i<testLength; i++){ //For each time randomly select an entry in corpus for test data
		var rand;
		if(random || previousRand == null) //generate different corpus for each time 
			rand = Math.floor(Math.random()*corpus.length);
		else
			rand = previousRand[i];
		randHistory.push(rand);
		testData.push(corpus[rand]); //add to test corpus
		corpus.splice(rand, 1); //remove test data from corpus. Remaining part will be training corpus
	}
	localStorage.setItem("randSequence", JSON.stringify(randHistory));
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

/**
 * Calculate tranisition and word probabilities
 * @param trainData
 */
function trainSystem(trainData){
	//trainData.length = 2;  //For test purposes
	var POSCounts = new Object();
	//set POS counts
	for(var i=0; i<trainData.length; i++){
		for(var j=0; j<trainData[i].tags.length; j++){
			if(typeof POSCounts[trainData[i].tags[j]] === "undefined")
				 POSCounts[trainData[i].tags[j]] = 1;
			else
				 POSCounts[trainData[i].tags[j]] +=1;
		}
	}
	
	var transitionProbs = new Object();
	var wordProbs = new Object();
	for(var i=0; i<trainData.length; i++){
		//console.log(trainData[i].getPOSTag()); //For test purposes
		//console.log(trainData[i].getSentence());
		
		//set transition probs for start
		if(typeof transitionProbs["start"] === "undefined") //init start tag
			transitionProbs["start"] = new Object();
		if(typeof transitionProbs["start"][trainData[i].tags[0]] === "undefined")
			transitionProbs["start"][trainData[i].tags[0]] = 1;
		else
			transitionProbs["start"][trainData[i].tags[0]] = 
				transitionProbs["start"][trainData[i].tags[0]]*trainData.length + 1; //trainData.length = count of <s>
		transitionProbs["start"][trainData[i].tags[0]]  /= trainData.length; //trainData.length = count of <s>
		//set transition probs for start

		for(var j=-1; j<trainData[i].tags.length - 1; j++){
			//Set transition probabilities
			if(typeof transitionProbs[trainData[i].tags[j]] === "undefined")
				transitionProbs[trainData[i].tags[j]] = new Object();
			
			if(typeof transitionProbs[trainData[i].tags[j]][trainData[i].tags[j+1]] === "undefined")
				transitionProbs[trainData[i].tags[j]][trainData[i].tags[j+1]] = 1; //Cause undefineds - no problem
			else
				transitionProbs[trainData[i].tags[j]][trainData[i].tags[j+1]] = 
					transitionProbs[trainData[i].tags[j]][trainData[i].tags[j+1]]*POSCounts[trainData[i].tags[j]] + 1;
			transitionProbs[trainData[i].tags[j]][trainData[i].tags[j+1]] /= POSCounts[trainData[i].tags[j]]; //Divide by count of first tag
			//Set transition probabilities
			
			//Set for word probabilities
			if(typeof wordProbs[trainData[i].words[j]] === "undefined")
				wordProbs[trainData[i].words[j]] = new Object();
			if(typeof wordProbs[trainData[i].words[j]][trainData[i].tags[j]] === "undefined")
				wordProbs[trainData[i].words[j]][trainData[i].tags[j]] = 1; 
			else 
				wordProbs[trainData[i].words[j]][trainData[i].tags[j]] = 
					wordProbs[trainData[i].words[j]][trainData[i].tags[j]]*POSCounts[trainData[i].tags[j]] + 1; 
			wordProbs[trainData[i].words[j]][trainData[i].tags[j]] /= POSCounts[trainData[i].tags[j]];
			//Set for word probabilities
		}
	}	
	return {"transitionProbs" : transitionProbs, "wordProbs": wordProbs};
}

/**
 * Outputs transition probabilities
 * returns collection of POSs available in training corpus
 * @param transProbs
 */
function displayTransitionMatrix(transProbs){
	var posTags = new Object();
	for(var tag in transProbs){
		if(tag != "undefined"){
			posTags[tag] = null;
			for(var tag2 in transProbs[tag]){
				if(tag2 != "undefined"){
					posTags[tag2] = null;
				}
			}
		}			
	}
	var tb = document.createElement("table");
	tb.setAttribute("cellpadding", "5px");
	var setRowTitle = true;
	for(var tag in posTags){
		var setColTitle = true;
		var tr = document.createElement("tr");	
		if(setRowTitle){
			var rowTitle = document.createElement("tr");
			var td = document.createElement("td");
			rowTitle.appendChild(td);
			tb.appendChild(rowTitle);
		}		
		for(var tag2 in posTags){
			if(tag2 != "start"){
				if(setRowTitle){
					var td = document.createElement("td");
					td.innerHTML = "<b>" + tag2 + "</b>";
					rowTitle.appendChild(td);
				}
				if(setColTitle){
					var td = document.createElement("td");
					td.innerHTML = "<b>" + tag + "</b>";
					tr.appendChild(td);
					setColTitle = false;
				}			
				//Set values
				td = document.createElement("td");
				if(typeof transProbs[tag][tag2] === "undefined")
					td.innerHTML = "0<br><span style='font:13px italic'>" + tag + " -> " + tag2 + "</span>";
				else
					td.innerHTML = transProbs[tag][tag2].toFixed(8) + "<br><span style='font:13px italic'>" + tag + " -> " + tag2 + "</span>";
				tr.appendChild(td);
			}
		}
		setRowTitle = false;
		tb.appendChild(tr);
	}
	document.body.appendChild(tb);
	return posTags;
}

function init(){
	readTreeBank(function(response){
		var corpus = parseCorpus(response);
		//console.log("Corpus:", corpus);
		//console.log(corpus[0].getSentence());
		//console.log(corpus[0].getPOSTag());
		//console.log(corpus[0].words);
		//console.log(corpus[0].tags);
		var dataSet = divideCorpusRandomly(corpus, false);
		//console.log("DataSet: ",dataSet);
		//displayCorpus(dataSet);
		//console.log("Transition prob of Adj-Noun: ", probs.transitionProbs["Adj"]["Noun"]); //Use with try-catch, if throws exception assign 0
		//console.log("Word prob of broşür-Noun: ", probs.wordProbs["broşür"]["Noun"]); //Use with try-catch, if throws exception assign 0
		var probs = trainSystem(dataSet.train);
		console.log("Trained transition Probabilities: ", probs.transitionProbs);
		var posTags = displayTransitionMatrix(probs.transitionProbs);
		console.log("All POS Tags available in train dataSet: ", posTags);
	
	});
}
