const {log, biglog, errorlog, colorize} = require("./out");
const model = require("./model");

exports.helpCmd = rl =>{
		log("COMANDOS:");
  		log("h|help -- mostrar todos los comandos");
  		log("List -- mostrar lista de preguntas ");
  		log("show <id> -- mostrar respuesta de la pregunta con el id indicado");
  		log("add -- añadir pregunta y respuesta");
  		log("delete <id> -- borrar pregunta con el id indicado");
  		log("edit <id> -- editar pregunta y respuesta con el id indicado");
  		log("test <id> -- hacer prueba de la pregunta con el id indicado");
  		log("p|play -- jugar una partida de preguntas aleatorias");
  		log("credits -- mostrar creditos");
  		log("q|quit -- salir del juego");
  		rl.prompt();
};

exports.listCmd = rl => {

	model.getAll().forEach((quiz, id) => {
		log(` [${colorize(id, 'magenta')}]: ${quiz.question} `);
	});

	rl.prompt();
};

exports.showCmd = (rl, id) => {

	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	}else{
		try{
			const quiz = model.getByIndex(id);
			log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
		} catch(error){
			errorlog(error.message);
		}
	}
	
	rl.prompt();
};

exports.addCmd = rl => {
	
	rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize('Introduzca la respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);
			rl.prompt();
		});
	});
};

exports.deleteCmd = (rl, id) => {
	
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	}else{
		try{
			model.deleteByIndex(id);
		} catch(error){
			errorlog(error.message);
		}
	}

	rl.prompt();
};

exports.editCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}else{
		try{

			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

			rl.question(colorize(' Introduzca una pregunta: ','red'), question => {
				
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

				rl.question(colorize(' Introduzca la respuesta: ','red'), answer => {
					model.update(id, question, answer);
					log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`)
					rl.prompt();
				});
			});
		} catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}			
};
exports.testCmd = (rl, id) => {
	
	if (typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);
			rl.question(colorize(`${quiz.question} ?  `,'red'), answer => {

				answer = answer.toLowerCase();
				quiz.answer = quiz.answer.toLowerCase();

				if(answer === quiz.answer){
					log('Su respuesta es : ');
					biglog('CORRECTA', 'green');
				}else{
					log('Su respuesta es : ');
					biglog('INCORRECTA', 'red');
				}
				rl.prompt();
			});

		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}	
};

exports.playCmd = rl => {
		
	let score = 0;
	let toBeSolved = [];
	const longitud = model.count();

	for(var i=0; i<longitud; i++){
	toBeSolved[i] = model.getByIndex(i);
	}

	const playOne = () => {

		if(toBeSolved.length === 0){
			log(colorize('No hay más preguntas que responder','red'));
			log(`PUNTUACIÓN : ${score} PUNTOS`);
			rl.prompt();
		}else{
			var len = toBeSolved.length;
			let id = Math.floor(Math.random() * len);
			const quiz = toBeSolved[id];
			toBeSolved.splice(id,1);
			rl.question(colorize(`${quiz.question} ?  `,'red'), answer => {
				answer = answer.toLowerCase();
				quiz.answer = quiz.answer.toLowerCase();

				if(answer === quiz.answer){
					score++;
					log('Su respuesta es : ');
					biglog('CORRECTA', 'green');
					log(`HA CONSEGUIDO : ${score} PUNTOS `);
					playOne();
				}else{
					biglog('GAME OVER', 'red');
					log(`PUNTUACIÓN : ${score} PUNTOS `);
					rl.prompt();
				}	
			});

		}
 	};

 	playOne();

};

exports.creditsCmd = rl => {
	log('Autor de la práctica:');
    log('Nicolás Arrieta Larraza');
    rl.prompt();
};

exports.closeCmd = rl => {
	rl.close();
};