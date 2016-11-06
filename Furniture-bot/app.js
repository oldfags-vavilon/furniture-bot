'use strict';

var Discord = require("discord.js");
var http = require("http");
var Buffer = require("buffer").Buffer;
var Dota2Api = require('dota2api');
var fs = require("fs");
var request = require("request");
var parseString = require('xml2js').parseString;
var jsonfile = require('jsonfile');
var twitter = require('twitter');
var express = require('express');
var cheerio = require('cheerio');

var db_scrapper = express();
var config = require('./config.json');

var mybot = new Discord.Client({
    disable_everyone: true,
    max_message_cache: 1000,
    message_cache_lifetime: 240,
    message_sweep_interval: 120
});

var stats;
var commands = new Map();
var triggerPrefix = config.commandTrigger + config.botPrefix;
commands.set(new RegExp(triggerPrefix + '(список) (к[оа]манд|ключ[еи]вых\s(фраз|слов)|приказ[оа]в)', 'i'), ['text', "Полный список команд на канале #furniture_help"]);
commands.set(new RegExp(triggerPrefix + 'популярные команды', 'i'), ['function', sendPopularCommands]);
commands.set(new RegExp(triggerPrefix + 'выйди с канала', 'i'), ['function', leaveVoiceChannel]);
commands.set(new RegExp(triggerPrefix + 'аватар', 'i'), ['function', sendAvatarUrl]);
commands.set(new RegExp(triggerPrefix + '((раск|ск)[ао]жи) (случайную|р[ао]ндомную|к[оа]к(ую|ой)-нибудь) (мысль|цитату|[ао]ф[оа]ризм|рофлянку)', 'i'), ['function', RandomQuote]);
commands.set(new RegExp(triggerPrefix + 'отключись', 'i'), ['function', botDisconnect]);
commands.set(new RegExp(triggerPrefix + 'статус (.{1,40})', 'i'), ['function/regexp', botStatusSet]);
commands.set(new RegExp('(?:(?:https?:)?\/\/)?((?:www\.)|(?:ru\.))dotabuff.com(\/)matches(\/)([0-9]*)', 'igm'), ['function/regexp', botParseDota2Match]);
commands.set(new RegExp(triggerPrefix + "(гиф) ([A-Za-z0-9\+_-]+)( \| )?(([0-9]){1})?( штук)?", 'igm'), ['function/regexp', botGetGiphyAPI]);
commands.set(new RegExp('http:\/\/steamcommunity.com(\/)(profiles|id)(\/)((7656119(\d{10}))|([A-Za-z0-9_]+))', 'ig'), ['function/regexp', botParseSteamProfile]);
/*commands.set(new RegExp('(?:(?:https?:)?\/\/)?((?:www\.)|(?:ru\.))opendota\.com\/players\/([0-9]+)', 'ig'), ['function/regexp', botParseDotabuffPlayer]);*/
if (config.demoMode) {
    commands.set(/liftoff/i, ['text', 'Houston, we have liftoff!']);
}
// commands.set(//i, ['', '']);

var mybot_id = "200314533246533632";
var twit = new twitter({
    consumer_key: '1t8zYIAjTohDmJasX4dTSIk0W',
    consumer_secret: 'P5EnBuyhpAyWtR1c2tQyyCk8Gz6qKkgbQM0crBhbFoyMHEPpjR',
    access_token_key: '227631349-L5r5dUFeZnfpqcUBJdAgNvTfAjANfzYECR3FNgDB',
    access_token_secret: 'TaUhm2nLo1VicZX364y6KWzxILaLza6DlwVTgF2tOkwvo'
});

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
    ":keycap_ten:"
];
var d2_dotabuff_link_matches = "http://www.dotabuff.com/matches/";
var twitch_streamers = "/data/streams.json";
var twitch_api_streams = "https://api.twitch.tv/kraken/streams?channel=";

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

function incrementSoundStats(command) {
    if (stats[command]) {
        stats[command]++;
    } else {
        stats[command] = 1;
    }
    fs.writeFile(config.statsFileName, JSON.stringify(stats));
}

function loadStatsFile() {
    fs.readFile(config.statsFileName, 'utf-8', function (error, data) {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.writeFileSync(config.statsFileName, JSON.stringify({}));
                stats = {};
            } else {
                console.log('Error: ', error);
            }
        } else {
            try {
                stats = JSON.parse(data);
            } catch (parsingError) {
                console.log('Error parsing JSON: ', parsingError);
            }
        }
    });
}

function fileToCommand(file) {
    return config.commandTrigger + file.split('.')[0].split('-').join(' ');
}

function regExpToCommand(command) {
    return command.toString().split('/')[1];
}

function addSoundsTo(map, fromDirectoryPath) {
    var soundFiles = fs.readdir(fromDirectoryPath, function (err, files) {
        files.forEach(function (file) {
            if (file[0] !== '.') {
                var command = fileToCommand(file);
                var commandRegExp = new RegExp(command, 'i');
                map.set(commandRegExp, ['sound', file]);
            }
        });
    });
}

/*function sendMessage(authorChannel, text) {
    bot.sendMessage(authorChannel, text);
}*/

function leaveVoiceChannel(message) {
    if (bot.voiceConnections.get('server', message.server)) {
        bot.voiceConnections.get('server', message.server).destroy();
    }
}

function sendPopularCommands(message) {
    var total = 0;
    var statsArray = [];
    var popularMessage = '';
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            statsArray.push([key, stats[key]]);
            total += stats[key];
        }
    }
    statsArray.sort(function (a, b) {
        return b[1] - a[1];
    });
    var i = 0;
    while (i < statsArray.length && i < 5) {
        popularMessage += statsArray[i][0] + ' — ' + Math.round((statsArray[i][1] / total) * 100) + '%\n';
        i++;
    }
    message.channel.sendMessage(popularMessage);
}

function sendAvatarUrl(message) {
    message.channel.sendMessage(message.author + " \nПрямая ссылка на ваш аватар в дискорде: " + message.author.avatarURL);
}

function botDisconnect(message) {
    if (message.author.id === "161220202154033152") {
        message.reply("Я повинуюсь.");
        console.log("Disconnected!");
        mybot.destroy();
    }
}

function botStatusSet(message, regexp) {
    var status = regexp.exec(message.content);
    mybot.user.setGame(status[1], "https://docs.google.com/document/d/1lb7KIEtxXprXaLWmMdJbVVrotvNtK0c10AJrWuSOppY/edit?usp=sharing");
    message.reply("статус \"" + status[1] + "\" установлен");
}

function botParseDota2Match(message, regexp) {
    if (!message.author.bot) {
        var id = regexp.exec(message.content);
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
                message.reply(str);
                setTimeout(function () {
                    message.reply(str_items)
                }, 200);
            } else {
                console.log(err);
            }
        });
    }
}

function botGetGiphyAPI(message, regexp) {
    var tag = regexp.exec(message.content);
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
                message.reply(url_array);
            } else {
                var count = parseInt(tag[4]) + 1;
                console.log("Count " + count)
                while (count) {
                    url_array = body.data[Math.floor(Math.random() * body.data.length)].images.original.url;
                    message.reply(url_array)
                    console.log("Numeric " + body.data[Math.floor(Math.random() * body.data.length)].images.original.url);
                    count--;
                }
            }
            //console.log(url_array);
        } else {
            message.reply("Изображений с данным тегом не существует");
        }
    })
}

function botParseSteamProfile(OMessage, regexp) {
    var profile_page = regexp.exec(OMessage.content);
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
                    "VAC бан: " + (result.profile.vacBanned == "0" ? "Отсутствует" : ":bangbang:**Имеется VAC бан**:bangbang:") + "\n" +
                    "Трейд бан: " + (result.profile.tradeBanState == "None" ? "Отсутствует" : ":bangbang:**Имеется трэйд бан**:bangbang:") + "\n";
                OMessage.reply(message);
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
                        OMessage.reply("В данный момент невозможно получить статистику по игроку");
                    }
                    setTimeout(() => {
                        OMessage.reply(message);
                    }, 200)
                });
                console.log(message);

            });
        }
    });
}

/*function botParseDotabuffPlayer(message, regexp) {
    console.log("DB scrapping");
    var url = regexp.exec(message.content)[0];
    console.log(url);
    request(url, function (error, response, html) {
        console.log("Request started");
        if (!error) {
            console.log("No Errors");
            var $ = cheerio.load(html);
            console.log("cheerio loaded");
            var username, sMMR, pMMR, WinRate;
            var json = { username: "", sMMR: "", pMMR: "", WinRate: "" };
            console.log($(".col-md-4").eq(0).eq(0).eq(1).text());
            $('.header-content-title').filter(function (i, el) {
                var data = $(this);
                username = data.first().text();
                json.username = username;
                console.log(username);
            });
            $('.header-content-secondary').filter(function (i, el) {
                var data = $(this);
                sMMR = data.eq(1).eq(0).text();
                json.sMMR = sMMR;
                console.log(sMMR);
            });
        } else {
            console.log(error);
        }
    });
}*/

mybot.on('message', function (message) {
    if (message.author.username !== mybot.user.username) {
        commands.forEach(function (botReply, regexp) {
            if (message.content.match(regexp)) {
                switch (botReply[0]) {
                    case 'function':
                        botReply[1](message);
                        break;
                    case 'function/regexp':
                        botReply[1](message, regexp);
                        break;
                    case 'text':
                        message.channel.sendMessage(botReply[1]);
                        break;
                    default:
                        break;
                }
            }
        });
    }
});

mybot.on("ready", () => {
    console.log(`Ready to begin! Serving in #sweets_table channel`);
    mybot.user.setPresence("with Rokkenjima victims", "online");
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
    console.log("New member event starts");
    //mybot.sendTTSMessage("171033695245828097", "Новый пользователь " + NUser.user + "" + " зашёл на сервер " + Date())
    NUser.guild.defaultChannel.sendMessage(":small_blue_diamond: :large_blue_diamond: :new: :large_blue_diamond: :small_blue_diamond: \nПриветствуйте нового участника! \n" + NUser.user + ", добро пожаловать на сервер " + NUser.guild.name + "\n Теперь ты " + "Ньюфаня!" + " \n:small_blue_diamond: :large_blue_diamond: :new: :large_blue_diamond: :small_blue_diamond:")
    NUser.addRole(NUser.guild.roles.get("name", "Ньюфани"), () => {
        console.log("У нас новый Ньюфаня!")
    })
    NUser.user.sendMessage(":small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond:\n" + "Добро пожаловать на " +
        NUser.guild.name + " \n" +
        "Я - личный обслуживающий бот этого сервера, сейчас разъясню вам весь положняк. \n Ваш текущий статус - Ньюфаня \n" +
        "Человек, к которому стоит обращаться с организационными вопросами: " + NUser.guild.owner.user + "" +
        "\nСправа от окна чата находится список пользователей, чем выше группа, к которой принадлежит пользователь, тем больше у него прав, возможна выдача цветного никнейма с особым статусом, и с правами отличными от общей группы, по данному вопросу следует обращаться к " + NUser.guild.owner.user + "" + ".\n" +
        "Слева от окна чата находится список голосовых и текстовых каналов, текстовые расположены в верхней части списка, голосовые, соответственно, в нижней. \n" +
        "Желаю вам активного участия в жизни самой лучшей конференции сосача/хиккача/помирача/педальчана/etc. \nС любовью. :heart: \nВаша мебель. \n" + NUser.user.createdAt + "\n:small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond::small_blue_diamond:");
    setTimeout(function () {
        NUser.user.sendMessage("Ах да, на случай если ты хикка. \nНе стоит стесняться заходить на голосовые каналы и переписываться с другими участниками на текстовых каналах. \nНашёл контент который тебе кажется интересным? Поделись им с остальными :wink:");
    }, 2000);

    //171033695245828097
});

(function init() {
    mybot.login(config.botToken);

    /*if (config.autoLoadSounds) {
        addSoundsTo(commands, config.soundPath);
    }*/

    loadStatsFile();
})();