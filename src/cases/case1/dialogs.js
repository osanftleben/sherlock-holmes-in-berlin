// Dialoge und Abläufe: Der Uhrmacher von der Rosenthaler Straße
import { clockLabel } from '../../game/game.js';

const tap = (g) => (g.touch ? 'Tippe' : 'Klicke');

// ============================================================ Einstieg
export async function intro(g) {
  await g.journal({
    kicker: 'Aus dem Tagebuch von S. Sigerson · Berlin, Dienstag, den 15. November 1892',
    title: 'Das Herz des Hauses',
    text: `Achtzehn Monate ist es her, dass die Welt mich in den Reichenbachfällen für tot erklärte. Für Berlin bin ich Sigerson, ein norwegischer Forschungsreisender, der ein möbliertes Zimmer über einem Uhrmacherladen in der Rosenthaler Straße bewohnt. Moriartys Leute sind noch nicht alle gefasst; meine Tarnung ist mein Leben.

Ich habe mich an das Ticken gewöhnt. Siebenunddreißig Uhren hat Meister Tiedemann in Laden und Werkstatt unter meinem Fußboden, und ihr Gang dringt durch die Dielen wie ein zweiter Herzschlag. Ich schlafe besser dabei als in jeder Stille.

Gestern kehrte ich erst nach ein Uhr heim – ein Konzert von Joachim in der Singakademie, danach ein langer Weg durch den Nebel. Ich war zu müde, um es zu bemerken.

Heute Morgen bemerkte ich es. Kein Ticken. Kein Schlag zur halben Stunde. Dann ein Schrei aus dem Laden, die Pfeife eines Schutzmanns, schwere Stiefel im Treppenhaus.

*Das Herz des Hauses stand still.*`,
    button: 'Hinunter auf die Straße',
  });
  g.set('intro');
  await g.ui.fade(0, 1100);
  const H = g.holmes;
  await g.wait(0.4);
  await g.think('Ein Schutzmann vor der Ladentür, Neugierige auf dem Trottoir. Und über allem dieser Nebel, als hätte Berlin den Atem angehalten.');
  const P = g.spawn('paule', -2.6, 5.0, Math.PI * 0.8);
  const lauf = g.walk('paule', H.x - 1.1, H.z + 0.9);
  await g.say('paule', 'Extrablatt! Extrablatt! Mord in der Rosenthaler Straße! – Herr Sigerson! Herr Sigerson!');
  await lauf;
  g.faceEach('paule', 'holmes');
  P.lookAt = H.headPos();
  H.lookAt = P.headPos();
  await g.say('paule', 'Se wohnen doch da drüber! Is et wahr? Der olle Tiedemann is tot? Ham Se wat jehört heute Nacht?');
  await g.say('holmes', 'Ich habe vor allem etwas *nicht* gehört, Paule.');
  await g.say('paule', 'Hä?');
  await g.say('holmes', 'Die Uhren. Siebenunddreißig Uhren schweigen. Das allein ist schon ein Verbrechen.');
  await g.say('paule', 'Der Schutzmann lässt keenen rin. Aber wenn eener da rinkommt, dann Sie, wa? Ick weeß doch, wat Se mit Ihrem Kiekglas so treiben.');
  await g.say('holmes', 'Dann bleib in meiner Nähe. Ein Paar scharfer Augen mehr kann nicht schaden – und deine Ohren hören in dieser Straße mehr als jede Polizei.');
  await g.say('paule', 'Jemacht! Und wenn Se mal nich weiterwissen – fragen Se Paule. Det kost’ Se höchstens ’ne Schrippe.');
  g.set('paule');
  H.lookAt = null;
  P.lookAt = null;
  await g.narrate(`${tap(g)} auf den Boden, um zu gehen, und auf Personen oder Dinge, um sie zu untersuchen. Die *Lupe* oben rechts hebt alles hervor, was einen Blick lohnt. Im *Notizbuch* sammelst du Hinweise und ziehst deine Schlüsse.`);
}

export async function resume(g) {
  if (g.flag('finale') && !g.flag('geloest') && g.scene.id === 'werkstatt') { await finale(g); return; }
  if (g.flag('geloest') && !g.state.done) await epilogue(g);
}

// ============================================================ Ausgänge
export function exitBlock(h, g) {
  if (g.flag('finale') && !g.flag('geloest')) return 'Nicht jetzt. Alle warten darauf, dass ich spreche.';
  if (h.id === 's_laden' && !g.flag('zutritt')) return krauseGate;
  if (['s_tor', 's_voss', 's_destille'].includes(h.id) && !g.visited('werkstatt')) return 'Später. Zuerst will ich sehen, was in der Werkstatt geschehen ist.';
  if (h.id === 'v_tuer' && g.flag('voss_distracted')) return 'Nicht jetzt – Paule hat mir ein paar Minuten verschafft. Der Ofen hinter dem Vorhang!';
  return null;
}

// ============================================================ Szenenstart
export const enter = {
  async werkstatt(g, first) {
    if (!first || g.flag('wenzel_theorie')) return;
    const W = g.who('wenzel');
    if (W) W.lookAt = g.holmes.headPos();
    g.focus([0.6, 1.2, -1.6], 6.5);
    await g.say('wenzel', 'Da sehen Sie es. Der Meister, erschlagen mit seiner eigenen Bronzeuhr. Und alle Uhren stehen still – auf Viertel nach elf.');
    await g.say('holmes', 'Siebenunddreißig Uhren, auf dieselbe Minute.');
    await g.say('wenzel', 'Der Bursche da, Hennig, ist aus Schlesien. Dort hält man die Uhren an, wenn einer stirbt – er hat selbst zugegeben, dass er den Brauch kennt. Um zwanzig nach zehn kam er heim, danach war er allein. Und gestern Nachmittag hatte er Streit mit dem Meister. Um das Fräulein.');
    await g.say('gustav', 'Ich war es nicht! Herr Kommissar, ich schwöre bei Gott und allen Heiligen –');
    await g.say('wenzel', 'Das schwören sie alle. Heute Mittag kommt der Wagen und bringt ihn nach Moabit.');
    await g.think('Bis Mittag also. Dann ist ein junger Mann verloren – und wenn er unschuldig ist, umso gründlicher.');
    await g.say('wenzel', 'Sehen Sie sich ruhig um, Herr Sigerson, wenn es Ihnen Vergnügen macht. Aber fassen Sie nichts an, was ich nicht gesehen habe.');
    g.set('wenzel_theorie');
    if (W) W.lookAt = null;
    g.unfocus();
  },
  async hof(g, first) {
    if (!first) return;
    await g.think('Der Hof. Es riecht nach Kohlenrauch und nasser Wäsche. Hier sieht jeder jeden – und die Portiersfrau sieht alle.');
  },
  async kneipe(g, first) {
    if (!first) return;
    await g.say('mahnke', 'Morjen, der Herr! Wat darf’s sein? ’n Korn jejen den Nebel?');
    await g.think('Die Destille »Zum Rosenthaler Tor«. Hier erfährt man mehr über eine Straße als in jedem Adressbuch.');
  },
  async voss(g, first) {
    if (!first) return;
    await g.think('Hier ticken die Uhren. Ein Dutzend auf einmal, kräftig und selbstgefällig. Nach der Stille drüben klingt es beinahe wie Hohn.');
    if (g.who('voss')) await g.say('voss', 'Ah, Kundschaft! Oh – Sie sind der Norweger von drüben, nicht wahr? Schreckliche Geschichte. Schrecklich. Treten Sie näher!');
  },
};

// ============================================================ Straße
async function krauseGate(g) {
  const K = g.who('krause');
  if (K) g.holmes.faceTo(K.x, K.z);
  await g.say('krause', 'Halt! Zurückbleiben! Hier is polizeiliche Absperrung.');
  if (!g.seen('krause_gate')) {
    g.state.seen.krause_gate = 1;
    await g.say('holmes', 'Ich wohne in diesem Haus, Schutzmann. Sigerson, erster Stock, bei Tiedemanns zur Untermiete.');
    await g.say('krause', 'Und wenn Se der Kaiser von China wären. Der Herr Kommissar hat jesagt: keener rin.');
  }
  for (;;) {
    const i = await g.choose([
      'Dann melden Sie dem Kommissar, dass ein Zeuge ihn sprechen möchte.',
      'Sie hatten heute Nacht Dienst, nicht wahr?',
      'Ich komme später wieder.',
    ]);
    if (i === 0) { await callWenzel(g); return; }
    if (i === 1) {
      await g.say('holmes', 'Ihre Stiefel sind bis zum Schaft durchnässt, der Mantel hat am Kragen schon getrocknet. Sie waren die ganze Nacht draußen und wurden heute früh nicht abgelöst.');
      await g.say('krause', 'Woher ... na und? Det is mein Revier. Von zehn bis sechse, und dann kam die Schulze anjerannt. Ick bin seitdem uff de Beene.');
      continue;
    }
    return;
  }
}

async function callWenzel(g) {
  const H = g.holmes;
  await g.say('krause', 'Zeuge? Na, det is wat anderes. Warten Se hier.');
  const K = g.who('krause');
  if (K) K.faceTo(7.3, 0.55);
  await g.say('krause', 'Herr Kommissar! Hier is eener, der sagt, er is Zeuge!');
  g.sfx('shopbell');
  await g.wait(0.8);
  const W = g.spawn('wenzel', 6.9, 0.55, -Math.PI / 2);
  await g.walk('wenzel', 6.05, 0.35);
  W.faceTo(H.x, H.z);
  H.faceTo(W.x, W.z);
  W.lookAt = H.headPos();
  H.lookAt = W.headPos();
  if (K) K.faceTo(H.x, H.z);
  g.focus([(H.x + W.x) / 2, 1.3, (H.z + W.z) / 2], 5);
  await g.say('wenzel', 'Wenzel, Kriminalkommissar, Polizeipräsidium Alexanderplatz. Zeuge wofür? Ich habe meinen Täter schon. Der Geselle sitzt drinnen in Handschellen.');
  await g.say('holmes', 'Sigerson. Ich wohne über dem Laden.');
  await g.say('wenzel', 'Norweger, was? Sie sprechen ein gutes Deutsch. Haben Sie etwas gesehen? Gehört?');
  await g.say('holmes', 'Gesehen habe ich in der Nacht nichts. Aber ich sehe einiges an Ihnen, Herr Kommissar.');
  await g.say('wenzel', 'An mir? Na, da bin ich gespannt.');
  const opts = [
    {
      id: 'rasur', ok: true, text: 'Man hat Sie heute in aller Frühe aus dem Bett geholt.',
      say: 'Ein frischer Rasierschnitt am Kinn, links, wo die Klinge in Eile abrutscht. Und der dritte Westenknopf sitzt im vierten Knopfloch. Man hat Sie vor halb sieben geweckt.',
      reply: 'Hm. Um sechs, wenn Sie es genau wissen wollen. Weiter.',
    },
    {
      id: 'narbe', ok: true, text: 'Sie haben 1870 bei der Kavallerie gefochten.',
      say: 'Die Narbe über Ihrer linken Schläfe stammt von einer Klinge, die von oben kam. Sie stehen breitbeinig wie ein Reiter, und an Ihrer Uhrkette hängt die Kriegsdenkmünze von 1870. Säbel gegen Säbel – Mars-la-Tour, wenn ich raten müsste. Ich rate aber nie.',
      reply: '... Sechzehnter August. Die Bredow’sche Brigade. Woher, zum Teufel –',
    },
    {
      id: 'kreide', ok: true, text: 'Sie haben heute schon an einer Tafel geschrieben.',
      say: 'Kreidestaub am rechten Ärmel und an der Daumenkuppe. Sie haben im Präsidium den Wachplan angeschrieben, ehe man Sie hierher rief.',
      reply: 'Den Wachplan. Donnerwetter.',
    },
    {
      id: 'stiefel', ok: false, text: 'Sie sind mit der Pferdebahn gekommen – das verraten Ihre Stiefel.',
      say: 'Ihre Stiefel verraten, dass – nein. Verzeihung. Ihre Stiefel verraten gar nichts. Es regnet seit gestern auf ganz Berlin.',
      reply: 'Ha! Also doch kein Hexenmeister.',
    },
  ];
  let right = 0;
  const used = new Set();
  while (right < 2) {
    const avail = opts.filter((o) => !used.has(o.id));
    const i = await g.choose(avail.map((o) => o.text), 'Was verrät mir Kommissar Wenzel?');
    const o = avail[i];
    used.add(o.id);
    await g.say('holmes', o.say);
    await g.say('wenzel', o.reply);
    if (o.ok) right++;
    else g.state.wrongDed++;
  }
  await g.say('wenzel', 'Na schön, Herr Sigerson. Augen im Kopf haben Sie, das muss man Ihnen lassen. Kommen Sie rein. Aber fassen Sie nichts an – und reden Sie mir nicht in meinen Fall.');
  await g.say('holmes', 'Ich werde Ihren Fall mit der größten Achtung behandeln, Herr Kommissar.');
  W.lookAt = null;
  H.lookAt = null;
  g.unfocus();
  await g.walk('wenzel', 6.9, 0.55);
  g.despawn('wenzel');
  g.sfx('shopbell');
  g.set('zutritt');
  await g.think('Ein tüchtiger Polizist. Nur zu schnell mit seinem Urteil. Das sind die gefährlichsten.');
}

const actions = {};
actions.s_normaluhr = async (g) => {
  await g.think(`Eine Normaluhr, von der Sternwarte elektrisch gestellt, auf die Sekunde genau. Sie zeigt ${clockLabel(g.state.minutes)}. In ganz Berlin gehen diese Uhren im Gleichschritt – anders als die Uhren in Nummer 38.`);
  if (g.has('mappe') || g.has('patentnotiz')) await g.think('Alle Uhren einer Stadt im Gleichschritt ... genau das sollte Tiedemanns Synchron-Hemmung leisten. Nur billiger, und für jede Pendeluhr.');
};
actions.s_litfass = async (g) => {
  await g.think('Eine Litfaßsäule. »Handwerkerverein, Sophienstraße 15 – Abendcurse: Mechanik, Elektricität, Zeichnen. Montags und Donnerstags 8 bis 10 Uhr.«');
  await g.think('Daneben: »Bekanntmachung! Wegen der Cholera in Hamburg: Wasser nur abgekocht genießen!« Und ein Vortrag in der Sternwarte: »Die Einheitszeit für das Deutsche Reich«.');
  if (g.addClue('einheitszeit')) await g.think('Kommt die Einheitszeit, muss jede Bahnhofsuhr, jede Amtsuhr, jede Turmuhr im Reich gleich gehen. Wer dafür das richtige Patent hält, wird reich.');
};
actions.s_fenster_t = async (g) => {
  await g.think('Tiedemanns Schaufenster. Taschenuhren auf grünem Samt, eine Pendule, ein kleiner Regulator – alle auf Viertel nach elf. Darüber in Gold: »C. F. Tiedemann · Uhrmachermeister · gegr. 1858«.');
};
actions.s_fenster_v = async (g) => {
  await g.think('»H. Voss · Uhren & Goldwaaren«. Goldene Taschenuhren, eine Kaminuhr aus Marmor, und ganz neu: eine Gasglühlichtlampe nach Auer, die heller strahlt als jede Laterne.');
  await g.think('Ein prächtiger Laden für eine Seitenstraße. Teuer, das alles. Sehr teuer.');
};
actions.s_mein_fenster = async (g) => {
  await g.think('Mein Fenster, erster Stock. Von dort oben hörte ich jede Nacht das Ticken. Nur nicht in der vergangenen.');
};
actions.s_pferdebahn = async (g) => {
  await g.think('Die Pferdebahn nach dem Rosenthaler Platz. Zwei Pferde, ein Kutscher, eine Glocke – und ein Fahrplan, der so verlässlich ist wie das Berliner Wetter.');
};
actions.s_droschke = async (g) => {
  if (g.state.flags.lotte) {
    await g.think('Lotte döst. Sie hat mir verziehen, dass ich keine Schrippe bei mir habe. Beinahe.');
    return;
  }
  g.state.flags.lotte = 1;
  await g.think('Eine Droschke zweiter Klasse, das Verdeck hochgeklappt gegen den Regen. Die Stute döst unter ihrer Decke und schielt dabei nach meiner Manteltasche.');
  await g.think('Am Kumt ein Messingschild: »Lotte«. Der Kutscher ist nicht weit – vermutlich wärmt er sich drüben in der Destille mit einem Morgenkorn.');
};

// ============================================================ Werkstatt
actions.w_uhrenwand = async (g) => {
  g.gesture('holmes', 'lens', 2.2);
  if (!g.has('uhren2315')) {
    await g.think('Regulatoren, Wanduhren, Stutzuhren, eine Standuhr. Ich zähle sie: siebenunddreißig. Und jede einzelne zeigt Viertel nach elf.');
    g.addClue('uhren2315');
    await g.wait(0.3);
    await g.think('Sehen wir genauer hin. Die Pendel hängen nicht einfach still – zwischen Pendelstange und Rückwand klemmt jeweils ein gefalteter Streifen Seidenpapier.');
    await g.think('So sichert ein Uhrmacher eine Uhr, ehe er sie auf den Wagen lädt. Kein Kratzer, keine verbogene Aufhängefeder. Der das tat, verstand sein Handwerk.');
    g.addClue('pendel');
    if (!g.has('gewichtsuhr')) await g.think('Nur die bunte Schwarzwälder Uhr dort links scheint anders. Ihr Pendel hängt schief.');
    return;
  }
  await g.think('Siebenunddreißig Uhren auf 23:15, die Pendel sorgsam mit Seidenpapier gesichert. Eine Inszenierung – aber eine liebevolle.');
};
actions.w_schwarzwald = async (g) => {
  g.gesture('holmes', 'lens', 2.2);
  if (!g.has('gewichtsuhr')) {
    await g.think('Eine Schwarzwälder Schilduhr mit Gewichten an Ketten – ein Dreißigstundenwerk, das jeden Tag aufgezogen werden muss.');
    await g.think('Sie ist die einzige ohne Papier im Pendel. Das Pendel hängt schief, aus der Bahn gerissen – als hätte eine Hand im Fallen danach gegriffen. Die Hand des Meisters liegt keinen Meter darunter.');
    await g.think('Neben der Kette hat Tiedemann eine Skala an die Wand gemalt, in Zentimetern, von der Marke »aufgezogen« abwärts. Das Gehgewicht hängt bei 68. Und auf einem Kärtchen: »Gang: 5 cm je Stunde«.');
    await g.think('Ein Pedant, der Meister. Gott segne alle Pedanten.');
    g.addClue('gewichtsuhr');
  }
  if (g.has('wahrezeit')) { await g.think('Stehengeblieben um 20:36 Uhr. Die einzige ehrliche Uhr im Haus.'); return; }
  if (!g.has('aufzug7')) {
    await g.think('Wann wurde sie zuletzt aufgezogen? Ohne das hilft mir die schönste Skala nichts. Gustav oder Fräulein Tiedemann werden es wissen.');
    return;
  }
  const i = await g.choose(['Berechnen, wann die Uhr stehen blieb.', 'Später.']);
  if (i !== 0) return;
  const r = await g.minigame('gewicht');
  if (r && r.ok) {
    if (r.helped) g.state.hints++;
    g.addClue('wahrezeit');
    await g.think('20:36 Uhr. Nicht 23:15. Wer auch immer die Zeiger dieser Uhr auf Viertel nach elf drehte – das Gewicht konnte er nicht belügen.');
  }
};
actions.w_leiche = async (g) => {
  g.gesture('holmes', 'lens', 2.4);
  if (!g.has('leiche')) {
    await g.think('Carl Friedrich Tiedemann, dreiundsechzig. Ein einziger, wuchtiger Schlag auf den Hinterkopf, von schräg oben. Er hat den Angreifer nicht kommen sehen – oder ihm nicht misstraut.');
    await g.think('Die Totenstarre ist vollständig ausgebildet. Das passt zu 23 Uhr ebenso gut wie zu 20 Uhr. Kein Beweis, so oder so.');
    await g.think('Seine rechte Hand ist ausgestreckt, zur Schwarzwälder Uhr hinauf. Die Fingerspitzen sind schwarz von Öl.');
    g.addClue('leiche');
    return;
  }
  await g.think('Der Meister liegt, wo er fiel. Die Hand zur Uhr erhoben, als wollte er mir noch etwas zeigen.');
};
actions.w_chronos = async (g) => {
  if (!g.has('chronos')) {
    await g.think('Eine Bronzeuhr: Chronos, der Gott der Zeit, mit Sense und Stundenglas. Gut acht Kilo schwer. Am Sockel Blut und einige graue Haare.');
    await g.think('Auf der Werkbank ein sauberer Abdruck im Staub, wo sie sonst stand. Griffbereit für jeden, der vor der Werkbank saß.');
    g.addClue('chronos');
    return;
  }
  await g.think('Die Zeit hat den Uhrmacher erschlagen. Ein Dichter fände das sinnig. Ich finde es nur scheußlich.');
};
actions.w_stuhl = async (g) => {
  g.gesture('holmes', 'lens', 2.2);
  if (!g.has('asche')) {
    await g.think('Der Besucherstuhl vor der Werkbank. Auf den Dielen daneben: Asche. Fein, hellgrau, flockig, mit weißem Rand.');
    await g.think('Ich habe über einhundertvierzig Sorten Tabakasche eine Monographie verfasst. Dies ist eine Zigarre mit Sumatra-Deckblatt. Kein billiges Kraut.');
    g.addClue('asche');
  }
  if (!g.has('bauchbinde')) {
    await g.think('Und hier, unter dem Stuhl, halb unter das Bein geschoben: eine rot-goldene Bauchbinde. »Sumatra Imperial«.');
    g.addClue('bauchbinde');
    await g.think('In einer Werkstatt, in der ein Schild das Rauchen verbietet. Der Meister duldete hier also einen Gast, dem er nicht widersprechen mochte.');
    return;
  }
  await g.think('Hier saß gestern Abend jemand und rauchte Sumatra Imperial, während der Meister ihm gegenüber an der Werkbank saß.');
};
actions.w_schild = async (g) => {
  await g.think('»Das Rauchen in der Werkstatt ist streng verboten! Rauch verdirbt die Öle. – C. F. T.«');
  if (g.has('asche')) await g.think('Und doch rauchte gestern hier jemand. Mit Erlaubnis – oder ohne, dass der Meister es noch verhindern konnte.');
};
actions.w_ofen = async (g) => {
  if (!g.has('ofen')) {
    await g.think('Der Kachelofen ist kalt. Die Glut ist seit vielen Stunden erloschen, der Kohlenkasten daneben leer bis auf Staub.');
    await g.think('Ein Mann, der nachts an seiner Erfindung arbeitet, lässt seinen Ofen nicht ausgehen. Es sei denn, er kann nicht mehr nachlegen.');
    g.addClue('ofen');
    return;
  }
  await g.think('Kalt. Gestern Abend hat hier niemand mehr Kohlen nachgelegt.');
};
actions.w_stutzuhr = async (g) => {
  if (!g.has('uhren2315')) { await g.think('Eine schöne Stutzuhr aus Nussbaum. Sie steht still, wie alles hier. Ich sollte mir zuerst die Uhren insgesamt ansehen.'); return; }
  if (g.has('schlagwerk')) { await g.think('Die Stutzuhr schlägt, wie sie soll. Wer sie gestellt hat, wusste, was er tat.'); return; }
  await g.think('Eine Stutzuhr mit Schlagwerk. Wer die Zeiger einer schlagenden Uhr verdreht, ohne zu wissen wie, bringt das Schlagwerk durcheinander. Prüfen wir es.');
  const i = await g.choose(['Die Stutzuhr in Gang setzen und prüfen.', 'Später.']);
  if (i !== 0) return;
  const ok = await g.minigame('schlagwerk');
  if (ok) {
    g.addClue('schlagwerk');
    await g.think('Ich stelle die Stutzuhr wieder auf Viertel nach elf, wie ich sie fand. Wenzel soll mir nicht vorwerfen, ich hätte Beweise verändert.');
  }
};
actions.w_kasse = async (g) => {
  if (!g.has('kasse')) {
    await g.think('Die Ladenkasse, nicht verschlossen. Siebenundvierzig Mark und dreißig Pfennig. Und in der Vitrine fehlt keine einzige Uhr – ich sehe keine leere Stelle auf dem Samt.');
    g.addClue('kasse');
    await g.think('Kein Raubmord. Der Mörder wollte etwas anderes als Geld.');
    return;
  }
  await g.think('Die Kasse ist voll. Der Täter hat sie nicht angerührt.');
};
actions.w_pult = async (g) => {
  if (!g.has('auftragsbuch')) {
    await g.think('Das Auftragsbuch auf dem Stehpult. Jeder Kunde, jede Reparatur, jede Verabredung, in gestochener Schrift.');
    await g.think('Sonnabend, der 12. ... Montag, der 14. November – fehlt. Die Seite wurde herausgerissen, sauber, am Falz entlang.');
    g.addClue('auftragsbuch');
  }
  if (g.has('durchschrift')) { await g.think('»H. V. kommt.« Mehr brauchte der Meister nicht zu schreiben – er wusste, wen er erwartete.'); return; }
  await g.think('Doch der Meister schrieb mit festem Druck. Auf der nächsten Seite müsste sich seine Schrift durchgedrückt haben. Ein weicher Bleistift von der Werkbank ...');
  const i = await g.choose(['Mit dem Bleistift über die Seite reiben.', 'Später.']);
  if (i !== 0) return;
  const ok = await g.minigame('durchschrift');
  if (ok) {
    g.addClue('durchschrift');
    await g.think('»H. V. kommt« – gestern um acht Uhr abends. Und er sollte die Zeichnungen vom 3. Juli bereitlegen. Das Datum hat er unterstrichen. Warum war ihm das Datum so wichtig?');
  }
};
actions.w_schrank = async (g) => {
  if (!g.has('mappe')) {
    await g.think('Ein Schubladenschrank. Federn, Räder, Zeiger, sorgfältig beschriftet. In der untersten Lade eine Zeichenmappe aus grauem Leinen: »Synchron-Hemmung – C. F. T.«');
    await g.think('Sie ist leer. Vollkommen leer.');
    g.addClue('mappe');
    return;
  }
  await g.think('Die leere Mappe. Was immer der Besucher wollte – er hat es mitgenommen.');
};
actions.w_joppe = async (g) => {
  if (!g.has('kurskarte')) {
    await g.think('Gustavs Joppe am Haken, noch feucht vom Regen gestern Abend. In der Innentasche eine Karte.');
    await g.think('»Handwerkerverein, Sophienstraße 15. Teilnehmerkarte für Gustav Hennig, Abendcursus Mechanik, Montags 8 bis 10 Uhr.« Für den 14. November gestempelt und abgezeichnet: »anwesend bis Schluß. – Lehmann«.');
    g.addClue('kurskarte');
    return;
  }
  await g.think('Die Joppe des Gesellen. Seine Kurskarte habe ich.');
};
actions.w_werkbank = async (g) => {
  await g.think('Die Werkbank des Meisters. Feilen, Zangen, Uhrmacherlupen, ein halb zerlegtes Werk. Daneben eine Rolle Seidenpapier – angeschnitten.');
  if (g.has('pendel')) await g.think('Aus dieser Rolle stammen die Streifen an den Pendeln. Der Täter bediente sich ganz selbstverständlich hier. Er kannte sich aus.');
  await g.think('Die Petroleumlampe ist ausgebrannt, der Docht verkohlt, der Tank leer. Sie hat die ganze Nacht gebrannt.');
};
actions.w_meisterbrief = async (g) => {
  await g.think('Der Meisterbrief, gerahmt: »Carl Friedrich Tiedemann, Uhrmachermeister. Berlin, im Mai 1856.« Darunter eine Medaille der Gewerbeausstellung von 1879.');
};
actions.w_kalender = async (g) => {
  await g.think('Ein Abreißkalender, auf Dienstag, den 15. November gestellt. Jemand hat ihn heute früh noch abgerissen – vermutlich Fräulein Tiedemann, aus Gewohnheit.');
  await g.think('Die Monatsübersicht darunter: Der 14. ist mit einem kleinen Kreuz markiert. Eine Verabredung, die ihm wichtig war.');
};
actions.w_vitrine = async (g) => {
  await g.think('Die Ladenvitrine: Taschenuhren, Ketten, ein goldener Damenring. Nichts fehlt. Durch das Schaufenster sehe ich die Konkurrenz gegenüber: »H. Voss«.');
};

// ============================================================ Hof
actions.h_hausordnung = async (g) => {
  await g.think('»Haus-Ordnung. § 4: Die Hausthür wird um 10 Uhr Abends verschlossen. Wer später Einlaß begehrt, entrichtet der Portiersfrau das Sperrgeld.«');
  if (!g.has('sperrsechser')) await g.think('Der berühmte Berliner Sperrsechser. Und Frau Schulze wird jeden Sechser notiert haben.');
};
actions.h_kohlen = async (g) => {
  await g.think('Der Kohlenverschlag. An einem Haken ein Eimer, mit Ölfarbe beschriftet: »C. F. T.«. Er ist leer und sauber. Der Meister holte seine Kohlen offenbar selbst.');
  if (g.has('kohlen22')) await g.think('Jeden Abend um zehn. Nur gestern nicht.');
};
actions.h_plumpe = async (g) => {
  await g.think('Die Plumpe des Hofes, mit einem Zettel: »Wasser nur abgekocht trinken! – Die Polizei-Behörde.« Seit der Cholera in Hamburg ist ganz Berlin vorsichtig geworden.');
};
actions.h_teppich = async (g) => {
  await g.think('Eine Teppichstange. Am Sonnabend wird hier geklopft, dass man es bis zum Alexanderplatz hört.');
};
actions.h_muell = async (g) => {
  await g.think('Die Müllkästen. Asche, Kartoffelschalen, eine zerbrochene Selterflasche. Keine Zeichnungen – das wäre auch zu einfach gewesen.');
};
actions.h_hinterhaus = async (g) => {
  await g.think('Der Aufgang zum Hinterhaus. Gustav hat dort oben eine Schlafstelle bei der Witwe Lehmann. Von seinem Fenster aus sieht man genau auf die Werkstatt.');
};
actions.h_fenster = async (g) => {
  await g.think('Das vergitterte Werkstattfenster. Von hier sah Gustav gestern um zwanzig nach zehn noch Licht und dachte, der Meister arbeite an seiner Erfindung.');
  if (g.has('licht')) await g.think('Dasselbe Licht sah Krause um Viertel nach neun – mit einem Schatten. Um elf: Licht ohne Schatten.');
};
actions.h_baum = async (g) => {
  await g.think('Eine Kastanie, kahl und schwarz vom Ruß. In diesem Hof hat sie bessere Novembertage gesehen. Oder auch nicht.');
};

// ============================================================ Destille
actions.k_tafel = async (g) => {
  await g.think('Die Kreidetafel hinter dem Tresen: Schulden der Stammgäste, Bierpreise – und ganz oben, mit drei Ausrufezeichen: »14. Nov. – 23 ¼ Uhr – Runde Korn von H. Voss!!!«');
  if (!g.has('voss_2315')) {
    await g.say('mahnke', 'Det hab ick extra anjeschrieben! Der Voss hat in zwanzig Jahren keene Runde jeschmissen. Und jestern rief er quer durch die Stube: »Meine Herren, es ist Viertel nach elf – Korn für alle, auf meine Rechnung!«');
    g.addClue('voss_2315');
    await g.think('Viertel nach elf. Ausgerechnet. Und so laut, dass es die ganze Destille hören musste.');
  }
};
actions.k_uhr = async (g) => {
  await g.think('Mahnkes Regulator. Er geht drei Minuten vor.');
  await g.say('mahnke', 'Mit Absicht! Damit die Jäste rechtzeitig nach Hause finden. Klappt bloß nie.');
};
actions.k_stammtisch = async (g) => {
  await g.think('Der Stammtisch des Kegelclubs, mit einem gedrechselten Schild: »Gut Holz!«. Hier werden die Geschichten der Straße erzählt – und weitererzählt.');
  if (g.has('voss_brauch')) await g.think('Hier erzählte Gustav von seinem Brauch. Und Voss hörte zu.');
};
actions.k_zeitungen = async (g) => {
  await g.think('Der Zeitungshalter: das »Berliner Tageblatt«, der »Kladderadatsch« und die »Vossische Zeitung«. Kein Verwandter, nehme ich an.');
  await g.think('Im Tageblatt: »Kommt die Einheitszeit? Der Reichstag berät über eine gemeinsame Stunde für Bahn, Post und Telegraph.«');
  g.addClue('einheitszeit');
};
actions.k_kegelbahn = async (g) => {
  await g.think('Die Tür zur Kegelbahn. Um diese Zeit ist es still dahinter. Abends rollen die Kugeln, dass die Gläser im Schrank klirren.');
};
actions.k_ofen = async (g) => {
  await g.think('Ein Kanonenofen, glühend rot. Mahnke heizt, als gelte es, den Winter persönlich aus Berlin zu vertreiben.');
};
actions.k_flaschen = async (g) => {
  await g.think('Korn, Kümmel, Allasch, Magenbitter, Danziger Goldwasser. Die Destille hält, was ihr Name verspricht.');
};

// ============================================================ Voss
actions.v_patent = async (g) => {
  if (!g.has('patentnotiz')) {
    await g.think('Gerahmt, unter Glas, an bester Stelle: ein Ausschnitt aus dem Patentblatt No. 46 vom 10. November.');
    await g.think('»Anmeldung V 2117. H. Voss in Berlin: Synchron-Hemmung für Pendeluhren. Angemeldet am 11. October 1892.«');
    g.addClue('patentnotiz');
    if (g.has('mappe')) await g.think('Synchron-Hemmung. So stand es auf Tiedemanns leerer Mappe.');
    if (g.has('durchschrift')) await g.think('Und »Patentblatt No. 46« hatte sich der Meister notiert – für sein Treffen mit H. V.');
    return;
  }
  await g.think('Voss’ ganzer Stolz. Ein Patent auf eine Erfindung, die nicht die seine ist.');
};
actions.v_zigarren = async (g) => {
  if (!g.has('voss_raucht')) {
    await g.think('Auf dem Ladentisch ein Kistchen Zigarren, für gute Kunden. Rot und Gold: »Sumatra Imperial«.');
    if (g.has('bauchbinde')) await g.think('Dieselbe Bauchbinde wie unter dem Besucherstuhl in der Werkstatt.');
    g.addClue('voss_raucht');
    return;
  }
  await g.think('Sumatra Imperial. Für Voss nur das Beste – auf Kredit.');
};
actions.v_vitrine = async (g) => {
  if (!g.has('voss_schulden')) {
    await g.think('Goldene Herrenuhren, Ketten, Siegelringe. Und halb unter ein Uhrenkissen geschoben, als hätte man es eilig versteckt: ein Brief.');
    await g.think('»Bankhaus Leßmann. Zweite Mahnung. Wir sehen uns genöthigt, die Summe von 3 800 Mark zum 1. December fällig zu stellen.«');
    g.addClue('voss_schulden');
    await g.think('Glanz in der Vitrine, Schulden darunter. Für Voss war ein Patent kein Ehrgeiz, sondern Rettung.');
    return;
  }
  await g.think('Die Mahnung liegt noch unter dem Kissen. Voss sieht sie jeden Morgen.');
};
actions.v_schirme = async (g) => {
  if (!g.has('schirm')) {
    await g.think('Ein Schirmständer aus Messing. Zwei billige Baumwollschirme – und ein schwarzer Seidenschirm mit Elfenbeingriff, noch nicht ganz trocken.');
    await g.think('Im Elfenbein eingraviert: »C. F. T.«');
    g.addClue('schirm');
    await g.think('Der Schirm des Meisters. Wer ihn gestern Abend aus der Werkstatt mitnahm, ging im Regen durch die Ladentür – und nicht über den Hof.');
    return;
  }
  await g.think('Tiedemanns Schirm, in Voss’ Ständer. Das wird er erklären müssen.');
};
actions.v_vorhang = async (g) => {
  if (g.flag('voss_distracted')) { await g.think('Der Vorhang ist offen. Schnell, zum Ofen!'); return; }
  if (g.who('voss')) await g.say('voss', 'Halt! Bitte, Herr Sigerson – dort hinten ist privat. Meine Werkstatt, Sie verstehen.');
  await g.think('Unter dem Vorhang weht warme Luft hervor. Ein Ofen, der am Vormittag in einem Hinterzimmer brennt – und ein Geruch nach verbranntem Papier.');
  g.set('voss_ofen');
  if (g.flag('paule')) await g.think('An Voss komme ich nicht vorbei. Aber vielleicht weiß Paule einen Weg, ihn für ein paar Minuten aus dem Laden zu locken.');
};
actions.v_ofen = async (g) => {
  if (g.has('brandreste')) { await g.think('Asche und Glut. Den Rest habe ich.'); return; }
  g.gesture('holmes', 'lens', 2.4);
  await g.think('Ein kleiner Kanonenofen, noch warm. In der Asche: halb verkohlte Bogen festen Zeichenpapiers. Er hat in Eile verbrannt und schlecht geschürt.');
  await g.think('Ein Rest ist nur angesengt. Feine Tuschelinien, ein Zahnrad, eine Hemmung – und am Rand, in der Handschrift des Meisters: »…ron-Hemmung … Berlin, d. 3. Juli 1892 … C. F. T.«');
  g.addClue('brandreste');
  g.sfx('shopbell');
  await g.wait(0.4);
  const V = g.spawn('voss', -3.8, 0.9, Math.PI / 2, 'stand');
  await g.say('voss', 'So ein Lümmel! Nichts war da, gar nichts! Wenn ich den erwische –');
  await g.walk('voss', 3.75, -2.3);
  V.faceTo(g.holmes.x, g.holmes.z);
  V.lookAt = g.holmes.headPos();
  await g.say('voss', 'Herr Sigerson?! Was haben Sie in meinem Hinterzimmer zu suchen?');
  await g.say('holmes', 'Einen Aschenbecher, Herr Voss. Für eine ausgezeichnete Sumatra Imperial.');
  await g.say('voss', 'Hinaus! Hinaus aus meinem Laden, oder ich rufe die Polizei!');
  await g.say('holmes', 'Das, Herr Voss, wird nicht nötig sein. Die Polizei kommt ganz von selbst.');
  g.set('voss_distracted', false);
  g.set('paule_weg', false);
  V.lookAt = null;
  await g.gotoScene('strasse', 'voss');
  const P = g.spawn('paule', -5.6, 1.4, Math.PI / 2);
  P.faceTo(g.holmes.x, g.holmes.z);
  await g.say('paule', 'Na? Hat et jeklappt? Ick hab ihm erzählt, eener kratzt mit’m Diamanten an seiner Scheibe. Der is jerannt wie ’n Wiesel!');
  await g.say('holmes', 'Es hat geklappt, Paule. Du hast dir deine zwei Schrippen redlich verdient.');
  if (g.C.canAccuse(g)) await g.think('Jetzt habe ich alles beisammen. Zeit, mit Kommissar Wenzel zu sprechen.');
};
actions.v_uhren = async (g) => {
  await g.think('Eine Standuhr, Regulatoren, Stutzuhren – alle gehen, alle ticken. Voss hält seine Uhren gut in Schuss. Das muss man ihm lassen: Er ist ein Uhrmacher.');
};
actions.v_lampe = async (g) => {
  await g.think('Eine Gasglühlichtlampe nach Doktor Auer, das neueste Licht der Welt. Und das teuerste. Voss lebt über seine Verhältnisse.');
};

export { actions };

// ============================================================ Gespräche
const talk = {};

talk.krause = async (g) => {
  if (!g.flag('zutritt')) { await krauseGate(g); return; }
  await g.topics('krause', {
    greet: async (g, first) => { await g.say('krause', first ? 'Na, Herr Zeuge? Der Herr Kommissar hat Sie rinjelassen, also red ick ooch mit Ihnen.' : 'Ja bitte?'); },
    items: [
      {
        id: 'kr_runde', text: 'Sie gingen gestern Abend hier Streife?',
        run: async (g) => {
          await g.say('krause', 'Jede Stunde eenmal die Rosenthaler rauf und runter, von zehne bis sechse. Und vorher schon die Abendrunde ab neune.');
          await g.say('krause', 'Um Viertel nach neune brannte Licht in der Werkstatt, und ick hab ’nen Schatten jesehn, der hin und her jing. Dacht ick: Der Meister bastelt wieder.');
          await g.say('krause', 'Um elfe brannte immer noch Licht. Aber da hat sich nischt mehr jerührt. Und beim Voss jejenüber war’s den janzen Abend duster.');
          g.addClue('licht');
        },
      },
      {
        id: 'kr_voss', text: 'Haben Sie gestern Abend Herrn Voss gesehen?', when: (g) => g.hasAny('durchschrift', 'bauchbinde', 'schirm', 'voss_raucht', 'voss_alibi'),
        run: async (g) => {
          await g.say('krause', 'Den Voss? Na sicher. Kurz vor zehne kam er hier aus der Ladentür von Nummer 38, mit ’nem mächtigen Schirm, und is rüber in die Destille.');
          await g.say('holmes', 'Aus *diesem* Laden? Und das erwähnen Sie erst jetzt?');
          await g.say('krause', 'Na, wer denkt denn da wat? Die beeden Uhrmacher kennen sich doch. Und der Mord war doch erst um Viertel nach elfe – sagt der Herr Kommissar.');
          g.addClue('krause_voss');
          await g.think('Da ist sie, die Macht der falschen Stunde: Sie macht jeden Zeugen blind für alles, was vorher geschah.');
        },
      },
      {
        id: 'kr_heute', text: 'Wer kam heute früh als Erster?',
        run: async (g) => {
          await g.say('krause', 'Um zehn nach sieben kam die Schulze anjerannt: »Krause! Krause! Der Meister!« Drinnen saß der Jeselle neben der Leiche und hat jeheult wie ’n Schlosshund. Det Fräulein ooch.');
          await g.say('krause', 'Ick hab sofort nach dem Präsidium jeschickt. Um dreiviertel achte war der Herr Kommissar da.');
        },
      },
    ],
    bye: 'Weitermachen, Schutzmann.',
  });
};

talk.paule = async (g) => {
  const inVoss = g.scene.id === 'voss';
  await g.topics('paule', {
    greet: async (g) => { await g.say('paule', inVoss ? '(flüstert) Der Voss kiekt schon so komisch.' : 'Na, Herr Sigerson? Wat jibt’s?'); },
    items: [
      {
        id: 'p_ablenken', text: 'Paule, ich brauche Herrn Voss für ein paar Minuten aus dem Laden.',
        when: (g) => inVoss && g.flag('voss_ofen') && !g.has('brandreste') && !g.flag('voss_distracted'),
        run: async (g) => { await distraction(g); return 'end'; },
      },
      { id: 'p_tipp', text: 'Hast du einen Rat für mich, Paule?', run: async (g) => { await giveHint(g); } },
      {
        id: 'p_klatsch', text: 'Was erzählt man sich in der Straße?',
        run: async (g) => {
          const lines = [
            'Der Voss von jejenüber hat Schulden bis über beede Ohren, sagt die Bäckersfrau. Aber ’ne neue Gaslampe, die so hell is wie die Sonne!',
            'Der Hauswirt Prause will den Laden vom Meister an ’nen Bankier vermieten. Dreimal so viel Miete, sagt man.',
            'Der Gustav und det Fräulein Clara, die jehn schon seit’m Sommer mitnander. Det weeß die janze Straße – bloß der Meister tat so, als wüsst er nischt.',
            'Bei Mahnke in der Destille jibt’s den besten Korn nördlich vom Alexanderplatz. Sagt mein Vater. Meine Mutter sagt wat anderes.',
            'Der Kutscher Ede hat ’n Pferd, det Lotte heißt und lieber Schrippen frisst als Hafer. Ick hab’s selbst jesehn!',
          ];
          const n = g.state.flags.klatsch || 0;
          g.state.flags.klatsch = n + 1;
          await g.say('paule', lines[n % lines.length]);
        },
      },
    ],
    bye: 'Bleib in der Nähe, Paule.',
  });
};

function hintFor(g) {
  if (!g.flag('zutritt')) return 'Der Schutzmann lässt keenen durch. Reden Se doch mal mit dem – vielleicht holt er ja den Kommissar raus.';
  if (!g.visited('werkstatt')) return 'Nu jehn Se schon rin in die Werkstatt! Die Tür, wo der Schutzmann steht.';
  if (g.C.canAccuse(g)) return 'Na also! Jetzt jehn Se zum Kommissar in die Werkstatt und sagen ihm, wer’s war!';
  if (g.C.deductions.some((d) => !g.solved(d.id) && g.dedAvailable(d))) return 'Se ham doch schon ’ne Menge beisammen! Kieken Se mal ins Notizbuch, unter »Kombinieren«. Da könn’ Se jetzt wat schlussfolgern.';
  if (!g.has('uhren2315')) return 'Ham Se sich die Uhren an der Wand mal anjekiekt? Die stehn alle still. Unheimlich, wa?';
  if (!g.has('leiche')) return 'Den armen Meister sollten Se sich mal ankieken. Ooch wenn’s keen schöner Anblick is.';
  if (!g.has('gewichtsuhr')) return 'Die bunte Schwarzwälder Uhr an der Wand – die is irjendwie anders als die andern. Kiek ma jenau hin!';
  if (!g.has('aufzug7')) return 'Wann wird die Schwarzwälder denn uffjezogen? Fragen Se doch den Jesellen oder det Fräulein.';
  if (!g.has('wahrezeit')) return 'Rechnen Se doch mal aus, wie lange die Schwarzwälder nach’m Uffziehn noch jelaufen is. Det Jewicht, die Skala – Se wissen schon.';
  if (!g.has('kohlen22')) return 'Die Portiersfrau Schulze weeß allet, wat im Haus passiert. Die steht hinten im Hof. Fragen Se se mal, ob ihr jestern wat komisch vorkam.';
  if (!g.has('pendel')) return 'Kieken Se sich die Pendel von den Uhren mal von nahem an!';
  if (!g.has('schlagwerk')) return 'Die kleene Uhr uff’m Ladentisch – vielleicht schlägt die ja noch, wenn man se anstellt?';
  if (!g.has('kurskarte')) return 'Der Jeselle sagt, er war im Kurs. Hat er da nich ’ne Karte oder so wat? Vielleicht in seiner Joppe?';
  if (!g.has('sperrsechser')) return 'Wer nach zehne nach Hause kommt, muss bei der Schulze den Sperrsechser blechen. Und die schreibt det allet uff!';
  if (!g.has('auftragsbuch')) return 'Der Meister hat doch allet uffjeschrieben. Wo is’n sein Buch? Uff’m Stehpult vielleicht?';
  if (!g.has('durchschrift')) return 'Wenn eener ’ne Seite rausreißt – uff der nächsten sieht man manchmal noch wat. Mit’m Bleistift drüberrubbeln, det hab ick in der Schule jelernt. Also, nich im Unterricht.';
  if (!g.has('asche') || !g.has('bauchbinde')) return 'Riecht et in der Werkstatt nich nach Zigarre? Bei dem Stuhl da? Dabei is Rauchen da doch verboten!';
  if (!g.has('brauch')) return 'Der Kommissar redet immer von so ’nem schlesischen Brauch. Fragen Se doch den Gustav selber.';
  if (!g.visited('voss')) return '»H. V.« – det könnte doch der Voss von jejenüber sein! Hermann Voss. Kieken Se doch mal in seinen Laden.';
  if (!g.has('voss_raucht')) return 'Der Voss qualmt immer so dicke Zigarren. Uff seinem Ladentisch steht ’ne janze Kiste.';
  if (!g.has('voss_2315')) return 'Fragen Se den Voss doch mal, wo er jestern Abend war. Oder Mahnke in der Destille, der kriegt allet mit.';
  if (!g.has('mappe')) return 'Der Meister hatte doch ’ne Erfindung. Wo hat er’n die uffjehoben? Im Schubladenschrank vielleicht?';
  if (!g.has('juli')) return 'Wer wusste denn alles von der Erfindung? Det Fräulein Clara weeß det bestimmt.';
  if (!g.has('patentnotiz')) return 'Beim Voss hängt so ’n jerahmtet Papier an der Wand. Mächtig stolz is der druff.';
  if (!g.flag('voss_ofen')) return 'Fragen Se den Voss doch mal nach den Zeichnungen vom Juli. Oder kieken Se hinter seinen Vorhang. Mal sehn, wie er da kiekt!';
  if (!g.has('brandreste')) return g.scene.id === 'voss' ? 'Soll ick den Voss mal ’n Momentchen ablenken? Sprechen Se mich an, ick hab da ’ne Idee!' : 'Beim Voss im Hinterzimmer qualmt der Ofen – am helllichten Vormittag! Jehn Se nochmal rüber. Ick lenk ihn ab, wenn Se wollen.';
  return 'Ick weeß ooch nich weiter. Kieken Se mal ins Notizbuch – da steht drin, wat noch fehlt.';
}

async function giveHint(g) {
  g.state.hints++;
  await g.say('paule', hintFor(g));
}

export async function hint(g) {
  if (!g.flag('paule')) { await g.think('Ich sollte mich zunächst vor dem Haus umsehen.'); return; }
  if (g.flag('finale') && !g.flag('geloest')) { await g.think('Jetzt zählt nur noch, was ich beweisen kann.'); return; }
  if (!g.who('paule')) { await g.think('Paule wartet draußen. Was würde er mir raten?'); }
  await giveHint(g);
}

async function distraction(g) {
  await g.say('holmes', 'Paule. Ich brauche Herrn Voss für ein paar Minuten außerhalb seines Ladens.');
  await g.say('paule', '(flüstert) Zwee Minuten? Det kost’ Se ’ne Schrippe. Mit Wurscht!');
  await g.say('holmes', 'Zwei Schrippen.');
  await g.say('paule', '(flüstert) Jemacht. Passen Se uff.');
  const P = g.who('paule');
  if (P) P.follow = false;
  g.set('paule_weg');
  await g.walk('paule', -3.9, 0.9);
  g.sfx('shopbell');
  g.despawn('paule');
  await g.wait(1.2);
  await g.narrate('Von draußen, durch die Scheibe: »Herr Voss! Herr Voss! Da kratzt eener an Ihrem Schaufenster rum! Mit’m Diamanten!«');
  const V = g.who('voss');
  await g.say('voss', 'Was?! Mein Fenster! Mein schönes Fenster!');
  if (V) {
    g.despawn('voss');
    g.spawn('voss', V.x, V.z, V.yaw, 'stand');
    await g.walk('voss', -3.9, 0.9);
    g.sfx('shopbell');
    g.despawn('voss');
  }
  g.set('voss_distracted');
  g.refreshCast();
  await g.think('Zwei Minuten, vielleicht drei. Der Vorhang.');
}

talk.wenzel = async (g) => {
  await g.topics('wenzel', {
    greet: async (g) => {
      if (g.C.canAccuse(g)) await g.say('wenzel', 'Sie sehen aus wie einer, der etwas weiß, Herr Sigerson.');
      else if (g.solved('alibi')) await g.say('wenzel', 'Sie schon wieder. Haben Sie noch mehr, das mir den Tag verdirbt?');
      else await g.say('wenzel', 'Nun, Herr Sigerson? Schon den Täter gefunden? Ich habe ihn nämlich schon.');
    },
    items: [
      {
        id: 'wz_anklage', text: 'Herr Kommissar, ich weiß, wer Meister Tiedemann getötet hat.', when: (g) => g.C.canAccuse(g),
        run: async (g) => { const r = await accuse(g); return r ? 'end' : undefined; },
      },
      {
        id: 'wz_theorie', text: 'Erklären Sie mir Ihre Theorie noch einmal.',
        run: async (g) => {
          await g.say('wenzel', 'Gern. Alle Uhren zeigen 23:15 – da starb der Meister. Der Geselle ist Schlesier, und in Schlesien hält man bei einem Todesfall die Uhren an. Er kam um 22:20 heim, danach hat er kein Alibi.');
          await g.say('wenzel', 'Gestern Nachmittag hat er mit dem Meister gestritten, um die Tochter. Er hat ihn erschlagen und dann – aus Reue oder Aberglauben – die Uhren angehalten. Ganz einfach.');
          await g.think('Ganz einfach. Das ist es nie.');
        },
      },
      {
        id: 'wz_arzt', text: 'Was sagt der Polizeiarzt zur Todeszeit?',
        run: async (g) => {
          await g.say('wenzel', 'Doktor Lindner war um acht hier. Tot seit acht bis zwölf Stunden, sagt er. Passt also wunderbar zu 23:15.');
          await g.say('holmes', 'Es passt ebenso wunderbar zu halb neun am Abend.');
          await g.say('wenzel', 'Hm. Mag sein. Aber die Uhren lügen nicht, Herr Sigerson.');
          await g.say('holmes', 'Uhren nicht. Aber Menschen, die Uhren stellen.');
        },
      },
      {
        id: 'wz_zeit', text: 'Der Meister starb gegen halb neun, nicht um 23:15.', when: (g) => g.solved('todeszeit'),
        run: async (g) => {
          await g.say('holmes', 'Die Schwarzwälder Uhr blieb um 20:36 Uhr stehen, als der Meister im Fallen nach dem Pendel griff. Ihr Gewicht verrät es. Und um zehn holte er nicht wie sonst seine Kohlen.');
          await g.say('wenzel', 'Wegen einer Kuckucksuhr? ... Na schön. Nehmen wir an, Sie haben recht. Dann hat der Bursche die Uhren eben später gestellt, um uns zu täuschen.');
          await g.say('holmes', 'Dann fragen Sie sich, wo der Bursche um halb neun war.');
        },
      },
      {
        id: 'wz_fachmann', text: 'Wer die Uhren angehalten hat, war ein Uhrmacher.', when: (g) => g.solved('fachmann'),
        run: async (g) => {
          await g.say('wenzel', 'Eben! Ein Uhrmacher! Und wen haben wir hier sitzen? Einen Uhrmacher.');
          await g.say('holmes', 'In dieser Straße gibt es zwei Uhrmacherläden, Herr Kommissar.');
        },
      },
      {
        id: 'wz_alibi', text: 'Gustav Hennig war zur wahren Tatzeit im Abendkurs.', when: (g) => g.solved('alibi'),
        run: async (g) => {
          await g.say('holmes', 'Von acht bis zehn im Handwerkerverein in der Sophienstraße, vom Lehrer bestätigt. Um 22:20 Uhr zahlte er Frau Schulze den Sperrsechser. Um halb neun war er nicht hier.');
          await g.say('wenzel', 'Hm. Hm! Wenn das stimmt ... dann fehlt mir der Mörder.');
          await g.say('wenzel', 'Aber bis Sie mir einen besseren bringen, bleibt der Bursche in Eisen.');
        },
      },
      {
        id: 'wz_besucher', text: 'Gestern Abend um acht war Hermann Voss beim Meister.', when: (g) => g.solved('besucher'),
        run: async (g) => {
          await g.say('wenzel', 'Der Voss? Der Uhrmacher von gegenüber? Ein angesehener Mann, sitzt im Bezirksverein. Er hat mir heute früh selbst sein Beileid ausgesprochen.');
          await g.say('holmes', 'Das glaube ich gern.');
        },
      },
    ],
    bye: 'Ich sehe mich weiter um.',
  });
};

async function accuse(g) {
  const S = g.C.suspects;
  const i = await g.choose([...S.map((s) => s.name), 'Ich muss noch einmal nachdenken.'], 'Wer hat Meister Tiedemann getötet?');
  if (i >= S.length) return false;
  const s = S[i];
  if (s.id !== 'voss') {
    g.state.wrongAccuse++;
    g.sfx('fail');
    await g.say('holmes', `Es war ... ${s.name.split(',')[0]}.`);
    await g.say('wenzel', 'So? Begründen Sie das.');
    await g.think(s.wrong);
    await g.say('holmes', 'Verzeihen Sie, Herr Kommissar. Ich habe mich übereilt. Ein Fehler, den ich sonst anderen vorwerfe.');
    await g.say('wenzel', 'Na, wenigstens geben Sie es zu. Das ist mehr, als ich von den meisten Gelehrten erwarte.');
    return false;
  }
  await g.say('holmes', 'Hermann Voss. Der Uhrmacher von gegenüber.');
  await g.say('wenzel', 'Voss? ... Sie sind entweder ein Genie oder ein Narr, Herr Sigerson. Ich gebe Ihnen eine Viertelstunde, um mir zu zeigen, welches von beiden.');
  await g.say('wenzel', 'Krause! Holen Sie Herrn Voss herüber. Und die Portiersfrau gleich mit.');
  g.set('finale');
  await finale(g);
  return true;
}

talk.gustav = async (g) => {
  await g.topics('gustav', {
    greet: async (g, first) => {
      if (g.flag('gustav_frei')) { await g.say('gustav', 'Herr Sigerson! Ich stehe tief in Ihrer Schuld.'); return; }
      await g.say('gustav', first ? 'Sie ... Sie sind der Herr von oben, der Norweger. Glauben Sie mir, ich habe dem Meister nichts getan. Er war wie ein Vater zu mir.' : 'Herr Sigerson? Haben Sie etwas herausgefunden?');
    },
    items: [
      {
        id: 'g_morgen', text: 'Erzählen Sie mir von heute Morgen.',
        run: async (g) => {
          await g.say('gustav', 'Ich kam um sieben, wie jeden Morgen, um die Schwarzwälder aufzuziehen. Das war dem Meister heilig – Punkt sieben, nicht eine Minute später. Er schrieb es sogar in sein Buch.');
          await g.say('gustav', 'Es war so still. So furchtbar still. Und dann sah ich ihn liegen, dort unter der Uhr ... Ich habe geschrien. Fräulein Clara kam herunter, und Frau Schulze lief nach dem Schutzmann.');
          g.addClue('aufzug7');
        },
      },
      {
        id: 'g_abend', text: 'Wo waren Sie gestern Abend?',
        run: async (g) => {
          await g.say('gustav', 'Im Abendkurs, im Handwerkerverein in der Sophienstraße. Mechanik, jeden Montag von acht bis zehn. Ich will doch meinen Meister machen.');
          await g.say('gustav', 'Um zwanzig nach zehn war ich zurück und habe Frau Schulze den Sperrsechser bezahlt. Vom Hof aus sah ich Licht in der Werkstatt. Ich dachte, der Meister arbeitet an seiner Erfindung, und wollte nicht stören.');
          await g.say('gustav', 'Meine Kurskarte steckt in der Joppe, dort am Haken. Der Kommissar wollte sie nicht einmal sehen.');
        },
      },
      {
        id: 'g_brauch', text: 'Der Kommissar spricht von einem schlesischen Brauch.',
        run: async (g) => {
          await g.say('gustav', 'Bei uns in Hirschberg hält man im Sterbehaus die Uhren an, in dem Augenblick, in dem einer stirbt. Damit die Seele ihren Weg findet, sagt meine Großmutter.');
          await g.say('gustav', 'Aber ich habe sie nicht angehalten! Sie standen schon alle, als ich kam! Ich hätte doch nicht siebenunddreißig Uhren auf dieselbe falsche Zeit gestellt!');
          g.addClue('brauch');
          await g.say('gustav', 'Ich habe es einmal in der Destille erzählt, am Stammtisch. Da haben alle gelacht.');
        },
      },
      {
        id: 'g_streit', text: 'Sie haben gestern mit dem Meister gestritten.', when: (g) => g.has('streit') || g.flag('wenzel_theorie'),
        run: async (g) => {
          await g.say('gustav', 'Ja. Ich habe um Claras Hand angehalten. Er wurde laut: »Ein Geselle bekommt meine Tochter nicht!«');
          await g.say('gustav', 'Aber zum Schluss, an der Tür, sagte er: »Mach erst deinen Meister, Junge. Dann reden wir.« Das war doch beinahe ein Ja, Herr Sigerson! Warum hätte ich ihn ...');
        },
      },
      {
        id: 'g_uhren', text: 'Wer bringt es fertig, 37 Uhren so anzuhalten?', when: (g) => g.has('pendel'),
        run: async (g) => {
          await g.say('gustav', 'Mit Seidenpapier im Pendel, wie für den Transport? Das macht nur einer vom Fach. Ich könnte es, ja. Der Meister. Oder ... jeder gelernte Uhrmacher.');
          await g.say('gustav', 'Und eine Stunde braucht man dafür bestimmt. Für alle siebenunddreißig, und die Schlagwerke mitgeführt.');
        },
      },
      {
        id: 'g_voss', text: 'Was halten Sie von Herrn Voss?', when: (g) => g.hasAny('durchschrift', 'patentnotiz', 'voss_raucht', 'bauchbinde') || g.visited('voss'),
        run: async (g) => {
          await g.say('gustav', 'Der Meister nannte ihn einen Pfuscher mit goldenem Ladenschild. Im Sommer kam Voss dauernd herüber, wollte Werkzeug borgen, guckte dem Meister über die Schulter.');
          await g.say('gustav', 'Seit ein paar Wochen kam er nicht mehr. Und letzte Woche hat der Meister seinen Namen nicht mehr ausgesprochen.');
        },
      },
      {
        id: 'g_mappe', text: 'Die Mappe mit den Zeichnungen ist leer.', when: (g) => g.has('mappe'),
        run: async (g) => {
          await g.say('gustav', 'Die Synchron-Hemmung! Herrgott ... Jahre hat er daran gearbeitet. Damit richtet sich jede Pendeluhr von selbst nach einem Zeitsignal. Alle Uhren einer Stadt im Gleichschritt, ohne dass ein Uhrmacher sie anfasst.');
          await g.say('gustav', 'Er hütete die Zeichnungen wie seinen Augapfel. Er hätte sie nie aus der Hand gegeben.');
        },
      },
      {
        id: 'g_zeit', text: 'Die Schwarzwälder blieb um 20:36 Uhr stehen.', when: (g) => g.has('wahrezeit'),
        run: async (g) => {
          await g.say('gustav', 'Halb neun? Da saß ich doch im Kurs! Herr Lehmann, unser Lehrer, kann es bezeugen – und zwanzig andere!');
          await g.say('holmes', 'Ich weiß, Herr Hennig. Halten Sie durch.');
        },
      },
    ],
    bye: 'Halten Sie durch, Herr Hennig.',
  });
};

talk.clara = async (g) => {
  await g.topics('clara', {
    greet: async (g, first) => {
      if (g.flag('gustav_frei')) { await g.say('clara', 'Herr Sigerson ... ich weiß nicht, wie ich Ihnen danken soll.'); return; }
      await g.say('clara', first ? 'Herr Sigerson. Sie wohnen bei uns, und ich habe Sie kaum zehn Worte sprechen hören. Nun ist Vater tot, und Gustav ...' : 'Ja, Herr Sigerson?');
    },
    items: [
      {
        id: 'c_vater', text: 'Mein aufrichtiges Beileid, Fräulein Tiedemann.',
        run: async (g) => {
          await g.say('clara', 'Danke. Vater war ... ein schwieriger Mensch. Ein Pedant, sagen die Leute. Er hat jede Minute seines Lebens aufgeschrieben. Aber er hat mich geliebt, auf seine Art.');
          await g.say('clara', 'Jeden Abend um zehn holte er seinen Eimer Kohlen aus dem Keller, bei jedem Wetter. »Wer seine Gewohnheiten aufgibt, gibt sich selbst auf«, hat er gesagt.');
        },
      },
      {
        id: 'c_abend', text: 'Wo waren Sie gestern Abend?',
        run: async (g) => {
          await g.say('clara', 'Bei meiner Tante Hedwig in Moabit. Ich kam mit der Pferdebahn zurück, um elf. Frau Schulze hat mir aufgeschlossen.');
          await g.say('clara', 'Unter der Werkstatttür war Licht. Vater arbeitete oft bis in die Nacht an seiner Erfindung, dann durfte man ihn nicht stören. Ich bin hinaufgegangen.');
          await g.say('clara', 'Hätte ich doch nur die Tür geöffnet ...');
          await g.say('holmes', 'Es hätte nichts mehr geändert, Fräulein Tiedemann. Glauben Sie mir.');
        },
      },
      {
        id: 'c_gustav', text: 'Und Gustav Hennig?',
        run: async (g) => {
          await g.say('clara', 'Wir wollen heiraten. Vater war nicht dagegen – nicht wirklich. Er wollte nur, dass Gustav zuerst seinen Meister macht.');
          await g.say('clara', 'Gustav könnte keiner Fliege etwas zuleide tun. Wenn er eine Spinne im Laden findet, trägt er sie hinaus in den Hof.');
        },
      },
      {
        id: 'c_aufzug', text: 'Wer zieht die Schwarzwälder Uhr auf?', when: (g) => g.has('gewichtsuhr') && !g.has('aufzug7'),
        run: async (g) => {
          await g.say('clara', 'Gustav, jeden Morgen um sieben. Vater bestand darauf. Gestern früh auch, ich habe ihn gehört – die Kette rasselt so.');
          g.addClue('aufzug7');
        },
      },
      {
        id: 'c_erfindung', text: 'Ihr Vater arbeitete an einer Erfindung?',
        run: async (g) => {
          await g.say('clara', 'Die Synchron-Hemmung. Eine Hemmung, mit der jede Pendeluhr sich selbst nach einem Zeitsignal richtet. Wenn die Einheitszeit kommt, sagte Vater, braucht jede Stadt im Reich so etwas.');
          await g.say('clara', 'Er hatte vor, sie im Frühjahr anzumelden. Er wollte sie erst vollkommen machen. Er war nie mit etwas fertig.');
        },
      },
      {
        id: 'c_wer', text: 'Wer wusste außer Ihnen von der Erfindung?', when: (g) => g.seen('c_erfindung'),
        run: async (g) => {
          await g.say('clara', 'Gustav natürlich. Und ... Herr Voss. Im Juli hat Vater ihm die Zeichnungen gezeigt, hier an der Werkbank. Er war so stolz.');
          await g.say('clara', 'Voss hat gelächelt und gesagt: »Eine hübsche Spielerei, Kollege.« Danach kam er wochenlang fast jeden Tag herüber.');
          g.addClue('juli');
        },
      },
      {
        id: 'c_mappe', text: 'Die Mappe mit den Zeichnungen ist leer.', when: (g) => g.has('mappe'),
        run: async (g) => {
          await g.say('clara', 'Leer?! Aber ... Vater hätte sie nie aus dem Haus gegeben! Er hat auf jeden Bogen das Datum geschrieben, den 3. Juli. »Für alle Fälle«, hat er gesagt.');
        },
      },
      {
        id: 'c_patent', text: 'Herr Voss hat eine Synchron-Hemmung zum Patent angemeldet.', when: (g) => g.has('patentnotiz'),
        run: async (g) => {
          await g.say('clara', 'Was? Das ist Vaters Erfindung!');
          await g.say('clara', 'Letzte Woche ... da kam Vater mit dem Patentblatt nach Hause, ganz bleich. Er hat kein Wort gesagt, nur: »Das wird er mir erklären müssen.« Ich wusste nicht, wen er meinte.');
          await g.think('Patentblatt No. 46, erschienen am 10. November. Vier Tage vor dem Mord.');
        },
      },
    ],
    bye: 'Ich danke Ihnen, Fräulein Tiedemann.',
  });
};

talk.schulze = async (g) => {
  await g.topics('schulze', {
    greet: async (g, first) => { await g.say('schulze', first ? 'Ach, Herr Sigerson! Wat ’n Unglück! Wat ’n Unglück! Der arme Meister, und der arme Junge! Ick hab die janze Nacht nich jeschlafen – also, ab sieben nich mehr.' : 'Na, Herr Sigerson, noch ’ne Frage?'); },
    items: [
      {
        id: 'sch_sperr', text: 'Wer kam gestern Abend nach zehn ins Haus?',
        run: async (g) => {
          await g.say('schulze', 'Det steht allet in meinem Buch! Um zehne wird zujeschlossen, so will’s die Hausordnung, und wer später kommt, zahlt den Sperrsechser.');
          await g.say('schulze', 'Also: Der Gustav um zwanzig nach zehne. Det Fräulein Clara um elfe, mit der Pferdebahn. Und Sie, Herr Sigerson, um eins, und jesungen ham Se ooch noch.');
          await g.say('holmes', 'Gesummt, Frau Schulze. Ein Thema aus dem Violinkonzert von Brahms.');
          g.addClue('sperrsechser');
        },
      },
      {
        id: 'sch_kohlen', text: 'Ist Ihnen gestern Abend etwas Ungewöhnliches aufgefallen?',
        run: async (g) => {
          await g.say('schulze', 'Und ob! Der Meister kam nich die Kohlen holen. Jeden Abend Punkt zehne, wenn die Normaluhr schlägt, steht der mit seinem Eimer am Keller. Pünktlich wie seine Uhren, sag ick immer.');
          await g.say('schulze', 'Jestern nich. Ick hab noch jedacht: Na, der wird doch nich krank sein? Aber Licht brannte ja.');
          g.addClue('kohlen22');
        },
      },
      {
        id: 'sch_streit', text: 'Wissen Sie etwas über einen Streit gestern?',
        run: async (g) => {
          await g.say('schulze', 'Na und ob! Jestern Nachmittag, ick hab jrade die Treppe jefeudelt. Da hat der Meister jebrüllt: »Ein Jeselle kriegt meine Tochter nich!« Det hab ick ooch dem Kommissar jesagt.');
          await g.say('schulze', 'Aber Gott, der Meister hat doch immer jebrüllt. Und hinterher hat er dem Jungen uff die Schulter jeklopft.');
          g.addClue('streit');
        },
      },
      {
        id: 'sch_voss', text: 'Kennen Sie Herrn Voss von gegenüber?',
        run: async (g) => {
          await g.say('schulze', 'Den feinen Herrn Voss? Der hat Schulden bis über beede Ohren, sagt die Bäckersfrau. Aber ’ne Gaslampe, so hell wie die Sonne, und Zigarren für zwanzig Pfennig det Stück!');
          await g.say('schulze', 'Im Sommer war der fast täglich beim Meister. Und dann uff eenmal nich mehr.');
        },
      },
      {
        id: 'sch_prause', text: 'Und Herr Prause, der Hauswirt?',
        run: async (g) => {
          await g.say('schulze', 'Der will den Meister rausekeln, schon seit’m Sommer. Wejen ’nem Bankier, der den Laden haben will. Aber unser Meister hat ’nen Vertrag bis Neunzehnhundert!');
        },
      },
    ],
    bye: 'Danke, Frau Schulze.',
  });
};

talk.prause = async (g) => {
  await g.topics('prause', {
    greet: async (g, first) => { await g.say('prause', first ? 'Prause. Eigentümer dieses Hauses. Eine schreckliche Sache, ganz schrecklich. Schlecht fürs Haus. Sehr schlecht für die Vermietung.' : 'Sie wünschen?'); },
    items: [
      {
        id: 'pr_plan', text: 'Was tragen Sie da für Pläne?',
        run: async (g) => {
          await g.say('prause', 'Den Umbau! Aus dem Laden wird ein Kontor. Ein Bankier aus der Burgstraße zahlt mir die dreifache Miete. Elektrisches Licht, ein Telephon, alles modern.');
          await g.say('prause', 'Nur der alte Tiedemann wollte nicht weichen. Sein Vertrag, sein Vertrag! Als ob ein Vertrag die Zeit aufhält.');
          g.addClue('bauplan');
          await g.think('Ein Motiv, gewiss. Aber ein Mann, der in Mieten denkt, klagt lieber, als dass er mordet.');
        },
      },
      {
        id: 'pr_abend', text: 'Wo waren Sie gestern Abend, Herr Prause?',
        run: async (g) => {
          await g.say('prause', 'Um neun war ich hier, um dem Mann die Kündigung zu überbringen. Persönlich, das gehört sich so.');
          await g.say('prause', 'In der Werkstatt brannte Licht, aber niemand öffnete. Ich habe geklopft, dreimal, viermal. Und es war so still dadrin. Kein Ticken, gar nichts.');
          await g.say('prause', 'Ich dachte, der alte Sturkopf hat seine Uhren abgestellt, nur um mich zu ärgern. Da bin ich gegangen.');
          g.addClue('prause21');
          await g.think('Um neun schon kein Ticken mehr. Die Uhren standen also lange vor 23:15 still.');
        },
      },
      {
        id: 'pr_uhren', text: 'Verstehen Sie etwas von Uhren?',
        run: async (g) => {
          await g.say('prause', 'Ich? Von Uhren? Meine Taschenuhr zieht mir meine Frau auf. Ich habe in meinem Leben noch keine Uhr geöffnet. Wozu auch – es gibt Uhrmacher.');
          g.addClue('prause_laie');
        },
      },
    ],
    bye: 'Guten Tag, Herr Prause.',
  });
};

talk.mahnke = async (g) => {
  await g.topics('mahnke', {
    greet: async (g) => { await g.say('mahnke', 'Na, wat darf’s sein, der Herr?'); },
    items: [
      {
        id: 'm_voss', text: 'Kennen Sie Hermann Voss, den Uhrmacher?',
        run: async (g) => {
          await g.say('mahnke', 'Den Voss? Stammjast. Kommt jeden Abend Punkt achte, trinkt seine drei Molle und zwee Korn, und bezahlt mit Jammern.');
          await g.say('mahnke', 'Bloß jestern, da kam er erst kurz vor zehne. Pitschnass war er nich mal, hatte ’nen Schirm. Und so uffjekratzt, wie ick ihn noch nie jesehn hab.');
          g.addClue('voss_alibi');
        },
      },
      {
        id: 'm_runde', text: 'Was steht da auf Ihrer Tafel?', when: (g) => !g.has('voss_2315'),
        run: async (g) => {
          await g.say('mahnke', 'Die Runde vom Voss! Um Viertel nach elfe hat er quer durch die Stube jerufen: »Meine Herren, es ist Viertel nach elf – Korn für alle, auf meine Rechnung!« Der Voss! Der hat in zwanzig Jahren keene Runde jeschmissen!');
          await g.say('mahnke', 'Det hab ick sofort anjeschrieben. Sonst jloobt mir det doch keener.');
          g.addClue('voss_2315');
        },
      },
      {
        id: 'm_gustav', text: 'Kommt Gustav Hennig auch zu Ihnen?',
        run: async (g) => {
          await g.say('mahnke', 'Der junge Schlesier? Selten. Der spart für seinen Meister. Aber vor drei Wochen saß er hier am Stammtisch und hat erzählt, wie se bei ihm zu Hause die Uhren anhalten, wenn eener stirbt.');
          await g.say('mahnke', 'Der Voss saß daneben und hat sich drüber lustig jemacht. »Aberglaube aus dem Riesengebirge!« Aber zujehört hat er, det kann ick Ihnen sagen. Janz jenau zujehört.');
          g.addClue('voss_brauch');
        },
      },
      {
        id: 'm_korn', text: 'Einen Korn, bitte.',
        run: async (g) => {
          await g.say('mahnke', 'Na also! Wohl bekomm’s. Zehn Pfennig.');
          await g.think('Scharf, ehrlich und ohne Umschweife. Ich wünschte, das ließe sich von mehr Zeugen sagen.');
        },
      },
    ],
    bye: 'Danke, Herr Mahnke.',
  });
};

talk.ede = async (g) => {
  await g.topics('ede', {
    greet: async (g, first) => { await g.say('ede', first ? 'Na, Herr? Wohin soll’s jehn? Ick fahr aber erst, wenn ick uffjetaut bin. Und Lotte ooch.' : 'Immer noch hier, Herr? Ick ooch.'); },
    items: [
      {
        id: 'e_abend', text: 'Waren Sie gestern Abend hier?',
        run: async (g) => {
          await g.say('ede', 'Jeden Abend, Herr, wenn keene Fahrjäste da sind. Jestern war’s so nass, da hab ick hier jesessen bis Mitternacht.');
          await g.say('ede', 'Kurz vor zehne kam der Voss rin. Mit ’nem feinen schwarzen Seidenschirm, Elfenbeinjriff, wie’n Jeheimrat! Der olle Knauser hat sonst nich mal ’nen Rejenschirm. Ick hab noch jefragt: »Na, Voss, haste’n jeerbt?« Da hat er bloß jeknurrt.');
          g.addClue('schirm_ede');
        },
      },
      {
        id: 'e_runde', text: 'Erinnern Sie sich an die Runde um Viertel nach elf?',
        run: async (g) => {
          await g.say('ede', 'Wie könnt ick die verjessen! Der Voss steht uff, zieht seine Uhr, hält se hoch wie’n Pastor die Bibel und brüllt die Uhrzeit. Und dann: Korn für alle!');
          await g.say('ede', 'Danach saß er still in der Ecke und hat keen Wort mehr jeredet. Is ’n komischer Vogel, der Voss.');
          g.addClue('voss_2315');
        },
      },
      {
        id: 'e_lotte', text: 'Wie geht es Lotte?',
        run: async (g) => {
          await g.say('ede', 'Lotte? Die steht draußen und jammert. Die mag keenen Nebel. Und keene Pferdebahn. Und keene Automobile, wenn se mal welche sieht.');
          await g.say('holmes', 'Ein Pferd mit festen Grundsätzen.');
          await g.say('ede', 'Det hat se von mir.');
        },
      },
    ],
    bye: 'Gute Fahrt, Ede.',
  });
};

talk.voss = async (g) => {
  await g.topics('voss', {
    greet: async (g, first) => { await g.say('voss', first ? 'Hermann Voss, Uhren und Goldwaren. Womit kann ich dienen? Eine Taschenuhr für den Herrn? Ein Regulator?' : 'Noch etwas, Herr Sigerson? Ich habe zu tun.'); },
    items: [
      {
        id: 'v_abend', text: 'Wo waren Sie gestern Abend, Herr Voss?',
        run: async (g) => {
          await g.say('voss', 'Ich? Bis zehn hier im Laden, Inventur. Danach in der Destille bei Mahnke, wie jeden Abend.');
          await g.say('voss', 'Um Viertel nach elf habe ich sogar eine Runde ausgegeben, fragen Sie, wen Sie wollen! Um Viertel nach elf, ganz genau.');
          g.addClue('voss_inventur');
          g.addClue('voss_2315');
          await g.think('Viertel nach elf. Niemand hat ihm gesagt, welche Zeit die Uhren drüben zeigen. Und er bietet mir ein Alibi an, bevor ich danach gefragt habe.');
        },
      },
      {
        id: 'v_tiedemann', text: 'Wann haben Sie Meister Tiedemann zuletzt gesehen?',
        run: async (g) => {
          await g.say('voss', 'Oh, vor Wochen. Wir sprachen kaum noch miteinander, der alte Herr war ... schwierig. Ein Pedant. Gott hab ihn selig.');
          if (g.has('durchschrift')) await g.think('Vor Wochen? Der Meister notierte für gestern acht Uhr: »H. V. kommt.«');
        },
      },
      {
        id: 'v_patentfrage', text: 'Sie haben ein Patent angemeldet?', when: (g) => g.has('patentnotiz'),
        run: async (g) => {
          await g.say('voss', 'Meine Synchron-Hemmung! Das Werk von Jahren, Herr Sigerson. Wenn die Einheitszeit kommt, wird jede Bahnhofsuhr im Reich danach gehen. Jede!');
          await g.say('holmes', 'Ein großer Wurf. Und so unerwartet, bei einem Mann, der vor allem Goldwaren verkauft.');
          await g.say('voss', 'Ich ... verbitte mir diesen Ton.');
        },
      },
      {
        id: 'v_juli', text: 'Meister Tiedemann zeigte Ihnen im Juli seine Zeichnungen.', when: (g) => g.has('juli'),
        run: async (g) => {
          await g.say('voss', 'Zeichnungen? Ach, diese Spielerei. Ja, er hat mir einmal ein paar Skizzen gezeigt. Unbrauchbar, völlig unbrauchbar. Mit meiner Erfindung hat das nichts zu tun.');
          await g.think('Sein Blick ging zum Vorhang hinter ihm, nur einen Wimpernschlag lang. Und von dort weht warme Luft herein. Ein Ofen, um diese Zeit, in einem Hinterzimmer?');
          g.set('voss_ofen');
        },
      },
      {
        id: 'v_zigarre', text: 'Sie rauchen Sumatra Imperial?', when: (g) => g.has('bauchbinde'),
        run: async (g) => {
          await g.say('voss', 'Die beste Zigarre Berlins, mein Herr. Darf ich Ihnen eine anbieten? Für gute Kunden.');
          await g.say('holmes', 'Danke, ich bleibe bei meiner Pfeife. Aber Sie haben einen ausgezeichneten Geschmack.');
          g.addClue('voss_raucht');
        },
      },
      {
        id: 'v_schirm', text: 'Ein schöner Schirm in Ihrem Ständer.', when: (g) => g.has('schirm'),
        run: async (g) => {
          await g.say('voss', 'Der? Den ... hat ein Kunde vergessen. Ja. Vergessen.');
          await g.say('holmes', 'Ein Kunde mit den Initialen C. F. T.?');
          await g.say('voss', 'Ich führe nicht Buch über die Monogramme meiner Kundschaft!');
        },
      },
      {
        id: 'v_schulden', text: 'Das Bankhaus Leßmann mahnt Sie?', when: (g) => g.has('voss_schulden'),
        run: async (g) => {
          await g.say('voss', 'Das ... das geht Sie gar nichts an! Haben Sie in meiner Vitrine geschnüffelt?');
          await g.say('voss', 'Eine vorübergehende Verlegenheit. Sobald das Patent erteilt ist, bin ich alle Sorgen los.');
          await g.think('Sobald das Patent erteilt ist. Dem stand nur ein Mensch im Weg – und ein paar datierte Zeichnungen.');
        },
      },
    ],
    bye: 'Guten Tag, Herr Voss.',
  });
};

export { talk };

// ============================================================ Finale
const SCOFF = [
  ['voss', 'Ha! Und das soll ein Beweis sein?'],
  ['wenzel', 'Das überzeugt mich nicht, Herr Sigerson.'],
  ['voss', 'Herr Kommissar, muss ich mir dieses Geschwätz anhören?'],
  ['wenzel', 'Was hat denn das damit zu tun?'],
];

async function step(g, st, prompt, accept) {
  for (;;) {
    const id = await g.present(prompt, { pipes: st.pipes, maxPipes: 3 });
    if (accept.includes(id)) { g.sfx('success'); return id; }
    g.state.wrongPresent++;
    st.pipes--;
    st.n++;
    g.sfx('fail');
    const [who, line] = SCOFF[st.n % SCOFF.length];
    await g.say(who, line);
    if (st.pipes <= 0) {
      await g.say('wenzel', 'Herr Sigerson, Sie reden im Kreis. Noch einmal so etwas, und ich lasse Sie hinausführen.');
      await g.say('holmes', 'Verzeihen Sie, Herr Kommissar. Ich habe mich im Notizbuch vergriffen. Lassen Sie mich diesen Punkt noch einmal darlegen.');
      st.pipes = 3;
    } else {
      await g.think('Nein. Das beweist es nicht. Konzentration, Holmes.');
    }
  }
}

async function finale(g) {
  await g.ui.fade(1, 600);
  g.refreshCast(true);
  const sp = g.scene.spots.f_holmes;
  g.holmes.stop();
  g.holmes.setPos(sp.x, sp.z).setYaw(sp.yaw);
  for (const id of ['wenzel', 'krause', 'voss', 'schulze', 'clara', 'gustav', 'paule']) g.look(id, 'holmes');
  g.focus([-0.4, 1.2, 0.6], 7.5);
  await g.wait(0.2);
  await g.ui.fade(0, 700);
  await g.narrate('Eine Viertelstunde später. In der stillen Werkstatt drängen sich die Hausbewohner. Hermann Voss steht mit verschränkten Armen beim Ladentisch, die Zigarre im Mundwinkel.');
  await g.say('voss', 'Ich habe einen Laden zu führen, Herr Kommissar. Was soll dieses Theater?');
  await g.say('wenzel', 'Herr Sigerson hat eine Theorie. Ich bin gespannt. Sehr gespannt.');
  await g.say('holmes', 'Meine Damen und Herren. Siebenunddreißig Uhren zeigen Viertel nach elf. Sie sollen uns glauben machen, Meister Tiedemann sei um 23:15 Uhr gestorben. Doch diese Uhren lügen. Bis auf eine.');
  const st = { pipes: 3, n: 0 };

  await step(g, st, 'Welcher Beweis zeigt, wann der Meister wirklich starb?', ['wahrezeit', 'gewichtsuhr']);
  await g.say('holmes', 'Die Schwarzwälder Uhr. Ihr Pendel wurde nicht mit Papier festgeklemmt wie die anderen – der Meister riss es im Fallen aus der Bahn. Ihr Gewicht verrät, wie lange sie seit dem Aufziehen um sieben lief: Sie blieb um 20:36 Uhr stehen.');
  await g.say('holmes', 'Um zehn holte der Meister nicht wie jeden Abend seine Kohlen. Er lag längst hier.');
  await g.say('schulze', 'Heilije Mutter Jottes. Und ick hab noch jedacht, der wird krank sein ...');

  await step(g, st, 'Und wo war Gustav Hennig um halb neun?', ['kurskarte', 'sperrsechser']);
  await g.say('holmes', 'Im Abendkurs des Handwerkervereins in der Sophienstraße, von acht bis zehn – sein Lehrer hat es auf der Karte bestätigt. Um 22:20 Uhr zahlte er Frau Schulze den Sperrsechser.');
  await g.say('schulze', 'Stimmt! Steht in meinem Buch, schwarz uff weiß!');
  await g.say('wenzel', 'Hm. Weiter.');

  await step(g, st, 'Wer hatte ausgerechnet für 23:15 ein Alibi – so laut, dass die ganze Destille es hörte?', ['voss_2315']);
  await g.say('holmes', 'Sie, Herr Voss. Um Viertel nach elf riefen Sie in der Destille die Uhrzeit aus und spendierten eine Runde Korn – Sie, der sonst keinen Pfennig herausrückt. Mahnke hat es eigens an die Tafel geschrieben.');
  await g.say('holmes', 'Und noch heute Morgen boten Sie mir dieses Alibi an, ehe ich danach fragte. Woher wussten Sie, welche Zeit die Uhren hier zeigen?');
  await g.say('voss', 'Lächerlich! Ein Mann wird doch wohl eine Runde ausgeben dürfen!');

  const v = await step(g, st, 'Der Meister erwartete gestern um acht einen Besucher. Welcher Beweis zeigt, wer es war?', ['durchschrift', 'bauchbinde', 'voss_raucht', 'schirm', 'schirm_ede', 'krause_voss']);
  if (v === 'durchschrift') await g.say('holmes', 'Der Meister riss die Seite nicht selbst aus seinem Auftragsbuch – das taten Sie. Aber er schrieb mit festem Druck. Auf der Folgeseite steht: »8 Uhr abends: H. V. kommt.«');
  else if (v === 'bauchbinde' || v === 'voss_raucht') await g.say('holmes', 'Unter dem Besucherstuhl lag die Bauchbinde einer Sumatra Imperial – in einer Werkstatt, in der das Rauchen verboten ist. Es ist Ihre Marke, Herr Voss. Sie haben ein ganzes Kistchen davon auf Ihrem Ladentisch.');
  else await g.say('holmes', 'Kurz vor zehn verließen Sie dieses Haus durch die Ladentür, unter dem Schirm des Meisters. Er steht jetzt in Ihrem Schirmständer – Elfenbeingriff, graviert »C. F. T.«.');
  if (g.has('krause_voss') && v !== 'krause_voss') await g.say('krause', 'Jawoll! Kurz vor zehne kam er hier raus. Hab ick jesehn!');
  await g.say('voss', 'Ich war in meinem Laden! Inventur!');
  await g.say('krause', 'Im Dunkeln, Herr Voss? Bei Ihnen war den janzen Abend keen Licht. Det weeß ick, ick bin jede Stunde vorbeijekommen.');

  await step(g, st, 'Und warum, Herr Voss? Welcher Beweis zeigt Ihr Motiv?', ['patentnotiz', 'juli', 'mappe']);
  await g.say('holmes', 'Im Juli zeigte Ihnen der Meister seine Synchron-Hemmung. Im Oktober meldeten Sie sie als Ihr eigenes Patent an. Am 10. November erschien das Patentblatt No. 46 – und Meister Tiedemann las es.');
  await g.say('holmes', 'Er bestellte Sie für gestern Abend her und legte seine Zeichnungen bereit, jeden Bogen datiert: 3. Juli 1892. Mit ihnen war Ihr Patent wertlos und Ihr Ruf dahin. Und das Bankhaus Leßmann wartet auf 3 800 Mark.');
  await g.say('voss', 'Beweisen Sie das! Zeigen Sie mir diese Zeichnungen! Sie haben sie nicht!');

  await step(g, st, 'Wo sind die Zeichnungen des Meisters?', ['brandreste']);
  await g.say('holmes', 'In Ihrem Ofen, Herr Voss. Sie haben sie heute früh verbrannt – in Eile, und nicht gründlich genug.');
  await g.say('holmes', '»Berlin, den 3. Juli 1892. C. F. T.« Seine Handschrift. Auf seinen Zeichnungen. In Ihrer Asche.');
  await g.wait(0.6);
  await g.narrate('Die Zigarre fällt Voss aus dem Mund. Lange sagt er nichts. In der Stille ist nur der Regen am Schaufenster zu hören.');
  await g.say('voss', 'Er hat mich ausgelacht. Vierzig Jahre Uhrmacher, und er hat mich ausgelacht. »Ein Pfuscher mit goldenem Schild.« Ich wollte nur die Zeichnungen. Er hielt sie fest, er drohte mit dem Patentamt, mit der Polizei ...');
  await g.say('voss', 'Die Chronos stand auf der Werkbank. Ich habe nicht nachgedacht.');
  await g.say('holmes', 'Danach aber haben Sie sehr wohl nachgedacht. Eine ganze Stunde lang. Sie hätten die Pendel einfach anhalten können. Stattdessen sicherten Sie jedes mit Seidenpapier und führten jedes Schlagwerk mit, damit nicht eine einzige Uhr Schaden nahm.');
  await g.say('voss', 'Ich bin doch Uhrmacher.');
  await g.say('holmes', 'Eben das hat Sie verraten. Und der Meister war ein Pedant: Er malte eine Skala neben das Gewicht seiner Schwarzwälder Uhr. Seine Pedanterie hat Sie überführt.');
  await g.say('wenzel', 'Hermann Voss, ich verhafte Sie wegen Mordes an Carl Friedrich Tiedemann. Krause, die Handschellen.');
  await g.say('wenzel', '... Und, Krause – die *anderen* Handschellen machen Sie los.');
  await g.ui.fade(1, 600);
  g.set('geloest');
  g.set('gustav_frei');
  g.refreshCast(true);
  g.holmes.setPos(sp.x, sp.z).setYaw(sp.yaw);
  for (const id of ['wenzel', 'krause', 'voss', 'schulze', 'paule']) g.look(id, 'holmes');
  g.faceEach('gustav', 'clara');
  g.look('gustav', 'clara');
  g.look('clara', 'gustav');
  await g.wait(0.2);
  await g.ui.fade(0, 700);
  g.sfx('success');
  await g.narrate('Clara fällt Gustav um den Hals. Frau Schulze weint hemmungslos in ihre Schürze, und Paule wirft seine Mütze in die Luft.');
  await g.say('gustav', 'Herr Sigerson ... wie soll ich Ihnen das jemals danken?');
  await g.say('holmes', 'Legen Sie Ihre Meisterprüfung ab, Herr Hennig. Das war sein Wunsch.');
  await g.say('wenzel', 'Sigerson. Norweger, sagen Sie. Ich habe vor zwei Jahren von einem Engländer gelesen, der so arbeitete wie Sie. Er soll in der Schweiz verunglückt sein, in einem Wasserfall.');
  await g.say('holmes', 'Eine tragische Geschichte, Herr Kommissar. Ich habe davon gehört.');
  await g.say('wenzel', 'Hm. Wenn Sie wieder einmal etwas *nicht* hören, Herr Sigerson – das Präsidium steht am Alexanderplatz.');
  g.unfocus();
  await epilogue(g);
}

async function epilogue(g) {
  g.audio.setAmbience('epilog');
  await g.ui.fade(1, 900);
  await g.journal({
    kicker: 'Aus dem Tagebuch von S. Sigerson · Dienstag, den 15. November 1892, spät abends',
    title: 'Siebenunddreißig Herzschläge',
    text: `Am Abend, als das Haus zur Ruhe gekommen war, bat mich Fräulein Tiedemann, die Uhren wieder in Gang zu setzen. Gustav war mit Wenzel ins Präsidium gefahren, um seine Aussage zu machen – diesmal als Zeuge.

Ich zog die Seidenstreifen aus den Pendeln, einen nach dem anderen, und stellte jede Uhr nach der Normaluhr auf der Straße. Siebenunddreißig Mal. Die Schwarzwälder zuletzt. Ich habe das Gewicht hinaufgezogen, bis es an der gemalten Marke »aufgezogen« stand, und ihr Pendel angestoßen.

Nun dringt das Ticken wieder durch die Dielen. Wenzel hat das Patentamt benachrichtigt; die Anmeldung V 2117 wird nicht erteilt werden. Die Synchron-Hemmung gehört Clara Tiedemann, und wenn die Einheitszeit kommt, wird sie eine wohlhabende Frau sein. Gustav, so hoffe ich, wird bis dahin Meister.

Kurz vor Mitternacht brachte mir Frau Schulze ein Telegramm. Kein Absender. Aufgegeben in London, Westminster, um 6 Uhr 40 abends:

*»M. IN BERLIN. VORSICHT. – M.«*

Mycroft. Und das erste M. kann nur einen Namen bedeuten. Colonel Sebastian Moran, der beste Schütze des Empire und der letzte Mann Moriartys, ist in dieser Stadt.

Ich habe die Lampe gelöscht und mich mit dem Rücken zur Wand ans Fenster gesetzt. Unten ticken siebenunddreißig Uhren. Ich werde heute Nacht nicht schlafen.`,
    sign: 'S. S.',
    button: 'Fall abschließen',
  });
  await g.finish();
}
