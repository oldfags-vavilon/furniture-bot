var Discord = require("discord.js");
var http = require("http");
var Buffer = require("buffer").Buffer;
var Dota2Api = require('dota2api');
var fs = require("fs");
var request = require("request");
var parseString = require('xml2js').parseString;
var jsonfile = require('jsonfile');
var twitter = require('twitter');
//var $ = cheerio.load(data);

var mybot = new Discord.Client({
    disable_everyone: true,
    max_message_cache: 1000,
    message_cache_lifetime: 240,
    message_sweep_interval: 120
});
var mybot_id = "200314533246533632";
var twit = new twitter({
    consumer_key: '1t8zYIAjTohDmJasX4dTSIk0W',
    consumer_secret: 'P5EnBuyhpAyWtR1c2tQyyCk8Gz6qKkgbQM0crBhbFoyMHEPpjR',
    access_token_key: '227631349-L5r5dUFeZnfpqcUBJdAgNvTfAjANfzYECR3FNgDB',
    access_token_secret: 'TaUhm2nLo1VicZX364y6KWzxILaLza6DlwVTgF2tOkwvo'
});

/*require("jsdom").env("", function(err, window) {
	if (err) {
		console.error(err);
		return;
	}

	var $ = require("jquery")(window);
});*/
var prefix = "Мебель, ";
var Date_options = {
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timezone: 'UTC',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
};
var dota2_apikey = "1CFF34B96625D0184478FA084368E8BA";
var dota = new Dota2Api(dota2_apikey);
var ownerID = [
    "161220202154033152",
    "112219617207853056",
    "161220352846856192",
    "170245502749769728",
    "183885631821185025",
    "174247796872839169",
    "181025714055675905",
    "187166570991190016"
];

var d2_json_heroes = require('./data/heroes.json');
var d2_json_items = require('./data/items.json');
var d2_player_slots = [
    ":one:",
    ":two:",
    ":three:",
    ":four:",
    ":five:",
    ":six:",
    ":seven:",
    ":eight:",
    ":nine:",
    ":ten:"
];
var d2_dotabuff_link_matches = "http://www.dotabuff.com/matches/";
var twitch_streamers = "/data/streams.json";
var twitch_api_streams = "https://api.twitch.tv/kraken/streams?channel=";


/*var serverCheck = http.createServer(function(req, res) {
	res.writeHead(200);
	res.end('Bot is working');
});
serverCheck.listen(8080);*/
//var http = require('http'),
/*fs = require('fs');

http.createServer(function (req, res) {

if(req.url.indexOf('.html') != -1){ //req.url has the pathname, check if it conatins '.html'

  fs.readFile(__dirname + '/server/public/index.html', function (err, data) {
	if (err) console.log(err);
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write(data);
	res.end();
  });

}

/*if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

  fs.readFile(__dirname + '/public/js/script.js', function (err, data) {
	if (err) console.log(err);
	res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write(data);
	res.end();
  });

}

if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'

  fs.readFile(__dirname + '/server/public/css/style.css', function (err, data) {
	if (err) console.log(err);
	res.writeHead(200, {'Content-Type': 'text/css'});
	res.write(data);
	res.end();
  });

}

}).listen(8080, '127.0.0.1');
console.log('Server running at http://127.0.0.1:8080/');*/

function download(url, callback) {
    http.get(url, function (res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function () {
            callback(data);
        });
    }).on("error", function () {
        console.log(error);
        callback(null);
    });
}

function RandomQuote(forWhom) {
    var url = "http://api.forismatic.com/api/1.0/?method=getQuote&format=text&language=ru"

    download(url, function (data) {
        if (data) {
            forWhom.channel.sendMessage(forWhom.author + " " + data);
        } else
            console.log("error");
    });
}

function findInArray(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else
            //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
            if (i == key && obj[i] == val || i == key && val == '') { //
                objects.push(obj);
            } else if (obj[i] == val && key == '') {
                //only add if the object is not already in the array
                if (objects.lastIndexOf(obj) == -1) {
                    objects.push(obj);
                }
            }
    }
    return objects;
}

//return an array of values that match on a certain key
function getValues(obj, key) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getValues(obj[i], key));
        } else if (i == key) {
            objects.push(obj[i]);
        }
    }
    return objects;
}

//return an array of keys that match on a certain value
function getKeys(obj, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getKeys(obj[i], val));
        } else if (obj[i] == val) {
            objects.push(i);
        }
    }
    return objects;
}


mybot.on("ready", () => {
    console.log(`Ready to begin! Serving in #sweets_table channel`);
    //mybot.sendMessage("161220464549691392", "@everyone Мебель готова служить")
    mybot.user.setPresence("with Rokkenjima victims", "online");
    //mybot.setStreaming("#furniture-help", "http://piratepad.net/ep/pad/view/ro.aSTr1MR-DNP/latest", 1);
	/*setInterval(function() {
		console.log("Interval counts");
		twit.stream('statuses/filter', {
			'follow': '227631349'
		}, function(stream) {
			console.log("stream got in");
			stream.on('data', function(data) {
				console.log("Got Data!");
				console.log(data);
			});
			stream.on('end', function(response) {
				console.dir(response);
				// Обработка разъединения
			});
			stream.on('destroy', function(response) {
				console.dir(response);
				// Обработка 'тихого' разъединения от твиттера
			});
		});
	}, 60 * 1000);*/
});

mybot.on("error", (error) => {
    console.dir(error);
});

mybot.on("debug", (m) => console.log("[debug]", m));
mybot.on("warn", (m) => console.log("[warn]", m));

mybot.on("disconnect", () => {
    console.log("Disconnected fo sure!");
    mybot.login("MjAwMzE0NTMzMjQ2NTMzNjMy.Cl7c8g.g4qHFbxaSuxMnS-E3r3Gu9dd_ko");
});

mybot.on("guildMemberAdd", (NUser) => {
    console.log ("New member event starts");
    //mybot.sendTTSMessage("171033695245828097", "Новый пользователь " + NUser.user + "" + " зашёл на сервер " + Date())
    NUser.guild.sendMessage(":small_blue_diamond: :large_blue_diamond: :new: :large_blue_diamond: :small_blue_diamond: \nПриветствуйте нового участника! \n" + NUser.user + ", добро пожаловать на сервер " + NUser.guild.name + "\n Теперь ты " + "Ньюфаня!" + " \n:small_blue_diamond: :large_blue_diamond: :new: :large_blue_diamond: :small_blue_diamond:")
    NUser.addRole(NUser.guild.roles.get("name", "Ньюфани"), () => {
        console.log("У нас новый Ньюфаня!")
    })
    NUser.user.sendMessage(":small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond:\n" + "Добро пожаловать на " +
        NUser.guild.name + " \n" +
        "Я - личный обслуживающий бот этого сервера, сейчас разъясню вам весь положняк. \n Ваш текущий статус - Ньюфаня \n" +
        "Человек, к которому стоит обращаться с организационными вопросами: " + NUser.guild.owner.user + "" +
        "\nСправа от окна чата находится список пользователей, чем выше группа, к которой принадлежит пользователь, тем больше у него прав, возможна выдача цветного никнейма с особым статусом, и с правами отличными от общей группы, по данному вопросу следует обращаться к " + server.owner + "" + ".\n" +
        "Слева от окна чата находится список голосовых и текстовых каналов, текстовые расположены в верхней части списка, голосовые, соответственно, в нижней. \n" +
        "Желаю вам активного участия в жизни самой лучшей конференции сосача/хиккача/помирача/педальчана/etc. \nС любовью. :heart: \nВаша мебель. \n" + NUser.user.createdAt + "\n:small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond:");
    setTimeout(function () {
        NUser.user.sendMessage("Ах да, на случай если ты хикка. \nНе стоит стесняться заходить на голосовые каналы и переписываться с другими участниками на текстовых каналах. \nНашёл контент который тебе кажется интересным? Поделись им с остальными :wink:");
    }, 2000);

    //171033695245828097
});

mybot.on("messageDelete", (msg, channel) => {
    if (msg !== null) {
        mybot.sendMessage("171033695245828097", "Пользователь " + msg.author + "" + " **удалил** сообщение:\n " + msg.content)
    } else {
        mybot.sendMessage("171033695245828097", "Некэшированный пользователь " + " **удалил** сообщение, содержание которого не известно\n ")
    }
});

mybot.on("messageUpdate", (msgOld, msgNew) => {
    if (msgNew.author.bot == false) {
        if (msgOld !== null) {
            mybot.sendMessage("171033695245828097", "Пользователь " + msgOld.author + "" + " **изменил** своё сообщение:\n " + "     __**Старое сообщение:**__ " + msgOld.content + "\n" + "      __**Новое сообщение:**__ " + msgNew.content)
        } else if (msgNew.author.bot == false) {
            mybot.sendMessage("171033695245828097", "Некэшированный пользователь " + " **изменил** своё сообщение на сообщение: " + msgNew.content)
        }
    }
});

/*mybot.on("presence", (oldU, newU) => {
	var message = "Пользователь ";
	message = message + oldU + "" + " изменил свои данные\n";
	if (oldU.name != newU.name) {
		message = message + "     :asterisk: Старый никнейм: " + oldU + "" + "\n Новый никнейм: " + newU + "" + "\n";
	}
	if (oldU.avatarURL != newU.avatarURL) {
		message = message + "     :asterisk: Новый аватар: " + newU.avatarURL + "\n";
	}
	if (newU.status != oldU.status) {
		message = message + "     :asterisk: Статус пользователя изменён с **" + oldU.status + "** на **" + newU.status + "** \n"
	}
	if (newU.game !== oldU.game && newU.game.name !== null) {
		message = message + "     :asterisk: Пользователь начал играть в " + newU.game + "\n"
	} //else if (oldU.game !== null) {
	//message = message + "     :asterisk: Пользователь начал играть в " + newU.game.name + "\n"
	//} 
	mybot.sendMessage("171033695245828097", message);
	//171033695245828097
});*/

mybot.on("message", (msg) => {

    var str = "";

    if (msg.content === prefix + "аватар") {
        // [Utility] Выдача ссылки на аватар
        msg.channel.sendMessage( msg.author + " Прямая ссылка на ваш аватар в дискорде: " + msg.author.avatarURL);
    } else if (msg.content === prefix + "подключись") {
        mybot.joinVoiceChannel("187640901202345984", (err, connection) => {
            connection.playFile("./data/newwave.mp3", {}, () => {
                console.log(err)
            });
        });
    } else if (msg.content.match(/(Мебель, )(список) (к[оа]манд|ключ[еи]вых\s(фраз|слов)|приказ[оа]в)/ig)) {
        // [Utility] Выдача списка команд
        msg.channel.sendMessage(msg.author + " Полный список команд на канале #furniture_help");
    } else if (msg.content.match(/(Мебель, )((раск|ск)[ао]жи) (случайную|р[ао]ндомную|к[оа]к(ую|ой)-нибудь) (мысль|цитату|[ао]ф[оа]ризм|рофлянку)/ig)) {
        // [Fun] Выдача случайной фразы/шутки/афоризма
        RandomQuote(msg);
    } else if (msg.content.match(/(Мебель, )(з[оа]ткнис[ья]|умолкни|з[ао]молкни|з[ао]кройся|м[ао]лчи|иди\sна\s(хуй|хер))/ig)) {
        // [Fun] Ответ на агрессию
        if (msg.author.id != ownerID) {
            mybot.reply(msg, "Нахуй иди. Я повинуюсь только Золотой Ведьме.");
        } else {
            mybot.reply(msg, "Хорошо, я помолчу");
        }
    } else if (msg.content === prefix + "отключись" && msg.author.id === "161220202154033152") {
        // [Utility] Отключение бота
        message.reply("Я повинуюсь.");
        console.log("Disconnected!");
        mybot.destroy();
    } else if (msg.content.indexOf(prefix + "статус") > -1) {
        // [Fun/Appearance] Изменение статуса бота
        var status = msg.content.substring(16, msg.content.length - 1);
        if (status.length < 40) {
            mybot.setStatus("online", status);
            mybot.reply(msg, "статус \"" + status + "\" установлен");
        } else {
            mybot.reply(msg, "статус слишком длинный!");
        }
    } else if (msg.content.match(/(Мебель, )(запомни|[оа]бн[оа]ви) (сво[ёй]) (ник(нейм)|имя) (=) /ig) && ownerID.indexOf(msg.author.id) > -1) {
        // [Fun/Appearance] Изменение никнейма
        str = msg.content.split(" = ")[1];
        mybot.setUsername(str);
        mybot.reply(msg, "Теперь я - " + str);
    } else if (msg.content.indexOf(prefix + "афк") > -1) {
        if (ownerID.indexOf(msg.author.id) > -1) {
            console.log(msg.content);
			/*if (msg.content.indexOf("<@!") > -1) {
				str = msg.content.substring(msg.content.lastIndexOf("<@!")+3,msg.content.lastIndexOf(">"));
			} else {
				str = msg.content.substring(msg.content.lastIndexOf("<@")+2,msg.content.lastIndexOf(">"));			
			}*/
            //str = str.substring(0, str.length);
            //console.log (msg.mentions);
            //console.log (mybot.servers[0].members.get("id", str).username);
            if (!(ownerID.indexOf(str) > -1)) {
                var moveUser_ids = msg.mentions;
                str = "На афк канал: \n";
                msg.mentions.forEach(function (val, i, moveUser_ids) {
                    if (!(ownerID.indexOf(val.id) > -1)) {
                        mybot.moveMember(val, "161221877111586816", function (err) {
                            if (err) {
                                console.log(err)
                            }
                        });
                        console.log(val.username);
                        str = str + val + "" + " перемещён \n";
                    } else {
                        str = str + val + "" + " не перемещён (:small_blue_diamond:) \n";
                    }
                });
                //mybot.moveMember(str, "161221877111586816");
                mybot.reply(msg, str);
                //mybot.reply(msg, "Пользователь " + mybot.servers[0].members.get("id", str).username + " отправлен на АФК канал.");
            } else {
                var privelege_user = ""
                ownerID.forEach(function (value, i, ownerID) {
                    privelege_user = privelege_user + ":small_blue_diamond: " + mybot.servers[0].members.get("id", value).mention() + "\n";
                });
                console.log(privelege_user);
                mybot.reply(msg, "вы не можете отправить привилегированного пользователя на АФК канал. \n Привилегированные пользователи: \n \n" + privelege_user);
            }
        } else {
            mybot.reply(msg, "у тебя нет прав на использование команд администратора");
        }
    } else if (msg.content.indexOf(prefix + "перемести ко мне") > -1) {
        if (msg.author.voiceChannel != null) {
            console.log(msg.content);
            if (!(ownerID.indexOf(str) > -1)) {
                var moveUser_ids = msg.mentions;
                str = "в канал на котором вы находитесь перемещены: \n";
                msg.mentions.forEach(function (val, i, moveUser_ids) {
                    //if (!(ownerID.indexOf(val.id) > -1)) {
                    mybot.moveMember(val, msg.author.voiceChannel, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    });
                    console.log(val.username);
                    str = str + val + "" + " перемещён \n";
                    //}
                });
                mybot.reply(msg, str);
            }
        } else {
            mybot.reply(msg, "вы не подключены к голосовому каналу. Кудая перемещать-то буду, даунич?")
        };
    } else if (msg.content.match(/(?:(?:https?:)?\/\/)?((?:www\.)|(?:ru\.))dotabuff.com(\/)matches(\/)([0-9]*)/gm) && msg.author.id != "200314533246533632") {
        var id_regex = /(?:(?:https?:)?\/\/)?((?:www\.)|(?:ru\.))dotabuff.com(\/)matches(\/)([0-9]*)/gm;
        var id = id_regex.exec(msg.content);
        console.log(id[4]);
        var match_json = dota.getMatchDetails(parseInt(id[4]), function (err, res) {
            if (!err) {
                var str = "\n";
                var str_items = "\n"
                //str = str + "Номер матча: " + res.match_id + "\n";
                console.log(res.match_id);
                if (!res.radiant_win) {
                    str = str + "Победитель: " + "Dire \n";
                } else {
                    str = str + "Победитель: " + "Radiant \n";
                }
                str = str + "Игроки: \n \n Radiant \n"
                res.players.forEach(function (val, i, match_json) {
                    var hero_obj = getObjects(d2_json_heroes, "id", val.hero_id);
                    var hero_obj
                    console.log(val.hero_id);
                    console.log(hero_obj);
                    console.log("1/Name is " + getValues(hero_obj, "localized_name"));
                    if (i == 5) {
                        console.log("Deflect success");
                        str = str + "\n Dire \n";
                    }
                    str = str + d2_player_slots[i] + " - " + getValues(hero_obj, "localized_name") +
                        " | **K/D/A:** " + val.kills + "/" + val.deaths + "/" + val.assists +
                        " | **LH/DN:** " + val.last_hits + "/" + val.denies +
                        " | **GPM/XPM:** " + val.gold_per_min + "/" + val.xp_per_min +
                        "\n";
                    str_items = str_items + d2_player_slots[i] +
                        " - Items: ";
                    if (val.item_0 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_0), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/
                    if (val.item_1 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_1), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/
                    if (val.item_2 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_2), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/
                    if (val.item_3 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_3), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/
                    if (val.item_4 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_4), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/
                    if (val.item_5 !== 0) {
                        str_items = str_items + getValues(getObjects(d2_json_items, "id", val.item_5), "localized_name") + "; ";
                    }
					/*else {
						str_items = str_items + "Empty; ";
					};*/

                    str_items = str_items + "\n"
                });
                //str = str + "\n -------------------------------- \n :globe_with_meridians: Dotabuff link: :link:" + d2_dotabuff_link_matches + res.match_id;
                //
                mybot.reply(msg, str);
                setTimeout(function () {
                    mybot.reply(msg, str_items)
                }, 200);
            } else {
                console.log(err);
            }
        })
    } else if (msg.content.match(/(Мебель, гиф) ([A-Za-z0-9\+_-]+)( \[([0-9]){1}\])?/ig)) {
        var tag_regex = /(Мебель, гиф) ([A-Za-z0-9\+_-]+)( \[([0-9]){1}\])?/ig;
        var tag = tag_regex.exec(msg.content);
        var gyphy = [
            "http://api.giphy.com/v1/gifs/search?q=",
            "&api_key=dc6zaTOxFJmzC"
        ];
        console.log("TAG[4] " + tag[4]);
        request({
            url: gyphy[0] + tag[2] + gyphy[1],
            json: true
        }, function (error, response, body) {

            if (!error && response.statusCode === 200 && body.data.length > 0) {
                console.log(body);
                var url_array
                if (tag[4] == undefined) {
                    url_array = body.data[Math.floor(Math.random() * body.data.length)].images.original.url; /*getObjects(body.data [Math.floor(Math.random() * body.length)] , "images");*/
                    //url_array = getValues(url_array, "original");
                    //console.log(url_array[Math.floor(Math.random() * url_array.length)]);
                    //console.log(url_array);
                    mybot.reply(msg, url_array)
                } else {
                    var count = parseInt(tag[4]) + 1;
                    console.log("Count " + count)
                    while (count) {
                        url_array = body.data[Math.floor(Math.random() * body.data.length)].images.original.url;
                        mybot.reply(msg, url_array)
                        console.log("Numeric " + body.data[Math.floor(Math.random() * body.data.length)].images.original.url);
                        count--;
                    }
                }
                //console.log(url_array);
            } else {
                mybot.reply(msg, "Изображений с данным тегом не существует");
            }
        })
    } else if (msg.content.match(/http:\/\/steamcommunity.com(\/)(profiles|id)(\/)((7656119(\d{10}))|([A-Za-z0-9_]+))/ig)) {
        var profile_page_regex = /http:\/\/steamcommunity.com(\/)(profiles|id)(\/)((7656119(\d{10}))|([A-Za-z0-9_]+))/ig;
        var profile_page = profile_page_regex.exec(msg.content);
        console.log(profile_page[0]);
        request({
            url: profile_page[0] + "/?xml=1",
            xml: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                parseString(body, function (err, result) {
                    //console.log(result);
                    var message = "\n"
                    message = message + "Steam ID64: " + result.profile.steamID64 + "\n" +
                        "Никнейм: " + result.profile.steamID + "\n" +
                        "Дата регистрации: " + result.profile.memberSince + "\n" +
                        "В данный момент: " + result.profile.onlineState + "\n" +
                        "VAC бан: " + (result.profile.vacBanned == "0" ? "Отсутствует" : "**Имеется**") + "\n" +
                        "Трейд бан: " + (result.profile.tradeBanState == "None" ? "Отсутствует" : "**Имеется**") + "\n";
                    mybot.reply(msg, message);
                    dota.getByAccountID(result.profile.steamID64, function (err, res) {
                        console.log("Got Matches");
                        if (!err) {
                            //console.log(res);
                            console.log("No Error");
                            var message = "\n Последние пять матчей " + result.profile.steamID + " на дотабаффе: \n";
                            var i = 0;
                            while (i < 5) {
                                console.log(d2_dotabuff_link_matches + res.matches[i].match_id)
                                message = message + "dotabuff.com/matches/" + res.matches[i].match_id + " \n"
                                i++
                            };
                        } else {
                            console.log("В данный момент невозможно получить статистику по игроку \nError: ", err);
                            mybot.reply(msg, "В данный момент невозможно получить статистику по игроку");
                        }
                        setTimeout(() => {
                            mybot.reply(msg, message);
                        }, 200)
                    });
                    console.log(message);

                });
            }
        });
		/*var player_json = dota.getMatchDetails(parseInt(id[3]), function(err, res) {
			if (err) {
				console.log(err);
			} else {

			}
		});*/
    } else if (msg.content.indexOf("Мебель, зайди на канал") > -1) {
        message.member.voiceChannel.join().then(, (err, vc) => {
            mybot.internal.voiceConnection.playFile("./sounds/newwave.mp3", {}, (err, intent) => {
                console.dir(err);
                console.log("Error: " + err);
                mybot.reply(msg, "Starting");

                intent.on("time", function () {
                    console.log("Is playing: " + mybot.internal.voiceConnection.playing);
                });

                intent.on("end", function () {
                    mybot.reply(msg, "Ended");
                });

                intent.on("error", function () {
                    mybot.reply(msg, "There was an error");
                });
            });
        });
    }
	/*else if (msg.content.match(/Мебель, напоминай (([0-9]{1})|10) раз, каждые (([0-9]{1})|10) минут: ([а-яА-Я0-9a-zA-Z ]{1,250})/ig)) {
		var reminder_regex = /Мебель, напоминай (([0-9]{1})|10) раз, каждые (([0-9]{1})|10) минут: ([а-яА-Я0-9a-zA-Z ]{1,250})/ig;
		var reminder_content = reminder_regex.exec(msg.content);
		console.log(reminder_content[3]);
		console.log(reminder_content[5]);
		var reminder_obj = jsonfile.readFile("./data/reminders.json", function(err, obj) {
			console.log(err);
			reminder_obj = obj;
		});
		request({
			url: "./data/reminders.jso",
			json: true
		}, function(error, response, reminder_obj) {
			console.dir(reminder_obj);
			var length = reminder_obj.result.reminders.length + 1;
			reminder_obj.size = reminder_obj.size + 1;
			reminder_obj[length].channel_id = msg.channel.id;
			reminder_obj[length].period = reminder_content[3] * 60 * 1000;
			reminder_obj[length].text = reminder_content[5].trim();
			reminder_obj[length].mentions = msg.mentions;
			//reminder_obj.author = msg.author;
			reminder_obj[length].UId = reminder_content[1];
			console.log("Passed");
			jsonfile.writeFile("./data/reminders.json", reminder_obj, {
				spaces: 2
			}, function(err) {
				console.error(err);
			})
			console.log(reminder_obj);
		});
	}*/



    //else if (msg.content.match(/(Мебель, )(запомни|[оа]бн[оа]ви) (сво[ёй]) (ник(нейм)|имя) (=) /ig))
});

function CheckTwitch() {
    var obj = getValues(twitch_streamers, "streamers");
    console.log(obj);
    //fs.readFile(twitch_streamers, 'utf8', function(err, data) {
    console.log(data);
    console.log(err);
    if (err) throw err;
    obj = JSON.parse(data);
    //});
    //Clean file with streamer ids
    //fs.truncate(twitch_streamers, 0, function(){console.log('done')})
    var streamers_id = "";
    obj.streamers.forEach((item, i, arr) => {
        streamers_id = streamers_id + item + ",";
        console.log(streamers_id);
    });
    request({
        url: twitch_api_streams + streamers_id,
        json: true
    }, (err, resp, body) => {
        console.log(body);
        if (!error && response.statusCode === 200) {
            var messageTwitch = "В данный момент онлайн: \n";
            body.streams.forEach((item, i, arr) => {
                messageTwitch = messageTwitch + item.channel.display_name + " / " + item.channel.status + " - " + item.channel.url + " \n";
            });
            mybot.sendMessage("161220464549691392", messageTwitch);
        } else {
            console.log(err)
        };
    });
}

/*setInterval(() => {
	CheckTwitch();
}, 0.5 * 60 * 1000);*/

mybot.login("MjAwMzE0NTMzMjQ2NTMzNjMy.Cl7c8g.g4qHFbxaSuxMnS-E3r3Gu9dd_ko");

/*var forever = require('forever-monitor');

var child = new(forever.Monitor)('app.js', {
	max: 100,
	silent: true,
	args: []
});

child.on('exit', function() {
	console.log('your-filename.js has exited after 100 restarts');
});

child.start();

child.on('watch:restart', function(info) {
	console.error('Restaring script because ' + info.file + ' changed');
});

child.on('restart', function() {
	console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function(code) {
	console.error('Forever detected script exited with code ' + code);
});*/