const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require("./model");
const Sequelize = require('sequelize');

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

	models.quiz.findAll()
	.each(quiz => {
			log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {

		if(typeof id === "undefined"){
			errorlog(`Falta el parámetro id.`);
			//reject(new Error('Falta el parametro <id>.'));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)){
				errorlog('El valor del parámetro id no es válido.');
				//reject(new Error('El valor del parámetro id no es válido.'));
			}else{
				resolve(id);
			}

		}

	});
};

exports.showCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'),answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl => {
	makeQuestion(rl, 'Introduzca la pregunta')
	.then(q =>  {
		return makeQuestion(rl, 'Introduzca la respuesta')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(`${colorize('Se ha añadido magenta', 'magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.validationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		
	})
	.then(()=>{
		rl.prompt();
	});
};

exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(`Ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.validationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
	
	})
	.then(()=>{
		rl.prompt;
	});
};
exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		return makeQuestion(rl, `${quiz.question}?`)
		.then(a => {
			a = a.toLowerCase();
			quiz.answer = quiz.answer.toLowerCase();

			if(a === quiz.answer){
				log('Su respuesta es correcta.');
				biglog('Correcta', 'green');
			}else{
				log('Su respuesta es incorrecta.');
				biglog('Incorrecta', 'red');
			}
		});	
	})
	.catch(Sequelize.validationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {

	})
	.then(()=>{
		rl.prompt;
	});
};

exports.playCmd = rl => {
		
	let score = 0;
	let toBeSolved = [];
	let indexAux = [];

	models.quiz.findAll()
	.each(quiz => {
		toBeSolved.push(quiz.get({plain:true}));
	})
	.then(()=>{	

		const playOne = () => {

			if(toBeSolved.length < 1){
				log(colorize('No hay nada más que preguntar.'));
				log(`Fin del juego. Aciertos: ${score}`);
				biglog(score);
				rl.prompt();
			}else{
				var len = toBeSolved.length;
				let index = Math.floor(Math.random() * len);
				validateId(index)
				.then(id => toBeSolved[index])
				.then(quiz => {
					if(!quiz){
						throw new Error(`No existe un quiz asociado al id=${id}.`);
					}
					return makeQuestion(rl, `${quiz.question}?`)
					.then(a => {
						a = a.toLowerCase();
						quiz.answer = quiz.answer.toLowerCase();
						
					if(a === quiz.answer){
						score++;
						log(`CORRECTO-Lleva ${score} aciertos`);
						toBeSolved.splice(index,1);
						playOne();
					}else{
						log('INCORRECTO.');
+						log(`Fin del juego. Aciertos: ${score} `);
						biglog(score);
						rl.prompt();
					}

					});
				});	
			}
		};
		playOne();		
	})
	.catch(Sequelize.validationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {

	});
};	

exports.creditsCmd = rl => {
	log('Autor de la práctica:');
    log('NICOLAS ARRIETA LARRAZA');
    rl.prompt();
};

exports.closeCmd = rl => {
	rl.close();
};