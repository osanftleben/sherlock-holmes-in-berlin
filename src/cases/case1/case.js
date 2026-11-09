// Fall 1: Der Uhrmacher von der Rosenthaler Straße (Berlin, 1892) – Daten des Falls
import { build as strasse } from './scenes/strasse.js';
import { build as werkstatt } from './scenes/werkstatt.js';
import { build as hof } from './scenes/hof.js';
import { build as kneipe } from './scenes/kneipe.js';
import { build as voss } from './scenes/voss.js';
import * as dialogs from './dialogs.js';

const speakers = {
  holmes: { name: 'Holmes', portrait: { hat: 'deerstalker', cape: true, pipe: true } },
  paule: { name: 'Paule', portrait: { hat: 'cap' } },
  wenzel: { name: 'Kommissar Wenzel', portrait: { hat: 'bowler', mustache: 'kaiser' } },
  krause: { name: 'Schutzmann Krause', portrait: { hat: 'pickelhaube', mustache: 'kaiser' } },
  clara: { name: 'Clara Tiedemann', portrait: { dress: true, hair: 'bun' } },
  gustav: { name: 'Gustav Hennig', portrait: {} },
  schulze: { name: 'Frau Schulze', portrait: { hat: 'bonnet', dress: true } },
  prause: { name: 'Wilhelm Prause', portrait: { hat: 'tophat', beard: 'chops' } },
  voss: { name: 'Hermann Voss', portrait: { beard: 'chops', cigar: true } },
  mahnke: { name: 'Wirt Mahnke', portrait: { mustache: 'walrus' } },
  ede: { name: 'Kutscher Ede', portrait: { hat: 'coachman', beard: 'full' } },
};

const characters = {
  holmes: {
    height: 1.07, girth: 0.92, skin: '#e8c6a4', hair: '#2a1d14', hat: 'deerstalker', hatColor: '#6e5c42',
    coat: 'long', coatColor: '#625342', coatMat: 'tweed', cape: '#625342', pants: '#3a3430', shoes: '#1a130e',
    collar: '#ece6d6', tie: '#2a2a32', props: ['pipe', 'lens'], speed: 1.75,
  },
  paule: {
    height: 0.76, girth: 0.92, skin: '#eac2a0', hair: '#8a5a2a', hat: 'cap', hatColor: '#4a4036',
    coat: 'jacket', coatColor: '#6e5640', pants: '#4a3c30', shoes: '#2a1e14', collar: '#d8cfb8', props: ['bag'], speed: 2.1,
  },
  wenzel: {
    height: 1.02, girth: 1.14, skin: '#e0b48e', hair: '#6a5846', hat: 'bowler', hatColor: '#1c1a18',
    coat: 'frock', coatColor: '#2b2b30', pants: '#2a2a2e', vest: '#3a3438', mustache: 'kaiser', facial: '#5a4a3a',
    tie: '#5a1a1a', props: ['chain'],
  },
  krause: {
    height: 1.04, girth: 1.06, skin: '#e2b08a', hair: '#4a3a2a', hat: 'pickelhaube', coat: 'uniform', coatColor: '#20294a',
    pants: '#1a1e2e', gloves: '#e8e2d2', mustache: 'kaiser', facial: '#3a2a1a', props: ['saber'], pose: 'handsBack',
  },
  clara: {
    height: 0.93, girth: 0.92, skin: '#f0cfb2', hair: '#7a4a28', hairStyle: 'bun', coat: 'dress', coatColor: '#2e2a36',
    collar: '#e8e0d0', cuff: '#e8e0d0', pose: 'sit', seat: 0.47,
    variants: { stand: { pose: 'stand' } },
  },
  gustav: {
    height: 0.99, girth: 0.95, skin: '#ecc4a0', hair: '#b08a4a', coat: 'jacket', coatColor: '#d8d0bc', sleeves: '#d8d0bc',
    vest: '#4a3a2a', apron: '#6e6050', apronTop: 0.2, apronBottom: -0.3, pants: '#3a3430', pose: 'cuffed', seat: 0.5, props: ['cuffs'],
    variants: { free: { pose: 'stand', props: [] } },
  },
  schulze: {
    height: 0.9, girth: 1.28, skin: '#e8bc98', hair: '#9a9a9a', hairStyle: 'grey', hat: 'bonnet', hatColor: '#e4dccb',
    coat: 'dress', coatColor: '#4a4038', apron: '#d8d0c0', apronTop: 0.32, apronBottom: -0.8, pose: 'hips',
  },
  prause: {
    height: 1.0, girth: 1.22, skin: '#e8b89a', hair: '#9a9894', hairStyle: 'grey', hat: 'tophat', hatColor: '#1a1816',
    coat: 'frock', coatColor: '#1e1c20', pants: '#2a2826', vest: '#5a4a2a', beard: 'chops', facial: '#9a9894',
    props: ['cane', 'plan', 'chain'],
  },
  voss: {
    height: 1.0, girth: 1.1, skin: '#e6b896', hair: '#4a3a2e', hairStyle: 'bald', coat: 'frock', coatColor: '#2c2522',
    vest: '#6a2626', pants: '#2a2422', beard: 'chops', facial: '#4a3a2e', glasses: true, tie: '#1a1a1a',
    props: ['cigar', 'chain'], pose: 'counter',
    variants: { stand: { pose: 'stand' }, arrest: { pose: 'handsBack', props: ['chain', 'cuffs'] } },
  },
  mahnke: {
    height: 1.0, girth: 1.34, skin: '#e8b090', hair: '#5a4a3a', hairStyle: 'bald', coat: 'jacket', coatColor: '#dcd4c0',
    sleeves: '#dcd4c0', vest: '#3a3028', apron: '#ece6d8', apronTop: 0.3, apronBottom: -0.55, mustache: 'walrus',
    facial: '#5a4a3a', pose: 'counter',
  },
  ede: {
    height: 1.02, girth: 1.12, skin: '#dca888', hair: '#5a4a3a', hat: 'coachman', hatColor: '#24221e', coat: 'long',
    coatColor: '#3c3c32', pants: '#2e2c28', beard: 'full', facial: '#6a5a48', pose: 'sit', seat: 0.47, props: ['whip'],
  },
};

const talked = (id) => (g) => g.seen('talk:' + id);
const persons = [
  {
    id: 'tiedemann', name: 'Carl Friedrich Tiedemann', role: 'Uhrmachermeister, 63 Jahre – das Opfer', portrait: { beard: 'full' },
    text: 'Seit 1858 Uhrmacher in der Rosenthaler Straße 38. Witwer, Vater von Clara. Ein Pedant, der über jede Minute Buch führte. Arbeitete seit Jahren an einer Erfindung, der »Synchron-Hemmung«.',
    notes: [
      { when: (g) => g.has('leiche'), text: 'Erschlagen mit der bronzenen Chronos-Uhr.' },
      { when: (g) => g.has('wahrezeit'), text: 'Starb gegen 20:36 Uhr – nicht um 23:15.' },
      { when: (g) => g.has('kohlen22'), text: 'Holte jeden Abend Punkt zehn seine Kohlen. Gestern nicht.' },
    ],
  },
  {
    id: 'paule', name: 'Paule Kowalke', role: 'Zeitungsjunge, 12 Jahre', known: (g) => g.flag('paule'),
    text: 'Verkauft an der Ecke Rosenthaler Straße die Morgenblätter. Kennt jeden Hinterhof und jedes Gerücht. Weiß Rat, wenn ich nicht weiterkomme.',
  },
  {
    id: 'wenzel', name: 'Otto Wenzel', role: 'Kriminalkommissar, Polizeipräsidium Alexanderplatz', known: talked('wenzel'),
    text: 'Kavallerist von Mars-la-Tour, gründlich und ehrlich – aber zu schnell mit seinem Urteil. Hält den Gesellen Hennig für den Mörder.',
    notes: [{ when: (g) => g.solved('alibi'), text: 'Beginnt an seiner Theorie zu zweifeln.' }],
  },
  {
    id: 'krause', name: 'August Krause', role: 'Schutzmann im 9. Revier', known: talked('krause'),
    text: 'Bewacht die Ladentür. Ging gestern Abend Streife durch die Rosenthaler Straße.',
    notes: [
      { when: (g) => g.has('licht'), text: 'Sah um 21:15 Uhr Licht und einen Schatten in der Werkstatt.' },
      { when: (g) => g.has('krause_voss'), text: 'Sah Voss kurz vor zehn aus Nr. 38 kommen – mit einem Schirm.' },
    ],
  },
  {
    id: 'clara', name: 'Clara Tiedemann', role: 'Tochter des Meisters, 22 Jahre', known: talked('clara'),
    text: 'Führt den Laden und die Bücher. Möchte Gustav Hennig heiraten.',
    notes: [
      { when: (g) => g.has('sperrsechser'), text: 'Kam gestern um 23 Uhr heim.' },
      { when: (g) => g.has('juli'), text: 'Erzählte, dass Voss im Juli die Zeichnungen sah.' },
    ],
  },
  {
    id: 'gustav', name: 'Gustav Hennig', role: 'Uhrmachergeselle, 25 Jahre, aus Hirschberg in Schlesien', known: talked('gustav'),
    text: 'Fand heute früh um sieben den toten Meister. Von Kommissar Wenzel verhaftet.',
    notes: [
      { when: (g) => g.has('brauch'), text: 'Kennt den Brauch, im Sterbehaus die Uhren anzuhalten.' },
      { when: (g) => g.has('kurskarte'), text: 'Saß gestern von 8 bis 10 Uhr im Abendkurs.' },
      { when: (g) => g.solved('alibi'), text: 'Hat für die wahre Tatzeit ein Alibi.' },
    ],
  },
  {
    id: 'schulze', name: 'Auguste Schulze', role: 'Portiersfrau', known: talked('schulze'),
    text: 'Wacht über Haustür, Sperrbuch und Hausklatsch. Ihr entgeht nichts.',
  },
  {
    id: 'prause', name: 'Wilhelm Prause', role: 'Hausbesitzer, Rentier', known: talked('prause'),
    text: 'Besitzt das Haus Rosenthaler Straße 38 und zwei weitere. Rechnet in Mieten.',
    notes: [
      { when: (g) => g.has('bauplan'), text: 'Wollte Tiedemann für einen Bankier hinauswerfen.' },
      { when: (g) => g.has('prause_laie'), text: 'Versteht nichts von Uhren.' },
    ],
  },
  {
    id: 'voss', name: 'Hermann Voss', role: 'Uhrmacher und Goldwarenhändler, gegenüber', known: talked('voss'),
    text: 'Betreibt den prächtigeren Laden auf der anderen Straßenseite. Raucht teure Zigarren.',
    notes: [
      { when: (g) => g.has('voss_2315'), text: 'Hat ein auffällig lautes Alibi für 23:15 Uhr.' },
      { when: (g) => g.has('patentnotiz'), text: 'Hat eine »Synchron-Hemmung« zum Patent angemeldet.' },
      { when: (g) => g.has('voss_schulden'), text: 'Hat Schulden beim Bankhaus Leßmann.' },
    ],
  },
  {
    id: 'mahnke', name: 'Emil Mahnke', role: 'Wirt der Destille »Zum Rosenthaler Tor«', known: talked('mahnke'),
    text: 'Schenkt Korn und Kümmel aus und kennt die Gewohnheiten jedes Stammgasts.',
  },
  {
    id: 'ede', name: 'Eduard »Ede« Pietsch', role: 'Droschkenkutscher', known: talked('ede'),
    text: 'Wärmt sich zwischen zwei Fahrten in der Destille auf. Sein Pferd heißt Lotte.',
  },
];

const clues = {
  uhren2315: { kind: 'spur', title: 'Alle Uhren zeigen 23:15', text: 'Sämtliche 37 Uhren in Laden und Werkstatt stehen still – und alle zeigen auf die Minute dieselbe Zeit: Viertel nach elf.' },
  pendel: { kind: 'spur', title: 'Festgeklemmte Pendel', text: 'Die Pendel wurden nicht einfach angehalten. Ein gefalteter Streifen Seidenpapier klemmt jedes sanft gegen die Rückwand – so sichert ein Uhrmacher eine Uhr für den Transport. Kein Kratzer, keine verbogene Feder.' },
  schlagwerk: { kind: 'spur', title: 'Das Schlagwerk stimmt', text: 'Die Stutzuhr schlägt zur vollen Stunde genau richtig. Wer die Zeiger auf 23:15 stellte, hat das Schlagwerk fachgerecht mitgeführt. Ein Laie hätte es durcheinandergebracht.' },
  leiche: { kind: 'spur', title: 'Der Leichnam', text: 'Meister Tiedemann starb durch einen Schlag auf den Hinterkopf. Die Totenstarre ist voll ausgebildet – das passt zu 23 Uhr ebenso gut wie zu 20 Uhr. Seine rechte Hand ist zur Schwarzwälder Uhr ausgestreckt.' },
  chronos: { kind: 'spur', title: 'Die Chronos-Uhr', text: 'Eine schwere Bronzeuhr mit dem Zeitgott Chronos liegt neben dem Toten, am Sockel Blut und graue Haare. Die Tatwaffe. Sie stand sonst auf der Werkbank – griffbereit für jeden Besucher.' },
  gewichtsuhr: { kind: 'spur', title: 'Die Schwarzwälder Uhr', text: 'Als einzige Uhr ist ihr Pendel nicht mit Papier festgeklemmt: Es hängt schief, wie von einer fallenden Hand aus der Bahn gerissen. Das Gehgewicht ist an der Skala des Meisters bis zur Marke 68 gesunken. Auf einer Karte: »Gang: 5 cm je Stunde.«' },
  wahrezeit: { kind: 'spur', title: 'Die Uhr blieb um 20:36 stehen', text: 'Aufgezogen um 7 Uhr früh, 68 cm gesunken bei 5 cm je Stunde: Die Schwarzwälder blieb um 20:36 Uhr stehen – in dem Augenblick, als der Meister im Fallen nach ihrem Pendel griff.' },
  ofen: { kind: 'spur', title: 'Der kalte Kachelofen', text: 'Die Glut im Kachelofen ist seit vielen Stunden erloschen, der Kohlenkasten daneben leer. Gestern Abend wurde nicht mehr nachgelegt.' },
  asche: { kind: 'spur', title: 'Zigarrenasche', text: 'Neben dem Besucherstuhl liegt feine, hellgraue, flockige Zigarrenasche – nach meiner Monographie über Tabakaschen eindeutig ein Sumatra-Deckblatt. In einer Werkstatt, in der Rauchen streng verboten ist.' },
  bauchbinde: { kind: 'spur', title: 'Eine Bauchbinde', text: 'Unter dem Besucherstuhl: die rot-goldene Bauchbinde einer Zigarre der Marke »Sumatra Imperial«. Eine teure Sorte.' },
  auftragsbuch: { kind: 'dokument', title: 'Das Auftragsbuch', text: 'Im Auftragsbuch fehlt die Seite für Montag, den 14. November – sauber herausgerissen. Der Meister notierte jeden Kunden und jede Verabredung.' },
  durchschrift: { kind: 'dokument', title: 'Die Durchschrift', text: 'Auf der Folgeseite hat sich die Schrift des Meisters durchgedrückt: »Mo. 14. Nov. – 8 Uhr abds.: H. V. kommt. Zeichnungen v. 3. Juli bereitlegen (Datum!) · Patentblatt No. 46«' },
  mappe: { kind: 'dokument', title: 'Die leere Mappe', text: 'In der Schublade liegt eine Zeichenmappe mit der Aufschrift »Synchron-Hemmung – C. F. T.«. Sie ist leer. Die Zeichnungen der Erfindung des Meisters sind fort.' },
  kasse: { kind: 'spur', title: 'Die unberührte Kasse', text: 'In der Ladenkasse liegen noch 47 Mark und 30 Pfennig, in der Vitrine fehlt keine Uhr. Ein Raubmord war das nicht.' },
  kurskarte: { kind: 'dokument', title: 'Gustavs Kurskarte', text: 'Teilnehmerkarte des Handwerkervereins, Sophienstraße 15: »Gustav Hennig – Abendcursus Mechanik, Montags 8–10 Uhr«. Für den 14. November gestempelt und vom Lehrer abgezeichnet: »anwesend bis Schluß«.' },
  brandreste: { kind: 'spur', title: 'Verbrannte Zeichnungen', text: 'Im Ofen in Voss’ Hinterzimmer: halb verkohlte Bogen Zeichenpapier. Auf einem Rest ist noch zu lesen: »…ron-Hemmung … Berlin, d. 3. Juli 1892 … C. F. T.«' },
  patentnotiz: { kind: 'dokument', title: 'Voss’ Patentanmeldung', text: 'Gerahmt in Voss’ Laden, ausgeschnitten aus dem Patentblatt No. 46 vom 10. November: »Anmeldung V 2117 – H. Voss in Berlin: Synchron-Hemmung für Pendeluhren. Angemeldet am 11. October 1892.«' },
  voss_raucht: { kind: 'spur', title: 'Voss raucht Sumatra Imperial', text: 'Auf Voss’ Ladentisch steht ein Kistchen »Sumatra Imperial«, und er raucht diese Marke selbst. Dieselbe Bauchbinde lag unter dem Besucherstuhl.' },
  schirm: { kind: 'spur', title: 'Ein Schirm mit Elfenbeingriff', text: 'In Voss’ Schirmständer steht ein schwarzer Seidenschirm mit Elfenbeingriff. Eingraviert: »C. F. T.« – der Schirm von Meister Tiedemann.' },
  voss_schulden: { kind: 'dokument', title: 'Die zweite Mahnung', text: 'In Voss’ Vitrine, halb unter einem Uhrenkissen: eine »Zweite Mahnung« des Bankhauses Leßmann über 3 800 Mark, fällig zum 1. December.' },
  einheitszeit: { kind: 'dokument', title: 'Der Streit um die Einheitszeit', text: 'Das Reich berät über eine einheitliche Zeit für alle Bahnen, Ämter und Städte. Kommt sie, müssen Tausende Uhren gleichgeschaltet werden – ein Vermögen für den, der das passende Patent besitzt.' },
  aufzug7: { kind: 'aussage', from: 'Gustav Hennig', title: 'Täglich um sieben aufgezogen', text: 'Gustav zieht die Schwarzwälder Uhr jeden Morgen um Punkt 7 Uhr auf – auf Anweisung des Meisters, der darüber Buch führte. Gestern früh tat er es wie immer.' },
  brauch: { kind: 'aussage', from: 'Gustav Hennig', title: 'Der schlesische Brauch', text: 'In Gustavs Heimat Hirschberg hält man im Sterbehaus alle Uhren an, im Augenblick des Todes. Gustav schwört, er habe es diesmal nicht getan – die Uhren standen schon, als er kam.' },
  streit: { kind: 'aussage', from: 'Frau Schulze', title: 'Der Streit am Nachmittag', text: 'Frau Schulze hörte gestern Nachmittag, wie der Meister und Gustav stritten: »Ein Geselle bekommt meine Tochter nicht!« Für den Kommissar ein Motiv.' },
  sperrsechser: { kind: 'aussage', from: 'Frau Schulze', title: 'Das Sperrbuch', text: 'Nach 22 Uhr ist die Haustür verschlossen; wer später kommt, zahlt der Portiersfrau den Sperrsechser. Ihr Buch für gestern: Gustav Hennig 22:20 Uhr – Fräulein Tiedemann 23:00 Uhr – Herr Sigerson 1:00 Uhr.' },
  kohlen22: { kind: 'aussage', from: 'Frau Schulze', title: 'Die Kohlen um zehn', text: 'Jeden Abend Punkt zehn holte der Meister seinen Kohleneimer aus dem Keller – »pünktlich wie seine Uhren«. Gestern kam er nicht. Frau Schulze wunderte sich noch.' },
  prause21: { kind: 'aussage', from: 'Wilhelm Prause', title: 'Prause klopfte um neun', text: 'Hausbesitzer Prause wollte dem Meister gestern um 21 Uhr die Kündigung bringen. In der Werkstatt brannte Licht, doch niemand öffnete. »Es war so still da drin – kein Ticken, gar nichts.«' },
  bauplan: { kind: 'aussage', from: 'Wilhelm Prause', title: 'Prauses Umbaupläne', text: 'Prause will den Laden zu einem Kontor für einen Bankier umbauen, der die dreifache Miete zahlt. Tiedemann weigerte sich auszuziehen. Ein Motiv?' },
  prause_laie: { kind: 'aussage', from: 'Wilhelm Prause', title: 'Prause versteht nichts von Uhren', text: '»Meine Taschenuhr zieht mir meine Frau auf.« Prause gesteht ohne Scham, dass er noch nie eine Uhr geöffnet hat.' },
  licht: { kind: 'aussage', from: 'Schutzmann Krause', title: 'Licht in der Werkstatt', text: 'Krause sah auf seiner Runde um 21:15 Uhr Licht in der Werkstatt und einen Schatten, der sich bewegte. Um 23 Uhr brannte noch Licht, doch nichts rührte sich mehr. Bei Voss gegenüber war es den ganzen Abend dunkel.' },
  krause_voss: { kind: 'aussage', from: 'Schutzmann Krause', title: 'Voss kam aus Nr. 38', text: 'Kurz vor zehn sah Krause Herrn Voss aus dem Laden Nr. 38 kommen, unter einem großen Schirm, und hinüber zur Destille gehen. »Die beiden Uhrmacher kennen sich ja.« Er dachte sich nichts dabei.' },
  voss_alibi: { kind: 'aussage', from: 'Wirt Mahnke', title: 'Voss kam erst um zehn', text: 'Voss kommt sonst jeden Abend Punkt acht in die Destille. Gestern erschien er erst kurz vor zehn.' },
  voss_2315: { kind: 'aussage', from: 'Voss und Mahnke', title: 'Ein lautes Alibi für 23:15', text: 'Um Viertel nach elf rief Voss in der Destille laut die Uhrzeit aus und spendierte eine Runde Korn – Mahnke schrieb es eigens an die Tafel. Ausgerechnet der Geizhals Voss. Und ausgerechnet um 23:15.' },
  voss_brauch: { kind: 'aussage', from: 'Wirt Mahnke', title: 'Voss kannte den Brauch', text: 'Vor drei Wochen erzählte Gustav am Stammtisch von den angehaltenen Uhren in Schlesien. Voss saß dabei und spottete darüber.' },
  voss_inventur: { kind: 'aussage', from: 'Hermann Voss', title: 'Voss’ angebliche Inventur', text: 'Voss behauptet, er habe gestern von acht bis zehn in seinem Laden Inventur gemacht.' },
  juli: { kind: 'aussage', from: 'Clara Tiedemann', title: 'Voss kannte die Erfindung', text: 'Im Juli zeigte der Meister Voss stolz seine Zeichnungen der Synchron-Hemmung. Voss nannte sie »eine hübsche Spielerei« – und kam danach auffällig oft zu Besuch.' },
  schirm_ede: { kind: 'aussage', from: 'Kutscher Ede', title: 'Voss mit fremdem Schirm', text: 'Voss kam gestern Abend mit einem feinen Schirm mit Elfenbeingriff in die Destille. »Der olle Knauser hat sonst nich mal ’nen Regenschirm.«' },
};

const deductions = [
  {
    id: 'todeszeit', title: 'Die wahre Todeszeit', question: 'Wann starb Meister Tiedemann wirklich?', needs: ['wahrezeit', 'kohlen22'],
    options: [
      { t: 'Um 23:15 Uhr – so zeigen es alle Uhren.', wrong: 'Die Uhren zeigen, was man mir zeigen *will*. Die Schwarzwälder hat eine andere Geschichte erzählt.' },
      { t: 'Gegen halb neun am Abend.', ok: true },
      { t: 'Gegen zehn Uhr, als er die Kohlen holen wollte.', wrong: 'Um zehn kam er eben *nicht* in den Hof. Da war er schon tot.' },
      { t: 'Kurz nach Mitternacht.', wrong: 'Um Mitternacht standen die Uhren längst. Ich verliere mich in Vermutungen.' },
    ],
    result: 'Die Schwarzwälder blieb um 20:36 Uhr stehen, als der Meister im Fallen nach ihrem Pendel griff. Um zehn holte er nicht wie sonst seine Kohlen. Er starb gegen halb neun am Abend – nicht um 23:15.',
  },
  {
    id: 'fachmann', title: 'Wer hielt die Uhren an?', question: 'Was für ein Mensch hat die 37 Uhren angehalten und gestellt?', needs: ['pendel', 'schlagwerk'],
    options: [
      { t: 'Ein Laie in großer Eile.', wrong: 'In Eile? Er hat sich für jede einzelne Uhr Zeit genommen. Und ein Laie hätte die Schlagwerke durcheinandergebracht.' },
      { t: 'Ein Uhrmacher – jemand vom Fach.', ok: true },
      { t: 'Niemand. Die Uhren liefen von selbst ab.', wrong: 'Siebenunddreißig Uhren laufen nicht auf die Minute gleichzeitig ab – und schon gar nicht mit Papier im Pendel.' },
      { t: 'Der Meister selbst, vor seinem Tod.', wrong: 'Wozu sollte er seine eigenen Uhren auf eine Stunde stellen, die er nicht mehr erlebte?' },
    ],
    result: 'Die Pendel wurden mit Seidenpapier gesichert wie für einen Transport, die Schlagwerke fachgerecht mitgeführt. Das war ein Uhrmacher. Jemand, der Uhren liebt – selbst während er einen Mord vertuscht.',
  },
  {
    id: 'falschezeit', title: 'Die falsche Stunde', question: 'Warum zeigen alle Uhren ausgerechnet 23:15?', needs: ['brauch', 'voss_2315'], needsDed: ['todeszeit'],
    options: [
      { t: 'Gustav hielt die Uhren nach seinem Brauch an, als er den Toten fand.', wrong: 'Dann zeigten sie sieben Uhr früh – nicht Viertel nach elf.' },
      { t: 'Der Täter wollte die Tat auf eine Stunde legen, zu der Gustav allein war – und für die er selbst ein Alibi hatte.', ok: true },
      { t: 'Um 23:15 Uhr kam Clara nach Hause.', wrong: 'Clara kam um elf. Und wer Clara belasten wollte, hätte nicht Gustavs Brauch nachgeahmt.' },
      { t: 'Ein Zufall ohne Bedeutung.', wrong: 'Ein Mann, der eine Stunde lang 37 Uhren richtet, überlässt nichts dem Zufall.' },
    ],
    result: 'Der Täter ahmte Gustavs schlesischen Brauch nach und legte die Tat auf 23:15 – eine Zeit, zu der Gustav allein in seiner Kammer lag. Für genau diese Minute verschaffte er sich selbst ein lautes Alibi.',
  },
  {
    id: 'alibi', title: 'Gustavs Alibi', question: 'Hat Gustav Hennig ein Alibi für die wahre Tatzeit?', needs: ['kurskarte', 'sperrsechser'],
    options: [
      { t: 'Nein. Für 23:15 Uhr hat er keines.', wrong: '23:15 ist die falsche Stunde. Ich muss nach der wahren Tatzeit fragen.' },
      { t: 'Ja. Er saß bis 22 Uhr im Abendkurs und kam erst um 22:20 Uhr nach Hause.', ok: true },
      { t: 'Nein. Er hätte zwischen zwei Kursstunden herkommen können.', wrong: 'Der Lehrer bestätigt: anwesend bis Schluss. Und die Sophienstraße ist kein Katzensprung im Regen.' },
    ],
    result: 'Von acht bis zehn saß Gustav im Abendkurs des Handwerkervereins, um 22:20 Uhr zahlte er den Sperrsechser. Zur wahren Tatzeit war er nicht im Haus.',
  },
  {
    id: 'besucher', title: 'Der Besucher', question: 'Wer besuchte den Meister am Abend des 14. November?', needs: ['durchschrift', 'bauchbinde', 'voss_raucht'],
    options: [
      { t: 'Wilhelm Prause, der Hausbesitzer.', wrong: 'Prause stand um neun vor verschlossener Tür. Und »H. V.« ist nicht W. P.' },
      { t: 'Ein unbekannter Kunde.', wrong: 'Unbekannt? Der Meister notierte die Initialen: H. V. Und der Besucher rauchte Sumatra Imperial.' },
      { t: 'Hermann Voss, der Uhrmacher von gegenüber.', ok: true },
      { t: 'Gustav Hennig.', wrong: 'Gustav saß im Abendkurs. Und er raucht nicht – an seinen Fingern ist keine Spur von Tabak.' },
    ],
    result: '»H. V. kommt« um acht Uhr abends. Unter dem Besucherstuhl die Bauchbinde einer Sumatra Imperial – der Zigarre, die Hermann Voss raucht. Der Besucher war Voss.',
  },
  {
    id: 'motiv', title: 'Das Motiv', question: 'Weshalb musste Meister Tiedemann sterben?', needs: ['mappe', 'patentnotiz', 'juli'],
    options: [
      { t: 'Ein Raub, der schiefging.', wrong: 'Die Kasse ist voll, keine Uhr fehlt. Gestohlen wurde nur Papier.' },
      { t: 'Ein Streit um Clara.', wrong: 'Das ist Wenzels Theorie für Gustav. Der Besucher wollte etwas anderes – die Mappe ist leer.' },
      { t: 'Voss hatte die Erfindung als eigenes Patent angemeldet. Die datierten Zeichnungen hätten ihn als Dieb entlarvt.', ok: true },
      { t: 'Prauses Umbaupläne.', wrong: 'Prause hätte geklagt, nicht gemordet. Und er versteht nichts von Uhren.' },
    ],
    result: 'Voss sah die Synchron-Hemmung im Juli und meldete sie im Oktober als eigenes Patent an. Tiedemanns Zeichnungen vom 3. Juli bewiesen den Diebstahl. Deshalb musste er sie haben – um jeden Preis.',
  },
];

const suspects = [
  { id: 'gustav', name: 'Gustav Hennig, der Geselle', wrong: 'Gustav saß zur Tatzeit im Abendkurs. Ich habe es selbst bewiesen – wie konnte ich das vergessen?' },
  { id: 'prause', name: 'Wilhelm Prause, der Hausbesitzer', wrong: 'Prause versteht nichts von Uhren. Wer die Uhren gestellt hat, war ein Fachmann.' },
  { id: 'clara', name: 'Clara Tiedemann, die Tochter', wrong: 'Clara kam erst um elf nach Hause, und sie hätte nie Gustav belastet.' },
  { id: 'schulze', name: 'Frau Schulze, die Portiersfrau', wrong: 'Frau Schulze? Sie war es, die das Sperrbuch führte, das Gustav entlastet. Nein.' },
  { id: 'voss', name: 'Hermann Voss, der Uhrmacher von gegenüber' },
];

const questions = [
  { text: 'Wann starb Meister Tiedemann wirklich?', done: (g) => g.solved('todeszeit') },
  { text: 'Wer hat die Uhren angehalten?', done: (g) => g.solved('fachmann') },
  { text: 'Warum zeigen alle Uhren 23:15?', done: (g) => g.solved('falschezeit') },
  { text: 'Hat Gustav Hennig ein Alibi?', done: (g) => g.solved('alibi') },
  { text: 'Wer war gestern Abend zu Besuch?', done: (g) => g.solved('besucher') },
  { text: 'Was war das Motiv?', done: (g) => g.solved('motiv') },
  { text: 'Wo sind die Zeichnungen geblieben?', done: (g) => g.has('brandreste') },
  { text: 'Den Täter überführen.', done: (g) => g.flag('geloest') },
];

const allSolved = (g) => deductions.every((d) => g.solved(d.id));
const canAccuse = (g) => allSolved(g) && g.has('brandreste');

function objective(g) {
  if (!g.flag('intro')) return 'Sieh dich vor dem Haus um.';
  if (g.flag('geloest')) return 'Der Fall ist gelöst.';
  if (g.flag('finale')) return 'Überführe den Täter.';
  if (!g.flag('zutritt')) return 'Verschaffe dir Zutritt zur Werkstatt.';
  if (!g.visited('werkstatt')) return 'Betritt die Werkstatt von Meister Tiedemann.';
  if (canAccuse(g)) return 'Sprich mit Kommissar Wenzel – du kennst den Täter.';
  const avail = deductions.find((d) => !g.solved(d.id) && g.dedAvailable(d));
  if (avail) return `Kombiniere im Notizbuch: ${avail.title}.`;
  if (allSolved(g)) return g.flag('voss_ofen') ? 'Durchsuche den Ofen in Voss’ Hinterzimmer.' : 'Finde die gestohlenen Zeichnungen.';
  if (!g.solved('todeszeit')) return 'Finde heraus, wann der Meister wirklich starb.';
  if (!g.solved('fachmann')) return 'Finde heraus, wer die Uhren angehalten hat.';
  if (!g.solved('alibi')) return 'Prüfe Gustavs Alibi.';
  if (!g.solved('besucher')) return 'Finde heraus, wer gestern Abend zu Besuch war.';
  if (!g.solved('falschezeit')) return 'Finde heraus, warum die Uhren 23:15 zeigen.';
  return 'Finde das Motiv.';
}

function summary(g) {
  let s = 'Uhrmachermeister Carl Friedrich Tiedemann wurde heute früh tot in seiner Werkstatt gefunden, erschlagen. Alle Uhren im Haus stehen still. Kommissar Wenzel hat den Gesellen Gustav Hennig verhaftet.';
  if (g.solved('todeszeit')) s += ' Doch der Meister starb schon gegen halb neun – die Uhren lügen.';
  if (g.solved('besucher')) s += ' Am Abend war Hermann Voss bei ihm.';
  if (g.flag('geloest')) s += ' Voss hat gestanden.';
  return s;
}

// Wer steht wo? (Standorte sind in den Szenen definiert)
function placements(scene, g) {
  const fin = g.flag('finale');
  const done = g.flag('geloest');
  const L = [];
  if (scene === 'strasse') {
    if (!fin) L.push({ id: 'krause', spot: 'krause', fixed: true });
    if (g.flag('wenzel_draussen')) L.push({ id: 'wenzel', spot: 'wenzel' });
  }
  if (scene === 'werkstatt') {
    if (!fin) {
      L.push({ id: 'wenzel', spot: 'wenzel' });
      L.push({ id: 'gustav', spot: 'gustav', fixed: true });
      L.push({ id: 'clara', spot: 'clara', fixed: true });
    } else {
      L.push({ id: 'wenzel', spot: 'f_wenzel' });
      L.push({ id: 'krause', spot: 'f_krause' });
      L.push({ id: 'voss', spot: 'f_voss', variant: done ? 'arrest' : 'stand' });
      L.push({ id: 'gustav', spot: g.flag('gustav_frei') ? 'f_gustav_frei' : 'gustav', variant: g.flag('gustav_frei') ? 'free' : null, fixed: true });
      L.push({ id: 'clara', spot: g.flag('gustav_frei') ? 'f_clara_frei' : 'clara', variant: g.flag('gustav_frei') ? 'stand' : null, fixed: true });
      L.push({ id: 'schulze', spot: 'f_schulze' });
      L.push({ id: 'paule', spot: 'f_paule', talk: false });
    }
  }
  if (scene === 'hof' && !fin) {
    L.push({ id: 'schulze', spot: 'schulze' });
    L.push({ id: 'prause', spot: 'prause' });
  }
  if (scene === 'kneipe') {
    L.push({ id: 'mahnke', spot: 'mahnke', fixed: true });
    L.push({ id: 'ede', spot: 'ede', fixed: true });
  }
  if (scene === 'voss' && !fin && !g.flag('voss_distracted')) L.push({ id: 'voss', spot: 'voss', fixed: true });
  return L;
}

export default {
  id: 'case1',
  title: 'Der Uhrmacher von der Rosenthaler Straße',
  startMinutes: 8 * 60 + 25,
  start: { scene: 'strasse', spawn: 'start' },
  titleScene: 'strasse',
  speakers, characters, persons, clues, deductions, suspects, questions,
  objective, summary, placements, canAccuse,
  scenes: { strasse, werkstatt, hof, kneipe, voss },
  dialogs,
};
