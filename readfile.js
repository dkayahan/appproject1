function readTreeBank(){
	var file = "file:///home/dilek/Desktop/boun/nlp/app project1/appproject1/METUSABANCI_treebank.conll"
	var rawFile = new XMLHttpRequest();
    	rawFile.open("GET", file, false);
    	rawFile.onreadystatechange = function(){
        if(rawFile.readyState === 4){
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                console.log(allText);
            }
        }
    }
    rawFile.send(null);
}

function init(){
	readTreeBank();
}
