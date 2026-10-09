// Text des „Basketball-ABC“ (Profil → Basketball-ABC). Reines HTML ohne Daten aus Firestore.
// Alle Klassen und IDs tragen das Präfix „abc-“, damit sie nicht mit den Klassen der App
// kollidieren. Die <svg data-fig=…>-Platzhalter füllt basketball-figures.js.
export const GUIDE_HTML = `
<nav class="abc-toc" id="abc-inhalt" aria-label="Inhalt">
  <h2 class="abc-toc-title">Inhalt</h2>
  <div class="abc-toc-groups">
    <div><div class="abc-toc-label">Grundlagen</div><ul>
      <li><a href="#abc-kurz">In einer Minute</a></li>
      <li><a href="#abc-spielfeld">Spielfeld</a></li>
      <li><a href="#abc-ablauf">Spielzeit &amp; Ablauf</a></li>
      <li><a href="#abc-punkte">Punkte &amp; Würfe</a></li>
    </ul></div>
    <div><div class="abc-toc-label">Regeln</div><ul>
      <li><a href="#abc-verstoesse">Regelverstöße</a></li>
      <li><a href="#abc-fouls">Fouls</a></li>
      <li><a href="#abc-schiris">Schiris &amp; Handzeichen</a></li>
    </ul></div>
    <div><div class="abc-toc-label">Spieler &amp; Taktik</div><ul>
      <li><a href="#abc-positionen">Positionen</a></li>
      <li><a href="#abc-angriff">Angriff</a></li>
      <li><a href="#abc-pickandroll">Pick and Roll</a></li>
      <li><a href="#abc-spielzuege">Spielzüge</a></li>
      <li><a href="#abc-verteidigung">Verteidigung</a></li>
    </ul></div>
    <div><div class="abc-toc-label">Drumherum</div><ul>
      <li><a href="#abc-statistik">Statistik lesen</a></li>
      <li><a href="#abc-bbl">Die BBL</a></li>
      <li><a href="#abc-nba">FIBA oder NBA?</a></li>
      <li><a href="#abc-tippen">Fürs Tippen</a></li>
      <li><a href="#abc-glossar">Glossar</a></li>
    </ul></div>
  </div>
</nav>

<section class="abc-quick abc-sec" id="abc-kurz">
  <h2>Das Wichtigste <span>in einer Minute</span></h2>
  <ul>
    <li>Zwei Teams mit je fünf Spielern auf dem Feld versuchen, den Ball in den gegnerischen Korb zu werfen. Gewechselt wird beliebig oft.</li>
    <li>Gespielt werden 4 × 10 Minuten. Die Uhr steht bei jeder Unterbrechung, deshalb dauert ein Spiel in echt knapp zwei Stunden.</li>
    <li>Ein Korb zählt 2 Punkte, von hinter der Dreierlinie 3, ein Freiwurf 1.</li>
    <li>Unentschieden gibt es nicht. Steht es nach 40 Minuten gleich, wird 5 Minuten verlängert – so oft, bis ein Sieger feststeht.</li>
    <li>Ein Team hat 24 Sekunden Zeit für einen Wurf. Deshalb geht es so schnell hin und her.</li>
    <li>Mit dem Ball in der Hand darf man nicht laufen. Wer sich bewegen will, muss dribbeln.</li>
    <li>Körperkontakt ist nur begrenzt erlaubt. Wer fünf Fouls hat, muss für den Rest des Spiels auf die Bank.</li>
  </ul>
</section>

<section class="abc-sec" id="abc-spielfeld">
  <span class="abc-kicker">Grundlagen</span>
  <div class="abc-sec-head"><h2>Das Spielfeld</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Ein Basketballfeld ist 28 Meter lang und 15 Meter breit. Jede Linie darauf hat eine Aufgabe – und fast jede Regel hängt an einer davon.</p>

  <figure class="abc-fig">
    <div class="abc-scroll"><svg data-fig="court" role="img" aria-label="Basketballfeld von oben: 28 mal 15 Meter, links das Rückfeld, rechts das Vorfeld eines nach rechts angreifenden Teams, mit Zone, Freiwurflinie, Dreierlinie im Abstand von 6,75 Metern, Mittelkreis, Korb und Halbkreis unter dem Korb."></svg></div>
    <p class="abc-swipe-hint">Grafik seitlich wischen</p>
    <figcaption>Das Feld von oben. Das Team in dieser Grafik greift nach rechts an: Die rechte Hälfte ist sein Vorfeld, die linke sein Rückfeld.</figcaption>
  </figure>

  <div class="abc-facts">
    <div class="abc-fact"><b>3,05 m</b><span>Korbhöhe – für alle gleich, egal wie groß</span></div>
    <div class="abc-fact"><b>6,75 m</b><span>Dreierlinie, in den Ecken nur 6,60 m</span></div>
    <div class="abc-fact"><b>5,80 m</b><span>Freiwurflinie, gemessen ab der Grundlinie</span></div>
    <div class="abc-fact"><b>4,90 m</b><span>Breite der Zone, die bis zur Freiwurflinie reicht</span></div>
    <div class="abc-fact"><b>1,25 m</b><span>Radius des Halbkreises unter dem Korb</span></div>
    <div class="abc-fact"><b>Größe 7</b><span>Ball der Männer: 567–650 g, rund 75–78 cm Umfang</span></div>
  </div>

  <h3>Was die Linien bedeuten</h3>
  <ul class="abc-plain">
    <li><strong>Grund- und Seitenlinien</strong> begrenzen das Feld. Die Linien selbst gehören schon zum Aus: Wer mit dem Ball auf die Seitenlinie tritt, ist draußen.</li>
    <li><strong>Mittellinie:</strong> Sie teilt das Feld in dein <strong>Vorfeld</strong> (die Hälfte mit dem Korb, auf den du wirfst) und dein <strong>Rückfeld</strong>. Das ist wichtig für die 8-Sekunden-Regel und das Rückspiel.</li>
    <li><strong>Zone</strong> (auch „Paint“ oder „Bucket“): das farbige Rechteck vor dem Korb. Angreifer dürfen dort höchstens drei Sekunden am Stück stehen.</li>
    <li><strong>Freiwurflinie:</strong> Von hier werden Freiwürfe geworfen – ohne Gegenspieler, mit fünf Sekunden Zeit.</li>
    <li><strong>Dreierlinie:</strong> Wer beim Absprung mit beiden Füßen dahinter steht, wirft einen Dreier. Wer auf der Linie steht, bekommt nur zwei Punkte.</li>
    <li><strong>Halbkreis unter dem Korb</strong> („No-Charge-Zone“): Ein Verteidiger, der hier steht, kann kein Offensivfoul ziehen. Mehr dazu bei den Fouls.</li>
  </ul>
</section>

<section class="abc-sec" id="abc-ablauf">
  <span class="abc-kicker">Grundlagen</span>
  <div class="abc-sec-head"><h2>Spielzeit &amp; Ablauf</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Die BBL spielt nach den internationalen Regeln des Weltverbands FIBA. Die Spielzeit ist <strong>Nettospielzeit</strong>: Die Uhr läuft nur, wenn der Ball im Spiel ist.</p>

  <figure class="abc-fig">
    <div class="abc-tl-bar" role="img" aria-label="Ablauf eines Spiels: erstes Viertel 10 Minuten, 2 Minuten Pause, zweites Viertel 10 Minuten, 15 Minuten Halbzeit, drittes Viertel 10 Minuten, 2 Minuten Pause, viertes Viertel 10 Minuten, bei Gleichstand Verlängerung von 5 Minuten.">
      <span class="abc-seg abc-q" style="--m:10">1</span><span class="abc-seg abc-p" style="--m:2"></span><span class="abc-seg abc-q" style="--m:10">2</span><span class="abc-seg abc-h" style="--m:15">Halbzeit</span><span class="abc-seg abc-q" style="--m:10">3</span><span class="abc-seg abc-p" style="--m:2"></span><span class="abc-seg abc-q" style="--m:10">4</span><span class="abc-seg abc-ot" style="--m:5">OT</span>
    </div>
    <div class="abc-tl-legend"><span><b>Viertel</b> je 10 Minuten</span><span><b>Kurze Pause</b> 2 Minuten</span><span><b>Halbzeit</b> 15 Minuten</span><span><b>OT</b> Verlängerung, je 5 Minuten, nur bei Gleichstand</span></div>
    <figcaption>Ein Spiel im Zeitraffer. Die Balken sind maßstabsgetreu – nur die Unterbrechungen während der Viertel sind nicht eingezeichnet, und die machen den größten Teil der echten Dauer aus.</figcaption>
  </figure>

  <h3>So läuft ein Spiel ab</h3>
  <ul class="abc-plain">
    <li><strong>Sprungball:</strong> Das Spiel beginnt mit einem Sprungball im Mittelkreis. Danach gibt es keine Sprungbälle mehr. Halten zwei Gegenspieler den Ball gleichzeitig fest, zeigt ein Pfeil am Kampfgericht, wer den Ball bekommt – immer abwechselnd („Wechselpfeil“). Auch das 2., 3. und 4. Viertel beginnen nach diesem Pfeil.</li>
    <li><strong>Auszeiten:</strong> Jedes Team hat zwei Auszeiten in der ersten und drei in der zweiten Halbzeit (davon höchstens zwei in den letzten zwei Minuten), dazu eine pro Verlängerung. Eine Auszeit dauert eine Minute. Nicht genutzte verfallen.</li>
    <li><strong>Wechsel:</strong> beliebig oft, aber nur wenn das Spiel unterbrochen ist. Pro Spiel stehen zwölf Spieler im Kader, meist spielen acht bis zehn davon regelmäßig.</li>
    <li><strong>Die letzten zwei Minuten:</strong> Im 4. Viertel und in der Verlängerung hält die Uhr zusätzlich nach jedem Korb an. Nach einer Auszeit darf das Team mit dem Ball dann an der Einwurflinie in der gegnerischen Hälfte einwerfen, statt den Ball erst nach vorne zu bringen. Deshalb dauern die letzten zwei Minuten gern eine Viertelstunde.</li>
    <li><strong>Verlängerung:</strong> Bei Gleichstand nach 40 Minuten gibt es fünf Minuten Verlängerung („Overtime“, OT) – so oft wie nötig.</li>
  </ul>

  <div class="abc-tip">
    <div class="abc-tip-label">Fürs Tippen</div>
    <p>Ein Basketballspiel endet nie unentschieden. Für deinen Sieger-Tipp zählt immer das Endergebnis, also inklusive Verlängerung.</p>
  </div>

  <h3>Die Zahlen, die du kennen solltest</h3>
  <div class="abc-nums">
    <div class="abc-num"><div class="abc-num-v">24</div><div class="abc-num-u">Sekunden</div><p>hat ein Team für einen Wurf. Der Ball muss vor Ablauf den Ring berühren oder in den Korb gehen, sonst bekommt der Gegner den Ball. Die Angriffsuhr hängt über jedem Korb.</p></div>
    <div class="abc-num"><div class="abc-num-v">14</div><div class="abc-num-u">Sekunden</div><p>gibt es neu, wenn der Wurf den Ring berührt hat und die Angreifer den Rebound holen.</p></div>
    <div class="abc-num"><div class="abc-num-v">8</div><div class="abc-num-u">Sekunden</div><p>hat ein Team, um den Ball aus dem Rückfeld über die Mittellinie zu bringen.</p></div>
    <div class="abc-num"><div class="abc-num-v">5</div><div class="abc-num-u">Sekunden</div><p>für einen Einwurf, für einen Freiwurf – und für einen eng bewachten Spieler, der den Ball hält, ohne zu dribbeln, zu passen oder zu werfen.</p></div>
    <div class="abc-num"><div class="abc-num-v">3</div><div class="abc-num-u">Sekunden</div><p>darf ein Angreifer höchstens am Stück in der gegnerischen Zone stehen, solange sein Team den Ball hat.</p></div>
  </div>

  <h3>Ein Angriff in 24 Sekunden</h3>
  <p>So sieht ein typischer Angriff aus, wenn die Verteidigung schon steht:</p>
  <figure class="abc-fig">
    <div class="abc-pos-bar" role="img" aria-label="Zeitstrahl eines Angriffs über 24 Sekunden: etwa 0 bis 6 Sekunden Ball vortragen, 6 bis 16 Sekunden Spielzug, 16 bis 24 Sekunden Abschluss. Nach 8 Sekunden muss der Ball über der Mittellinie sein.">
      <span class="abc-seg abc-a" style="--m:6">Vortragen</span><span class="abc-seg abc-b" style="--m:10">Spielzug</span><span class="abc-seg abc-c" style="--m:8">Abschluss</span>
      <span class="abc-pos-mark" aria-hidden="true"></span>
    </div>
    <div class="abc-pos-ticks" aria-hidden="true"><span style="--t:0">0 s</span><span style="--t:8">8 s<br>Ball über der Mittellinie</span><span style="--t:24">24 s</span></div>
    <figcaption>Richtwerte, kein Gesetz: Nach einem Ballgewinn geht es oft in fünf Sekunden zum Korb. Läuft die Uhr ab, ohne dass der Ball den Ring berührt hat, ertönt die Hupe – Ballverlust.</figcaption>
  </figure>
</section>

<section class="abc-sec" id="abc-punkte">
  <span class="abc-kicker">Grundlagen</span>
  <div class="abc-sec-head"><h2>Punkte &amp; Würfe</h2><div class="abc-sec-rule"></div></div>
  <div class="abc-facts">
    <div class="abc-fact"><b>2 Punkte</b><span>jeder Treffer aus dem Spiel innerhalb der Dreierlinie</span></div>
    <div class="abc-fact"><b>3 Punkte</b><span>Treffer von hinter der Dreierlinie</span></div>
    <div class="abc-fact"><b>1 Punkt</b><span>jeder verwandelte Freiwurf</span></div>
  </div>

  <h3>Die wichtigsten Wurfarten</h3>
  <ul class="abc-plain">
    <li><strong>Korbleger (Layup):</strong> Wurf aus dem Lauf direkt am Korb, meist mit einer Hand übers Brett.</li>
    <li><strong>Dunk:</strong> Der Ball wird von oben in den Korb gestopft. Sicherster Wurf überhaupt – und der lauteste in der Halle.</li>
    <li><strong>Sprungwurf (Jumper):</strong> Wurf aus dem Sprung, aus der Mitteldistanz oder von der Dreierlinie.</li>
    <li><strong>Floater:</strong> ein hoher, weicher Wurf aus dem Lauf, um über große Verteidiger hinweg zu werfen.</li>
    <li><strong>Hakenwurf:</strong> Seitlich zum Korb, mit ausgestrecktem Arm über den Kopf – typisch für Center.</li>
    <li><strong>Tip-in / Putback:</strong> Einen Abpraller direkt wieder reintippen oder reinlegen.</li>
  </ul>

  <h3>Und-eins, Freiwürfe, Korbstörung</h3>
  <ul class="abc-plain">
    <li><strong>Und-eins („And-One“):</strong> Wer trotz Foul trifft, bekommt die Punkte und zusätzlich einen Freiwurf. Ein getroffener Dreier plus Foul kann so vier Punkte bringen.</li>
    <li><strong>Freiwürfe</strong> gibt es nach Fouls beim Wurf oder wenn ein Team zu viele Fouls im Viertel hat (siehe <a href="#abc-fouls">Fouls</a>). Die anderen Spieler stellen sich an der Zone auf und dürfen erst hinein, wenn der Ball die Hand verlassen hat.</li>
    <li><strong>Korbstörung (Goaltending):</strong> Berührt ein Verteidiger den Ball, während er schon von oben Richtung Korb fällt, zählt der Korb trotzdem.</li>
  </ul>

  <div class="abc-aside">
    <div class="abc-aside-label">Warum alle Dreier werfen</div>
    <p>Einfache Rechnung: Wer 36 Prozent seiner Dreier trifft, holt pro Wurf im Schnitt 1,08 Punkte. Ein Zweier aus der Mitteldistanz mit 42 Prozent bringt nur 0,84. Am meisten lohnen sich deshalb Würfe direkt am Korb und Dreier – genau darauf sind moderne Angriffe ausgelegt. In der BBL erzielt ein Team meist zwischen 75 und 95 Punkten pro Spiel.</p>
  </div>
</section>

<section class="abc-sec" id="abc-verstoesse">
  <span class="abc-kicker">Regeln</span>
  <div class="abc-sec-head"><h2>Regelverstöße ohne Foul</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Nicht jeder Pfiff ist ein Foul. Bei einem Regelverstoß gibt es keine Freiwürfe – der Gegner bekommt einfach den Ball und wirft von der Seite ein.</p>
  <div class="abc-cards">
    <div class="abc-card"><h4>Schrittfehler</h4><p>Mit dem Ball in der Hand darf man höchstens zwei Schritte machen. Der Schritt, in dem man den Ball im Laufen aufnimmt, zählt nicht mit („Nullschritt“). Wer steht, hat ein Standbein, um das er sich drehen darf – das Standbein darf aber nicht wandern.</p></div>
    <div class="abc-card"><h4>Doppeldribbling</h4><p>Wer sein Dribbling beendet und den Ball festhält, darf nicht wieder anfangen zu dribbeln. Auch mit beiden Händen gleichzeitig prellen ist verboten. Ausnahme: nach einem eigenen Wurf oder wenn ein anderer Spieler den Ball berührt hat.</p></div>
    <div class="abc-card"><h4>Tragen</h4><p>Beim Dribbeln die Hand unter den Ball schieben und ihn quasi mitnehmen. Wird im Profibereich eher großzügig gepfiffen.</p></div>
    <div class="abc-card"><h4>Aus</h4><p>Berührt der Ball oder der Spieler mit Ball die Linie oder den Boden dahinter, ist er im Aus. Einwurf bekommt das Team, das den Ball <em>nicht</em> zuletzt berührt hat.</p></div>
    <div class="abc-card"><h4>Rückspiel</h4><p>Ist der Ball einmal im Vorfeld, darf das angreifende Team ihn nicht zurück in die eigene Hälfte spielen und dort als Erstes wieder anfassen.</p></div>
    <div class="abc-card"><h4>Zeitregeln</h4><p>24 Sekunden für den Wurf, 8 Sekunden über die Mittellinie, 5 Sekunden für Einwurf und Freiwurf, 3 Sekunden in der Zone – siehe <a href="#abc-ablauf">Spielzeit &amp; Ablauf</a>.</p></div>
    <div class="abc-card"><h4>Fußball</h4><p>Den Ball absichtlich mit Fuß oder Bein spielen. Zufällig mit dem Fuß berühren ist erlaubt.</p></div>
    <div class="abc-card"><h4>Korbstörung</h4><p>Den Ball berühren, während er von oben auf den Korb fällt, oder an Ring und Netz ziehen, während der Ball darauf liegt. Macht das ein Verteidiger, zählt der Korb. Macht es ein Angreifer, zählt er nicht.</p></div>
  </div>
</section>

<section class="abc-sec" id="abc-fouls">
  <span class="abc-kicker">Regeln</span>
  <div class="abc-sec-head"><h2>Fouls</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Ein Foul ist regelwidriger Körperkontakt – oder unsportliches Verhalten. Basketball ist kein kontaktloser Sport: Schieben, Anlehnen und Kämpfen um die Position gehören dazu. Gepfiffen wird, wenn jemand dadurch einen unfairen Vorteil bekommt.</p>

  <div class="abc-aside">
    <div class="abc-aside-label">Das Zylinder-Prinzip</div>
    <p>Jeder Spieler hat einen gedachten Zylinder um sich, vom Boden bis zur Hallendecke. Wer in seinem Zylinder bleibt – also steht oder senkrecht hochspringt –, handelt fair. Wer in den Zylinder eines anderen eindringt und so Kontakt verursacht, ist schuld am Foul. Deshalb springen gute Verteidiger mit hochgestreckten Armen senkrecht in die Höhe, statt zum Ball zu schlagen.</p>
  </div>

  <h3>Was nach einem Foul passiert</h3>
  <div class="abc-tbl"><table>
    <thead><tr><th>Situation</th><th>Folge</th></tr></thead>
    <tbody>
      <tr><td>Foul an einem Spieler, der nicht wirft</td><td>Einwurf für das gefoulte Team. Ab dem 5. Teamfoul im Viertel gibt es stattdessen zwei Freiwürfe.</td></tr>
      <tr><td>Foul beim Wurf, Wurf daneben</td><td>Zwei Freiwürfe, bei einem Dreierversuch drei.</td></tr>
      <tr><td>Foul beim Wurf, Wurf drin</td><td>Der Korb zählt, dazu ein Freiwurf („And-One“).</td></tr>
      <tr><td>Offensivfoul (das Team mit Ball foult)</td><td>Ballbesitz wechselt. Nie Freiwürfe.</td></tr>
    </tbody>
  </table></div>

  <ul class="abc-plain">
    <li><strong>Persönliche Fouls:</strong> Jedes Foul wird dem Spieler angeschrieben. Nach dem <strong>fünften</strong> Foul muss er vom Feld und darf nicht zurück – er ist „ausgefoult“. Deshalb setzen Trainer Leistungsträger mit zwei frühen Fouls oft lange auf die Bank („Foul Trouble“).</li>
    <li><strong>Teamfouls:</strong> Das Kampfgericht zählt alle Fouls eines Teams pro Viertel. Ab dem fünften Teamfoul gibt es für jedes weitere Verteidigungsfoul zwei Freiwürfe, auch ohne Wurf – das Team ist „im Bonus“. Verlängerungen zählen dabei zum 4. Viertel.</li>
    <li><strong>Wann ein Wurf beginnt:</strong> Nach den neuen FIBA-Regeln beginnt die Wurfbewegung erst, wenn Schultern und Ball nach oben Richtung Korb gehen. Wer vorher gefoult wird, bekommt kein Wurffoul – auch nicht, wenn er den Kontakt absichtlich sucht.</li>
  </ul>

  <h3>Die Foul-Arten</h3>
  <div class="abc-cards">
    <div class="abc-card"><h4>Persönliches Foul</h4><p>Der Normalfall: Halten, Stoßen, auf Arm oder Hand schlagen, sich unerlaubt in den Weg stellen, mit der Hüfte wegdrücken.</p><p class="abc-pen"><b>Strafe:</b> Einwurf oder Freiwürfe, siehe Tabelle oben.</p></div>
    <div class="abc-card"><h4>Offensivfoul</h4><p>Der Angreifer verursacht den Kontakt: Er rennt einen korrekt stehenden Verteidiger um („Charging“), stößt ihn mit dem Arm weg oder stellt einen Block, während er sich noch bewegt („Moving Screen“).</p><p class="abc-pen"><b>Strafe:</b> Ballbesitz für den Gegner.</p></div>
    <div class="abc-card"><span class="abc-pill abc-mg">Neu seit Okt. 2026</span><h4>Disruptive Foul</h4><p>Ein taktisches Foul, das den Spielfluss zerstört: Jemand stoppt einen Schnellangriff, ohne den Ball spielen zu wollen, oder foult von hinten oder von der Seite, wenn kein Verteidiger mehr zwischen Angreifer und Korb steht.</p><p class="abc-pen"><b>Strafe:</b> Zwei Freiwürfe (beim Wurf nach den normalen Wurfregeln) und zusätzlich Ballbesitz. Führt nicht zur Disqualifikation.</p></div>
    <div class="abc-card"><span class="abc-pill abc-mg">Neu seit Okt. 2026</span><h4>Flagrant Foul</h4><p>Rücksichtslos, gefährlich oder übertrieben hart: etwa ein Ellbogen ins Gesicht, einen Spieler in der Luft umreißen, Aktionen, die mit Basketball nichts zu tun haben.</p><p class="abc-pen"><b>Strafe:</b> Freiwürfe und Ballbesitz. Zwei Flagrant Fouls bedeuten Disqualifikation.</p></div>
    <div class="abc-card"><h4>Technisches Foul</h4><p>Ein Vergehen ohne Körperkontakt. Kategorie 1: Meckern, respektloses Verhalten, Provozieren, ein Foul vortäuschen („Flopping“), mit den Ellbogen um sich schlagen. Kategorie 2: Spielverzögerung, am Ring hängen.</p><p class="abc-pen"><b>Strafe:</b> Ein Freiwurf für den Gegner, danach geht es weiter wie vorher. Zwei technische Fouls der Kategorie 1 bedeuten Disqualifikation.</p></div>
    <div class="abc-card"><h4>Disqualifizierendes Foul</h4><p>Grobes Fehlverhalten wie Schlagen oder eine Schlägerei. Auch Bankspieler, die bei einer Rangelei aufs Feld laufen, fliegen raus.</p><p class="abc-pen"><b>Strafe:</b> Der Spieler muss in die Kabine, der Gegner bekommt Freiwürfe und den Ball.</p></div>
    <div class="abc-card"><h4>Beidseitiges Foul</h4><p>Zwei Gegenspieler foulen sich gleichzeitig.</p><p class="abc-pen"><b>Strafe:</b> Keine Freiwürfe. Das Team, das den Ball hatte, behält ihn.</p></div>
  </div>

  <div class="abc-aside">
    <div class="abc-aside-label">Was ist mit dem „U-Foul“?</div>
    <p>Bis September 2026 gab es das <strong>Unsportliche Foul</strong> („U-Foul“). Mit den neuen FIBA-Regeln, die ab 1. Oktober 2026 gelten, wurde es in das Disruptive und das Flagrant Foul aufgeteilt. In Kommentaren und älteren Artikeln wirst du den alten Begriff noch oft hören. Ein Spieler wird disqualifiziert bei zwei Flagrant Fouls, zwei technischen Fouls der Kategorie 1 oder einem von beiden. Ein Trainer fliegt nach zwei technischen Fouls für eigenes Verhalten.</p>
  </div>

  <h3>Offensivfoul oder Defensivfoul?</h3>
  <p>Die umstrittenste Entscheidung im Basketball: Ein Angreifer mit Ball prallt mit einem Verteidiger zusammen. Wer war schuld? Es kommt darauf an, ob der Verteidiger eine <strong>legale Verteidigungsposition</strong> hatte: Gesicht zum Gegner, beide Füße am Boden – und zwar <em>bevor</em> der Angreifer zum Wurf oder Korbleger abgesprungen ist.</p>
  <figure class="abc-fig">
    <div class="abc-panels abc-minis" style="--cols:3">
      <div class="abc-panel"><svg data-fig="charge1" role="img" aria-label="Verteidiger steht fest vor dem Halbkreis, der Angreifer dribbelt in ihn hinein. Offensivfoul."></svg><div class="abc-panel-cap"><span><b>Offensivfoul.</b> Der Verteidiger stand rechtzeitig fest, der Angreifer läuft hinein.</span></div></div>
      <div class="abc-panel"><svg data-fig="charge2" role="img" aria-label="Verteidiger rutscht im letzten Moment seitlich in den Laufweg. Defensivfoul."></svg><div class="abc-panel-cap"><span><b>Defensivfoul.</b> Der Verteidiger rutscht im letzten Moment in den Weg.</span></div></div>
      <div class="abc-panel"><svg data-fig="charge3" role="img" aria-label="Verteidiger steht im Halbkreis unter dem Korb. Defensivfoul."></svg><div class="abc-panel-cap"><span><b>Defensivfoul.</b> Wer im Halbkreis unter dem Korb steht, kann kein Offensivfoul ziehen.</span></div></div>
    </div>
    <figcaption>Der Stern markiert den Zusammenprall. Wenn Verteidiger ein Offensivfoul „ziehen“, heißt das: Sie stellen sich bewusst in den Weg und nehmen den Kontakt in Kauf. Das zählt zu den mutigsten Aktionen im Spiel.</figcaption>
  </figure>
</section>

<section class="abc-sec" id="abc-schiris">
  <span class="abc-kicker">Regeln</span>
  <div class="abc-sec-head"><h2>Schiris &amp; Handzeichen</h2><div class="abc-sec-rule"></div></div>
  <p>In der BBL pfeifen <strong>drei Schiedsrichter</strong>: ein Crew Chief und zwei Umpires. Am Kampfgericht an der Seitenlinie sitzen der Anschreiber und sein Assistent, der Zeitnehmer und die Bedienung der Angriffsuhr. Dazu kommt ein Kommissar, der alles überwacht.</p>
  <p>Strittige Szenen können sich die Schiris am Monitor ansehen (<strong>Instant Replay</strong>): War der Ball rechtzeitig vor der Schlusssirene aus der Hand? Zwei oder drei Punkte? Wer hat den Ball in den letzten zwei Minuten zuletzt berührt, bevor er ins Aus ging? War ein hartes Foul ein Flagrant Foul?</p>
  <p>Auch die Trainer können den Videobeweis verlangen (<strong>Head Coach Challenge</strong>). Dafür ruft der Cheftrainer „Challenge“ und zeichnet mit den Fingern ein Rechteck in die Luft, das Zeichen für einen Bildschirm. Nach der BBL-Richtlinie für die Saison 2025/26 gilt das Prinzip „1+1“: Jeder Cheftrainer hat eine Challenge. Nur wenn sie erfolgreich ist und die Schiris ihre Entscheidung ändern, bekommt er eine zweite. In den letzten zwei Minuten des Spiels bleibt höchstens eine übrig.</p>

  <h3>So läuft ein Pfiff ab</h3>
  <ol class="abc-plain">
    <li><strong>Uhr anhalten:</strong> Bei einem Regelverstoß hebt der Schiri die offene Hand, bei einem Foul die geballte Faust.</li>
    <li><strong>Erklären:</strong> Mit einem Handzeichen zeigt er, was passiert ist, zum Beispiel Schrittfehler, Halten oder Charging.</li>
    <li><strong>Melden:</strong> Bei einem Foul zeigt er dem Kampfgericht mit den Fingern die Rückennummer des foulenden Spielers. Bei zweistelligen Nummern kommen erst die Zehner mit dem Handrücken, dann die Einer mit der Handfläche. Danach zeigt er die Art des Fouls.</li>
    <li><strong>Weiter geht’s:</strong> Ein, zwei oder drei Finger stehen für die Zahl der Freiwürfe. Gibt es keine, zeigt der ausgestreckte Arm parallel zur Seitenlinie die neue Spielrichtung für den Einwurf.</li>
  </ol>

  <h3>Was die Zeichen bedeuten</h3>
  <div class="abc-tbl"><table>
    <thead><tr><th>Entscheidung</th><th>Handzeichen</th></tr></thead>
    <tbody>
      <tr class="abc-grp"><th colspan="2">Regelverstöße</th></tr>
      <tr><td>Schrittfehler</td><td>Beide Fäuste vor dem Körper umeinander rollen.</td></tr>
      <tr><td>Doppeldribbling</td><td>Mit den offenen Handflächen nach unten auf und ab „patschen“, wie beim Dribbeln.</td></tr>
      <tr><td>Tragen</td><td>Die Handfläche macht eine halbe Drehung.</td></tr>
      <tr><td>3 Sekunden</td><td>Arm ausgestreckt, drei Finger.</td></tr>
      <tr><td>5 Sekunden</td><td>Fünf Finger.</td></tr>
      <tr><td>8 Sekunden</td><td>Acht Finger.</td></tr>
      <tr><td>24 Sekunden</td><td>Die Finger berühren die eigene Schulter.</td></tr>
      <tr><td>Rückspiel</td><td>Der Arm schwingt in einem Halbkreis vor dem Körper.</td></tr>
      <tr><td>Fußspiel</td><td>Auf den eigenen Fuß zeigen.</td></tr>
      <tr class="abc-grp"><th colspan="2">Fouls</th></tr>
      <tr><td>Halten</td><td>Eine Hand umfasst das andere Handgelenk und zieht es nach unten.</td></tr>
      <tr><td>Blocking oder illegaler Block</td><td>Beide Hände in die Hüften. Gilt für den Verteidiger, der unerlaubt im Weg steht, und für den Angreifer, der sich beim Blockstellen noch bewegt.</td></tr>
      <tr><td>Stoßen oder Rempeln ohne Ball</td><td>Eine Stoßbewegung nachahmen.</td></tr>
      <tr><td>Charging (Rempeln mit Ball)</td><td>Die geballte Faust schlägt in die offene Handfläche.</td></tr>
      <tr><td>Unerlaubter Einsatz der Hände</td><td>Mit der Hand auf das andere Handgelenk schlagen.</td></tr>
      <tr><td>Schlag auf die Hand</td><td>Die Handfläche schlägt gegen den anderen Unterarm.</td></tr>
      <tr><td>Handchecking</td><td>Eine Hand umfasst das andere Handgelenk und schiebt es nach vorne.</td></tr>
      <tr><td>Ellbogen schwingen</td><td>Den Ellbogen nach hinten schwingen.</td></tr>
      <tr><td>Foul des Teams mit Ball</td><td>Die geballte Faust zeigt in die neue Spielrichtung, also zum Korb, den das foulende Team verteidigt.</td></tr>
      <tr><td>Beidseitiges Foul</td><td>Beide geballten Fäuste hin und her schwenken.</td></tr>
      <tr><td>Foul vortäuschen (Flopping)</td><td>Den Unterarm zweimal anheben.</td></tr>
      <tr><td>Technisches Foul</td><td>Mit beiden Händen ein „T“ formen, die Handflächen sind zu sehen.</td></tr>
      <tr><td>Disruptive Foul <span class="abc-pill abc-mg">neu</span></td><td>Die geballte Faust hochstrecken, dann die Hand vor das Gesicht senken und zwei Finger zeigen.</td></tr>
      <tr><td>Flagrant Foul <span class="abc-pill abc-mg">neu</span></td><td>Beide Arme über den Kopf, die Fäuste an den Handgelenken gekreuzt.</td></tr>
      <tr><td>Disqualifizierendes Foul</td><td>Beide Hände zu Fäusten ballen.</td></tr>
      <tr class="abc-grp"><th colspan="2">Punkte und Spielunterbrechungen</th></tr>
      <tr><td>Dreierversuch</td><td>Ein Arm mit drei ausgestreckten Fingern. Trifft der Wurf, gehen beide Arme mit drei Fingern hoch.</td></tr>
      <tr><td>Korb zählt nicht</td><td>Die Arme kreuzen sich einmal wie eine Schere vor der Brust.</td></tr>
      <tr><td>Auszeit</td><td>Mit der Hand und dem Zeigefinger ein „T“ formen.</td></tr>
      <tr><td>Wechsel</td><td>Die Unterarme vor der Brust kreuzen.</td></tr>
      <tr><td>Spielverzögerung <span class="abc-pill abc-mg">neu</span></td><td>Den ausgestreckten Arm zweimal waagerecht vor dem Körper hin und her schwenken.</td></tr>
      <tr><td>Videobeweis (Schiri)</td><td>Die Hand kreist mit waagerecht ausgestrecktem Zeigefinger.</td></tr>
      <tr><td>Challenge (Trainer)</td><td>Mit den Fingern ein Rechteck in die Luft zeichnen.</td></tr>
    </tbody>
  </table></div>
  <p>Die mit „neu“ markierten Zeichen hat die FIBA mit den Regeln eingeführt, die seit 1. Oktober 2026 gelten. Das alte Zeichen für das Unsportliche Foul, eine Hand umfasst das Handgelenk über dem Kopf, gibt es seitdem nicht mehr.</p>
</section>

<section class="abc-sec" id="abc-positionen">
  <span class="abc-kicker">Spieler &amp; Taktik</span>
  <div class="abc-sec-head"><h2>Die Positionen</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Die fünf Positionen werden traditionell von 1 bis 5 durchnummeriert. Die Nummer beschreibt die Rolle, nicht die Rückennummer: Eine „Eins“ ist der Spielmacher, eine „Fünf“ der Center.</p>

  <figure class="abc-fig">
    <div class="abc-panels" style="--cols:2">
      <div class="abc-panel"><svg data-fig="spots" role="img" aria-label="Halbes Spielfeld mit den Namen der Orte: Ecken, Flügel, Spitze, Ellbogen, Low Post, High Post, Zone, Mitteldistanz, Dreierlinie, Grundlinie und Mittellinie."></svg><div class="abc-panel-cap"><span><b>Die Orte auf dem Feld.</b> So reden Trainer und Kommentatoren über das Feld.</span></div></div>
      <div class="abc-panel"><svg data-fig="positions" role="img" aria-label="Halbes Spielfeld mit einer typischen Aufstellung: 1 Point Guard an der Spitze mit Ball, 2 Shooting Guard auf dem rechten Flügel, 3 Small Forward auf dem linken Flügel, 4 Power Forward am linken Ellbogen, 5 Center am rechten Low Post."></svg><div class="abc-panel-cap"><span><b>Eine klassische Aufstellung.</b> Drei Spieler außen, zwei innen.</span></div></div>
    </div>
    <figcaption>In allen Grafiken liegt der Korb oben, das Team greift also von unten nach oben an.</figcaption>
  </figure>

  <div class="abc-poscards">
    <div class="abc-poscard"><div class="abc-pos-n">1</div><div><h4>Point Guard</h4><p class="abc-aka">Aufbauspieler, Spielmacher, „Einser“</p><p>Bringt den Ball nach vorne, sagt die Spielzüge an und verteilt die Pässe. Meist der kleinste und schnellste Spieler, mit der besten Ballkontrolle und Übersicht. Seine wichtigste Zahl sind die Assists.</p><p><strong>Achte darauf:</strong> Mit wem spielt er den Pick and Roll – und wen findet er danach?</p></div></div>
    <div class="abc-poscard"><div class="abc-pos-n">2</div><div><h4>Shooting Guard</h4><p class="abc-aka">Werfer, „Zweier“</p><p>Der Distanzschütze. Läuft sich ohne Ball um Blöcke frei, wirft Dreier aus dem Fangen und zieht auch mal zum Korb. Verteidigt oft den besten Außenspieler des Gegners.</p><p><strong>Achte darauf:</strong> Wie viele Blöcke bekommt er, bis er frei ist?</p></div></div>
    <div class="abc-poscard"><div class="abc-pos-n">3</div><div><h4>Small Forward</h4><p class="abc-aka">Flügelspieler, „Dreier“</p><p>Der Allrounder zwischen den Kleinen und den Großen: wirft, zieht zum Korb, holt Rebounds und kann in der Verteidigung mehrere Positionen übernehmen.</p><p><strong>Achte darauf:</strong> Gegen wen verteidigt er? Oft bekommt er den gefährlichsten Gegenspieler.</p></div></div>
    <div class="abc-poscard"><div class="abc-pos-n">4</div><div><h4>Power Forward</h4><p class="abc-aka">Großer Flügel, „Vierer“</p><p>Früher reiner Kraftspieler unter dem Korb, heute oft ein „Stretch-Vierer“, der auch Dreier trifft und so die Zone frei zieht. Stellt Blöcke und holt Rebounds.</p><p><strong>Achte darauf:</strong> Steht er innen oder draußen an der Dreierlinie?</p></div></div>
    <div class="abc-poscard"><div class="abc-pos-n">5</div><div><h4>Center</h4><p class="abc-aka">Innenspieler, „Fünfer“, „Big“</p><p>Der größte Spieler. Arbeitet am Korb: Rebounds, Blocks, Blöcke stellen und abrollen, Abschlüsse aus kurzer Distanz. In der Verteidigung schützt er den Korb („Rim Protector“).</p><p><strong>Achte darauf:</strong> Muss er nach einem Wechsel plötzlich einen kleinen, schnellen Guard verteidigen?</p></div></div>
  </div>

  <h3>Wie groß sind die Spieler?</h3>
  <figure class="abc-fig">
    <div class="abc-hchart" role="img" aria-label="Typische Körpergrößen in der BBL: Point Guard 1,80 bis 1,93 Meter, Shooting Guard 1,88 bis 1,98, Small Forward 1,96 bis 2,05, Power Forward 2,03 bis 2,10, Center 2,06 bis 2,16 Meter.">
      <div class="abc-hrow"><div class="abc-hlab"><b>1</b>Point Guard</div><div class="abc-htrack"><span class="abc-hbar" style="--a:1.80;--b:1.93"></span></div><div class="abc-hval">1,80–1,93 m</div></div>
      <div class="abc-hrow"><div class="abc-hlab"><b>2</b>Shooting Guard</div><div class="abc-htrack"><span class="abc-hbar" style="--a:1.88;--b:1.98"></span></div><div class="abc-hval">1,88–1,98 m</div></div>
      <div class="abc-hrow"><div class="abc-hlab"><b>3</b>Small Forward</div><div class="abc-htrack"><span class="abc-hbar" style="--a:1.96;--b:2.05"></span></div><div class="abc-hval">1,96–2,05 m</div></div>
      <div class="abc-hrow"><div class="abc-hlab"><b>4</b>Power Forward</div><div class="abc-htrack"><span class="abc-hbar" style="--a:2.03;--b:2.10"></span></div><div class="abc-hval">2,03–2,10 m</div></div>
      <div class="abc-hrow"><div class="abc-hlab"><b>5</b>Center</div><div class="abc-htrack"><span class="abc-hbar" style="--a:2.06;--b:2.16"></span></div><div class="abc-hval">2,06–2,16 m</div></div>
      <div class="abc-hrow abc-hscale" aria-hidden="true"><div></div><div class="abc-htrack"><span style="--v:1.80">1,80</span><span style="--v:1.90">1,90</span><span style="--v:2.00">2,00</span><span style="--v:2.10">2,10</span></div><div></div></div>
    </div>
    <figcaption>Grobe Richtwerte für Profis. Ausreißer gibt es in beide Richtungen – und wer klein ist, gleicht das mit Tempo aus.</figcaption>
  </figure>

  <ul class="abc-plain">
    <li><strong>Gruppen:</strong> 1 und 2 sind die <strong>Guards</strong> (Außenspieler), 3 und 4 die <strong>Forwards</strong> (Flügel), 4 und 5 die <strong>Bigs</strong> (Innenspieler).</li>
    <li><strong>Positionslos:</strong> Heute verschwimmen die Grenzen. Viele Teams spielen mit zwei Ballführern („Combo Guards“), einem Vierer, der Dreier wirft, oder ganz ohne klassischen Center („Small Ball“).</li>
    <li><strong>Sechster Mann:</strong> der beste Spieler, der nicht in der Startaufstellung steht und als Erster eingewechselt wird.</li>
  </ul>
  <div class="abc-tip">
    <div class="abc-tip-label">Fürs Tippen</div>
    <p>Mit nur fünf Spielern auf dem Feld wiegt ein Ausfall schwer. Fehlt der Point Guard oder der einzige echte Center, kann das ein Spiel kippen. Ein Blick auf die Verletztenmeldungen vor dem Spieltag lohnt sich.</p>
  </div>
</section>

<section class="abc-sec" id="abc-angriff">
  <span class="abc-kicker">Spieler &amp; Taktik</span>
  <div class="abc-sec-head"><h2>Angriff: die Bausteine</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Jeder Angriff ist aus wenigen Bausteinen gebaut: Dribbeln, Passen, Blocken und Schneiden. Das Ziel ist immer dasselbe – einen Mitspieler in eine bessere Wurfposition bringen, als die Abwehr zulassen will.</p>

  <ul class="abc-plain">
    <li><strong>Schnellangriff oder Halbfeld:</strong> Nach einem Ballgewinn oder Rebound rennt das Team sofort los, bevor die Abwehr steht (<strong>Fastbreak</strong>, „Transition“). Klappt das nicht, baut es einen <strong>Halbfeldangriff</strong> mit einem Spielzug auf.</li>
    <li><strong>Spacing:</strong> Angreifer stehen weit auseinander, oft an der Dreierlinie und in den Ecken. So kann kein Verteidiger gleichzeitig seinen Mann decken und einem Kollegen helfen.</li>
    <li><strong>Ballbewegung:</strong> Der Ball ist schneller als jeder Spieler. Ein guter Angriff lässt den Ball laufen, bis die Abwehr einen Schritt zu spät kommt – der „Extra-Pass“ zum noch freieren Mitspieler.</li>
  </ul>

  <div class="abc-aside">
    <div class="abc-aside-label">„Block“ hat zwei Bedeutungen</div>
    <p><strong>Einen Block stellen</strong> (englisch „Screen“ oder „Pick“): Ein Angreifer stellt sich einem Verteidiger in den Weg, damit sein Mitspieler frei wird. <strong>Einen Wurf blocken</strong>: Ein Verteidiger schlägt den Ball bei einem Wurf weg. Im Zweifel verrät der Zusammenhang, was gemeint ist.</p>
  </div>

  <h3>So liest du die Grafiken</h3>
  <ul class="abc-legend">
    <li><svg data-fig="lg-off" width="26" height="26" aria-hidden="true"></svg>Angreifer (Zahl = Position)</li>
    <li><svg data-fig="lg-ball" width="18" height="18" aria-hidden="true"></svg>hat den Ball</li>
    <li><svg data-fig="lg-def" width="26" height="26" aria-hidden="true"></svg>Verteidiger</li>
    <li><svg data-fig="lg-cut" width="48" height="16" aria-hidden="true"></svg>Laufweg</li>
    <li><svg data-fig="lg-pass" width="48" height="16" aria-hidden="true"></svg>Pass</li>
    <li><svg data-fig="lg-drib" width="48" height="16" aria-hidden="true"></svg>Dribbling</li>
    <li><svg data-fig="lg-screen" width="48" height="22" aria-hidden="true"></svg>Block stellen</li>
    <li><svg data-fig="lg-dcut" width="48" height="16" aria-hidden="true"></svg>Laufweg Verteidiger</li>
  </ul>

  <h3>Die Blockarten</h3>
  <div class="abc-tbl"><table>
    <thead><tr><th>Block</th><th>Was passiert</th></tr></thead>
    <tbody>
      <tr><td>Ball-Block (Pick)</td><td>Block für den Spieler mit Ball – die Grundlage des Pick and Roll.</td></tr>
      <tr><td>Down Screen</td><td>Der Blocksteller läuft Richtung Grundlinie und blockt dort, der Werfer kommt dahinter nach oben zur Dreierlinie.</td></tr>
      <tr><td>Back Screen</td><td>Block im Rücken eines Verteidigers. Der freie Spieler schneidet hinter ihm zum Korb.</td></tr>
      <tr><td>Flare Screen</td><td>Block, der den Werfer vom Ball weg nach außen laufen lässt.</td></tr>
      <tr><td>Stagger</td><td>Zwei Blöcke direkt hintereinander für denselben Spieler.</td></tr>
      <tr><td>Handoff</td><td>Der Ball wird im Vorbeilaufen übergeben, der Übergebende blockt dabei gleich den Verteidiger ab.</td></tr>
    </tbody>
  </table></div>

  <h3>Backdoor: der Schnitt hinter dem Rücken</h3>
  <p>Verteidigt jemand zu aggressiv und stellt sich zwischen seinen Gegenspieler und den Ball, täuscht der Angreifer an, dem Ball entgegenzukommen, und sprintet dann hinter dem Rücken des Verteidigers zum Korb.</p>
  <figure class="abc-fig">
    <div class="abc-panels"><div class="abc-panel"><svg data-fig="backdoor" role="img" aria-label="Spieler 2 auf dem rechten Flügel täuscht einen Schritt nach außen an und schneidet dann hinter seinem Verteidiger, der zu weit vorne steht, zum Korb. Spieler 1 spielt ihm den Ball zu."></svg></div></div>
    <figcaption>Erst die Täuschung nach außen, dann der Schnitt zum Korb. Der Pass kommt oft als Bodenpass.</figcaption>
  </figure>

  <h3>Drive and Kick: Zug zum Korb, Pass nach außen</h3>
  <p>Ein Spieler zieht mit dem Dribbling zum Korb. Hilft ein zweiter Verteidiger aus, ist dessen Gegenspieler frei. Der Pass geht nach außen, oft in die Ecke zum Dreier.</p>
  <figure class="abc-fig">
    <div class="abc-panels"><div class="abc-panel"><svg data-fig="drivekick" role="img" aria-label="Spieler 1 dribbelt von links oben Richtung Korb. Der Verteidiger von Spieler 3 in der linken Ecke hilft aus. Spieler 1 passt zu Spieler 3 in die Ecke, der frei zum Dreier kommt."></svg></div></div>
    <figcaption>Die Zwickmühle der Verteidigung: Hilft niemand, gibt es einen Korbleger. Hilft jemand, wird ein anderer frei.</figcaption>
  </figure>
</section>

<section class="abc-sec" id="abc-pickandroll">
  <span class="abc-kicker">Spieler &amp; Taktik</span>
  <div class="abc-sec-head"><h2>Pick and Roll</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Die wichtigste Aktion im modernen Basketball. In der BBL wird in sehr vielen Angriffen mindestens einmal ein Block für den Ballführer gestellt. Dafür braucht es nur zwei Spieler: den Ballführer und einen Blocksteller, meist den Center.</p>

  <figure class="abc-fig">
    <div class="abc-panels" style="--cols:2">
      <div class="abc-panel"><svg data-fig="pnr1" role="img" aria-label="Schritt 1: Center 5 läuft vom rechten Ellbogen hoch und stellt sich direkt neben den Verteidiger von Point Guard 1."></svg><div class="abc-panel-cap"><span class="abc-n">1</span><span><b>Block stellen.</b> Der Center stellt sich direkt neben den Verteidiger des Ballführers – und bleibt stehen.</span></div></div>
      <div class="abc-panel"><svg data-fig="pnr2" role="img" aria-label="Schritt 2: Point Guard 1 dribbelt eng am Blocksteller vorbei nach rechts, sein Verteidiger bleibt am Block hängen."></svg><div class="abc-panel-cap"><span class="abc-n">2</span><span><b>Um den Block dribbeln.</b> Der Ballführer läuft Schulter an Schulter am Block vorbei, sein Verteidiger bleibt hängen.</span></div></div>
      <div class="abc-panel"><svg data-fig="pnr3" role="img" aria-label="Schritt 3: Center 5 dreht ab und rollt zum Korb, Point Guard 1 passt zu ihm."></svg><div class="abc-panel-cap"><span class="abc-n">3</span><span><b>Abrollen.</b> Der Blocksteller dreht sich ab und läuft zum Korb („Roll“). Der Ballführer wirft selbst, zieht zum Korb oder passt.</span></div></div>
      <div class="abc-panel"><svg data-fig="pnr4" role="img" aria-label="Variante: Pick and Pop. Nach dem Block läuft der Blocksteller nicht zum Korb, sondern nach außen hinter die Dreierlinie und bekommt dort den Pass."></svg><div class="abc-panel-cap"><span class="abc-n">4</span><span><b>Variante Pick and Pop.</b> Statt zum Korb geht der Blocksteller nach außen und wartet auf den Pass zum Wurf.</span></div></div>
    </div>
  </figure>

  <h3>Warum das so gut funktioniert</h3>
  <p>Der Pick and Roll zwingt <strong>zwei Verteidiger</strong>, sich in Sekundenbruchteilen abzusprechen. Gehen beide zum Ball, ist der abrollende Center frei. Bleibt der große Verteidiger hinten, hat der Ballführer freie Bahn. Hilft ein Dritter aus, ist dessen Gegenspieler an der Dreierlinie frei. Und tauschen die Verteidiger, steht plötzlich ein kleiner Guard gegen einen 2,10-Meter-Center unter dem Korb – ein „Mismatch“.</p>

  <h3>Weitere Varianten</h3>
  <ul class="abc-plain">
    <li><strong>Short Roll:</strong> Der Blocksteller rollt nur bis zur Freiwurflinie, fängt dort den Ball und trifft die nächste Entscheidung.</li>
    <li><strong>Slip:</strong> Der Blocksteller täuscht den Block nur an und rennt schon vorher zum Korb.</li>
    <li><strong>Re-Screen:</strong> Der Verteidiger ist unter dem Block durchgeschlüpft? Dann wird einfach noch einmal geblockt, in die andere Richtung.</li>
    <li><strong>Drag Screen:</strong> Pick and Roll direkt aus dem Schnellangriff, bevor die Abwehr sortiert ist.</li>
  </ul>

  <h3>Wie die Verteidigung antwortet</h3>
  <figure class="abc-fig">
    <div class="abc-panels abc-minis" style="--cols:2">
      <div class="abc-panel"><svg data-fig="drop" role="img" aria-label="Drop: Der Verteidiger des Centers bleibt tief an der Freiwurflinie."></svg><div class="abc-panel-cap"><span><b>Drop.</b> Der große Verteidiger bleibt tief und schützt den Korb. Gibt dafür den Wurf aus der Mitteldistanz frei.</span></div></div>
      <div class="abc-panel"><svg data-fig="hedge" role="img" aria-label="Hedge: Der Verteidiger des Centers springt kurz vor den Ballführer."></svg><div class="abc-panel-cap"><span><b>Hedge.</b> Der große Verteidiger springt kurz raus, bremst den Ballführer und läuft dann zurück.</span></div></div>
      <div class="abc-panel"><svg data-fig="switch" role="img" aria-label="Switch: Die beiden Verteidiger tauschen ihre Gegenspieler."></svg><div class="abc-panel-cap"><span><b>Switch.</b> Die Verteidiger tauschen ihre Gegenspieler. Einfach, aber anfällig für Mismatches.</span></div></div>
      <div class="abc-panel"><svg data-fig="blitz" role="img" aria-label="Blitz: Beide Verteidiger gehen gemeinsam auf den Ballführer."></svg><div class="abc-panel-cap"><span><b>Blitz.</b> Beide attackieren den Ballführer. Der Ball muss weg – dahinter spielen die Angreifer vier gegen drei.</span></div></div>
    </div>
    <figcaption>Dazu kommt die Frage, ob der Verteidiger des Ballführers über oder unter dem Block durchgeht. Unter dem Block hindurch spart Weg, gibt aber einen Dreier frei.</figcaption>
  </figure>
  <div class="abc-tip">
    <div class="abc-tip-label">Zum Hinschauen</div>
    <p>Achte beim nächsten Angriff darauf: Wer stellt den Block – und was macht dessen Verteidiger? Nach zwei, drei Angriffen erkennst du, welche Strategie ein Team gewählt hat. Wechselt sie nach einer Auszeit, hat der Trainer reagiert.</p>
  </div>
</section>

<section class="abc-sec" id="abc-spielzuege">
  <span class="abc-kicker">Spieler &amp; Taktik</span>
  <div class="abc-sec-head"><h2>Typische Spielzüge</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Teams haben Dutzende einstudierte Spielzüge („Plays“ oder „Sets“). Der Point Guard sagt sie mit einem Ruf, einer Zahl oder einem Handzeichen an. Die meisten kombinieren dieselben Bausteine: Blöcke, Schnitte und den Pick and Roll.</p>

  <h3>Horns</h3>
  <p>Der Klassiker in Europa. Die beiden Großen stehen an den Ellbogen der Zone, die anderen beiden in den Ecken – von oben sieht das aus wie zwei Hörner. Aus dieser Aufstellung kann der Point Guard mit beiden Großen einen Pick and Roll spielen, und die Ecken bleiben frei für Dreier.</p>
  <figure class="abc-fig">
    <div class="abc-panels" style="--cols:3">
      <div class="abc-panel"><svg data-fig="horns1" role="img" aria-label="Horns-Aufstellung: 1 an der Spitze mit Ball, 4 und 5 an den Ellbogen, 2 und 3 in den Ecken."></svg><div class="abc-panel-cap"><span class="abc-n">1</span><span><b>Aufstellung.</b> Zwei Große an den Ellbogen, zwei Werfer in den Ecken.</span></div></div>
      <div class="abc-panel"><svg data-fig="horns2" role="img" aria-label="5 stellt einen Block für 1, 1 dribbelt nach rechts."></svg><div class="abc-panel-cap"><span class="abc-n">2</span><span><b>Block.</b> Einer der Großen blockt für den Ballführer.</span></div></div>
      <div class="abc-panel"><svg data-fig="horns3" role="img" aria-label="5 rollt zum Korb, 4 geht nach oben an die Dreierlinie. 1 kann zu 5, zu 4 oder zu 2 in der Ecke passen."></svg><div class="abc-panel-cap"><span class="abc-n">3</span><span><b>Optionen.</b> Pass zum Abrollenden, zum zweiten Großen oben oder in die Ecke.</span></div></div>
    </div>
  </figure>

  <h3>Spain Pick and Roll</h3>
  <p>Benannt nach der spanischen Nationalmannschaft, die ihn berühmt gemacht hat. Ein normaler Pick and Roll – aber ein dritter Spieler stellt einen Block gegen den Verteidiger des abrollenden Centers und läuft danach selbst an die Dreierlinie. Die Abwehr muss plötzlich drei Dinge gleichzeitig verteidigen.</p>
  <figure class="abc-fig">
    <div class="abc-panels" style="--cols:2">
      <div class="abc-panel"><svg data-fig="spain1" role="img" aria-label="5 stellt oben einen Block für 1, Spieler 2 wartet in der Zone. 1 dribbelt um den Block."></svg><div class="abc-panel-cap"><span class="abc-n">1</span><span><b>Pick and Roll oben.</b> Spieler 2 wartet dahinter in der Zone.</span></div></div>
      <div class="abc-panel"><svg data-fig="spain2" role="img" aria-label="5 rollt zum Korb, 2 blockt den Verteidiger von 5 und läuft danach nach außen an die Dreierlinie. 1 passt zu 5 oder 2."></svg><div class="abc-panel-cap"><span class="abc-n">2</span><span><b>Block für den Blocker.</b> 2 hält den Verteidiger von 5 auf und läuft dann raus zum Dreier.</span></div></div>
    </div>
  </figure>

  <h3>Floppy</h3>
  <p>Ein Spielzug für einen Werfer. Er startet unter dem Korb und sucht sich aus, auf welcher Seite er sich freiläuft: rechts um einen einzelnen Block, links um einen Doppelblock. Der Verteidiger muss raten – und rät er falsch, gibt es einen freien Wurf.</p>
  <figure class="abc-fig">
    <div class="abc-panels"><div class="abc-panel"><svg data-fig="floppy" role="img" aria-label="Werfer 2 startet unter dem Korb. Links stehen 4 und 3 als Doppelblock, rechts 5 als Einzelblock. 2 läuft um einen der Blöcke zum Flügel, 1 passt ihm den Ball."></svg></div></div>
    <figcaption>Der Werfer entscheidet im Lauf. Genau deshalb ist Floppy so schwer zu verteidigen.</figcaption>
  </figure>

  <h3>Der Schnellangriff</h3>
  <p>Nach einem Rebound oder Ballgewinn zählt jede Sekunde. Der Ball geht schnell nach vorne, die Flügelspieler sprinten weit außen die Seitenlinien entlang und schneiden dann zum Korb, der Ballführer dribbelt durch die Mitte. So entstehen Überzahlsituationen, zwei gegen eins oder drei gegen zwei.</p>
  <figure class="abc-fig">
    <div class="abc-scroll"><svg data-fig="fastbreak" role="img" aria-label="Schnellangriff über das ganze Feld: 5 holt den Rebound am eigenen Korb und passt zu 1 an die Seite. 1 dribbelt durch die Mitte nach vorne, 2 und 3 laufen außen an den Seitenlinien und schneiden zum Korb, 4 folgt als Nachzügler."></svg></div>
    <p class="abc-swipe-hint">Grafik seitlich wischen</p>
    <figcaption>Rebound, erster Pass nach außen („Outlet“), drei Laufbahnen nach vorne. Der Nachzügler („Trailer“) kommt als vierte Option hinterher.</figcaption>
  </figure>

  <h3>Namen, die du hören wirst</h3>
  <div class="abc-tbl"><table>
    <thead><tr><th>Name</th><th>Was dahintersteckt</th></tr></thead>
    <tbody>
      <tr><td>Iso</td><td>Isolation: Ein Spieler bekommt eine ganze Seite für ein 1-gegen-1, die anderen stellen sich weit weg. Typisch in der Schlussphase für den besten Scorer.</td></tr>
      <tr><td>Zipper</td><td>Ein Guard läuft von unten an der Zone entlang nach oben an einem Block vorbei, wie ein Reißverschluss, und bekommt oben den Ball.</td></tr>
      <tr><td>Chicago</td><td>Ein Werfer kommt über einen Down Screen und bekommt direkt danach einen Handoff: zwei Blöcke in einer fließenden Bewegung.</td></tr>
      <tr><td>Hammer</td><td>Ein Spieler zieht auf der Grundlinie zum Korb, gleichzeitig blockt jemand auf der anderen Seite für einen Werfer in der Ecke. Pass quer übers Feld zum Dreier.</td></tr>
      <tr><td>Elevator Doors</td><td>Der Werfer läuft zwischen zwei Mitspielern hindurch, die sich hinter ihm wie Aufzugtüren schließen.</td></tr>
      <tr><td>Pistol</td><td>Früher Angriff aus dem Lauf: Handoff auf dem Flügel und direkt ein Pick and Roll, bevor die Abwehr sortiert ist.</td></tr>
      <tr><td>ATO</td><td>„After Timeout“: ein einstudierter Spielzug direkt nach einer Auszeit, oft für den entscheidenden Wurf.</td></tr>
      <tr><td>BLOB / SLOB</td><td>Einwurf-Spielzüge unter dem gegnerischen Korb (Baseline) oder an der Seitenlinie (Sideline).</td></tr>
    </tbody>
  </table></div>
</section>

<section class="abc-sec" id="abc-verteidigung">
  <span class="abc-kicker">Spieler &amp; Taktik</span>
  <div class="abc-sec-head"><h2>Verteidigung</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Es gibt zwei Grundideen: Jeder deckt einen Gegenspieler (Mann-Mann) oder jeder deckt einen Raum (Zone). Die meisten Teams spielen überwiegend Mann-Mann und streuen Zonen als Überraschung ein.</p>
  <figure class="abc-fig">
    <div class="abc-panels" style="--cols:2">
      <div class="abc-panel"><svg data-fig="man" role="img" aria-label="Mann-Mann-Verteidigung: Jeder Verteidiger steht zwischen seinem Gegenspieler und dem Korb. Der Verteidiger von 4 in der weit entfernten Ecke steht in der Hilfsposition nahe der Zone."></svg><div class="abc-panel-cap"><span><b>Mann-Mann.</b> Jeder hat seinen Gegenspieler. Wer weit weg vom Ball ist, sinkt Richtung Zone ab, um helfen zu können.</span></div></div>
      <div class="abc-panel"><svg data-fig="zone" role="img" aria-label="2-3-Zone: zwei Verteidiger vorne, drei hinten, jeder ist für einen markierten Bereich zuständig."></svg><div class="abc-panel-cap"><span><b>2-3-Zone.</b> Zwei Verteidiger vorne, drei hinten. Jeder verteidigt seinen Bereich, egal wer dort gerade steht.</span></div></div>
    </div>
  </figure>

  <ul class="abc-plain">
    <li><strong>Mann-Mann:</strong> Der Verteidiger steht zwischen Gegenspieler und Korb. Ist sein Mann weit weg vom Ball, steht er in der <strong>Hilfsposition</strong> und kann einem Kollegen aushelfen. Kommt der Pass, sprintet er zurück (<strong>Closeout</strong>).</li>
    <li><strong>Zone:</strong> 2-3, 3-2 oder 1-3-1 – die Zahlen beschreiben die Reihen von vorne nach hinten. Eine Zone macht die Mitte dicht und schützt Spieler mit Foulproblemen. Ihre Schwachstellen: Dreier und Offensivrebounds. Im FIBA-Basketball ist sie ohne Einschränkung erlaubt.</li>
    <li><strong>Presse:</strong> Die Abwehr greift schon in der gegnerischen Hälfte an, oft zu zweit gegen den Ballführer, um Ballverluste und 8-Sekunden-Fehler zu erzwingen. Kostet viel Kraft, kommt oft bei Rückstand.</li>
    <li><strong>Ausblocken (Box-out):</strong> Nach einem Wurf dreht sich jeder Verteidiger zu seinem Gegenspieler und hält ihn mit dem Körper vom Korb weg. Rebounds gewinnt, wer zuerst Position hat, nicht wer am höchsten springt.</li>
    <li><strong>Doppeln:</strong> Zwei Verteidiger gehen gemeinsam auf einen gefährlichen Spieler – meist auf einen starken Center unter dem Korb.</li>
  </ul>
</section>

<section class="abc-sec" id="abc-statistik">
  <span class="abc-kicker">Drumherum</span>
  <div class="abc-sec-head"><h2>Statistik lesen</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Nach jedem Spiel gibt es einen Boxscore – eine Tabelle mit den Werten jedes Spielers. Die Abkürzungen sind meist englisch.</p>
  <div class="abc-tbl"><table>
    <thead><tr><th>Kürzel</th><th>Bedeutung</th></tr></thead>
    <tbody>
      <tr><td>MIN</td><td>Einsatzminuten</td></tr>
      <tr><td>PTS</td><td>Punkte</td></tr>
      <tr><td>FG · 2P · 3P</td><td>Würfe aus dem Spiel, Zweier und Dreier, meist als „Treffer/Versuche“ und Quote, z. B. 4/9 = 44 %</td></tr>
      <tr><td>FT</td><td>Freiwürfe</td></tr>
      <tr><td>REB (OR · DR)</td><td>Rebounds, getrennt nach offensiv (am gegnerischen Korb) und defensiv</td></tr>
      <tr><td>AST</td><td>Assists: Pässe, die direkt zu einem Korb führen</td></tr>
      <tr><td>STL</td><td>Steals: Ballgewinne</td></tr>
      <tr><td>BLK</td><td>Blocks: geblockte Würfe</td></tr>
      <tr><td>TO</td><td>Turnover: Ballverluste</td></tr>
      <tr><td>PF</td><td>Persönliche Fouls</td></tr>
      <tr><td>+/−</td><td>Plus-Minus: um wie viele Punkte das eigene Team besser oder schlechter war, während der Spieler auf dem Feld stand</td></tr>
      <tr><td>EFF</td><td>Effizienz: grob alles Positive (Punkte, Rebounds, Assists, Steals, Blocks) minus Fehlwürfe und Ballverluste – eine Gesamtnote in einer Zahl</td></tr>
    </tbody>
  </table></div>
  <ul class="abc-plain">
    <li><strong>Double-Double:</strong> zweistellige Werte in zwei Kategorien, etwa 15 Punkte und 11 Rebounds. <strong>Triple-Double:</strong> das Gleiche in drei Kategorien – selten und entsprechend gefeiert.</li>
    <li><strong>Grobe Richtwerte:</strong> Eine Wurfquote über 50 Prozent ist stark, bei Dreiern gelten 35 Prozent als ordentlich und 40 als sehr gut. Freiwürfe treffen Profis meist zu 75 bis 85 Prozent.</li>
    <li><strong>Die vier Faktoren:</strong> Spiele entscheiden sich fast immer über dieselben vier Dinge: Wer trifft besser, wer verliert weniger Bälle, wer holt mehr Offensivrebounds, wer kommt öfter an die Freiwurflinie.</li>
  </ul>
</section>

<section class="abc-sec" id="abc-bbl">
  <span class="abc-kicker">Drumherum</span>
  <div class="abc-sec-head"><h2>Die BBL &amp; das Rundherum</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Die easyCredit Basketball Bundesliga ist die höchste deutsche Liga. In der Saison 2026/27 spielen 18 Teams, darunter die Telekom Baskets Bonn.</p>

  <h3>Die Hauptrunde</h3>
  <ul class="abc-plain">
    <li>Jeder spielt zweimal gegen jeden, einmal zu Hause und einmal auswärts: 34 Spieltage, 306 Spiele, von September 2026 bis Mai 2027.</li>
    <li>Die Tabelle richtet sich nach Siegen und Niederlagen. Punkte für Unentschieden gibt es nicht, weil es keine Unentschieden gibt. Bei Gleichstand zählt zuerst der direkte Vergleich.</li>
    <li>Die Plätze 1 bis 6 sind direkt für die Playoffs qualifiziert, die Plätze 7 bis 10 spielen das Play-in, die Plätze 17 und 18 steigen in die zweite Liga (ProA) ab.</li>
  </ul>

  <h3>Play-in: vier Teams, zwei Plätze</h3>
  <div class="abc-bracket">
    <div class="abc-game"><div class="abc-g-t">Spiel A</div><div class="abc-g-m">7. gegen 8.</div><div class="abc-g-r">Der Sieger ist als Nummer 7 in den Playoffs.</div></div>
    <div class="abc-game"><div class="abc-g-t">Spiel B</div><div class="abc-g-m">9. gegen 10.</div><div class="abc-g-r">Der Verlierer hat Saisonende.</div></div>
    <div class="abc-game"><div class="abc-g-t">Spiel C</div><div class="abc-g-m">Verlierer A gegen Sieger B</div><div class="abc-g-r">Der Sieger ist als Nummer 8 in den Playoffs.</div></div>
  </div>

  <h3>Die Playoffs</h3>
  <p>Viertelfinale, Halbfinale und Finale werden jeweils im Modus <strong>„Best of five“</strong> gespielt: Wer zuerst drei Spiele gewinnt, ist weiter. Das besser platzierte Team hat Heimrecht in den Spielen 1, 2 und 5 („2-2-1“). Im Viertelfinale treffen sich:</p>
  <div class="abc-pairs">
    <div class="abc-pair">1 – 8<small>Viertelfinale</small></div>
    <div class="abc-pair">4 – 5<small>Viertelfinale</small></div>
    <div class="abc-pair">2 – 7<small>Viertelfinale</small></div>
    <div class="abc-pair">3 – 6<small>Viertelfinale</small></div>
  </div>
  <p>Deutscher Meister 2026 wurde <strong>ALBA BERLIN</strong> – mit einem 3:2 im Finale gegen den FC Bayern München. Im entscheidenden fünften Spiel in München lag Berlin zur Halbzeit mit 20 Punkten hinten und gewann noch 84:81.</p>

  <h3>Pokal und Europa</h3>
  <ul class="abc-plain">
    <li><strong>Netto BBL Pokal:</strong> K.-o.-Wettbewerb der BBL-Teams, entschieden bei einem Finalturnier (Final Four).</li>
    <li><strong>Europapokal:</strong> Die stärksten Klubs spielen zusätzlich international – in der EuroLeague (die europäische Topliga), im EuroCup, in der Basketball Champions League (BCL) oder im FIBA Europe Cup. Bonn spielt in der BCL, die die Baskets 2023 gewonnen haben.</li>
    <li><strong>Doppelbelastung:</strong> Europapokalspiele finden meist unter der Woche statt. Wer dienstags oder mittwochs international spielt und am Wochenende in der BBL, hat wenig Pause und viel Reisestress.</li>
    <li><strong>Zuschauen:</strong> Alle BBL-Spiele laufen live beim Streamingdienst Dyn. Den Live-Ticker auf easycredit-bbl.de verlinkt diese App bei laufenden Spielen direkt auf der Übersicht.</li>
  </ul>
</section>

<section class="abc-sec" id="abc-nba">
  <span class="abc-kicker">Drumherum</span>
  <div class="abc-sec-head"><h2>FIBA oder NBA?</h2><div class="abc-sec-rule"></div></div>
  <p>Wer NBA schaut, merkt schnell: Das ist fast derselbe Sport, aber nicht ganz. Die BBL spielt nach FIBA-Regeln, die NBA hat eigene.</p>
  <div class="abc-tbl"><table>
    <thead><tr><th></th><th>FIBA · BBL</th><th>NBA</th></tr></thead>
    <tbody>
      <tr><td>Spielzeit</td><td class="abc-num-cell">4 × 10 Minuten</td><td class="abc-num-cell">4 × 12 Minuten</td></tr>
      <tr><td>Verlängerung</td><td class="abc-num-cell">5 Minuten</td><td class="abc-num-cell">5 Minuten</td></tr>
      <tr><td>Spielfeld</td><td class="abc-num-cell">28 × 15 m</td><td class="abc-num-cell">28,65 × 15,24 m</td></tr>
      <tr><td>Dreierlinie</td><td class="abc-num-cell">6,75 m (Ecke 6,60 m)</td><td class="abc-num-cell">7,24 m (Ecke 6,71 m)</td></tr>
      <tr><td>Fouls bis zum Ausscheiden</td><td class="abc-num-cell">5</td><td class="abc-num-cell">6</td></tr>
      <tr><td>Freiwürfe wegen Teamfouls</td><td>ab dem 5. Teamfoul im Viertel</td><td>ab dem 5. Teamfoul, in den letzten zwei Minuten eines Viertels schon ab dem 2.</td></tr>
      <tr><td>Verteidiger in der Zone</td><td>unbegrenzt</td><td>höchstens 3 Sekunden ohne direkten Gegenspieler</td></tr>
      <tr><td>Auszeiten pro Team</td><td class="abc-num-cell">5 (2 + 3)</td><td class="abc-num-cell">7</td></tr>
    </tbody>
  </table></div>
  <p>Kurz gesagt: FIBA-Spiele sind kürzer, die Dreierlinie ist näher, und weil Verteidiger in der Zone stehen bleiben dürfen, ist der Weg zum Korb enger.</p>
</section>

<section class="abc-sec" id="abc-tippen">
  <span class="abc-kicker">Drumherum</span>
  <div class="abc-sec-head"><h2>Fürs Tippen</h2><div class="abc-sec-rule"></div></div>
  <p class="abc-lead">Keine Garantie auf Punkte – aber ein paar Dinge, die beim Sieger-Tipp helfen können.</p>
  <div class="abc-cards">
    <div class="abc-card abc-soft"><h4>Verlängerung zählt</h4><p>Es gibt kein Unentschieden. Dein Tipp wird mit dem Endergebnis nach einer möglichen Verlängerung gewertet.</p></div>
    <div class="abc-card abc-soft"><h4>Heimvorteil</h4><p>Heimteams gewinnen spürbar häufiger als Gäste: vertrauter Korb, keine Reise, lautes Publikum. Ein Automatismus ist das aber nicht.</p></div>
    <div class="abc-card abc-soft"><h4>Rückstände sind nichts</h4><p>Basketball lebt von Läufen: Ein 10:0 in drei Minuten ist normal. ALBA hat 2026 das fünfte Finalspiel nach 20 Punkten Halbzeitrückstand gewonnen.</p></div>
    <div class="abc-card abc-soft"><h4>Ausfälle wiegen schwer</h4><p>Nur fünf Spieler stehen auf dem Feld, acht bis zehn spielen regelmäßig. Fehlt der Spielmacher oder der Center, fehlt oft ein ganzer Baustein.</p></div>
    <div class="abc-card abc-soft"><h4>Europapokal-Woche</h4><p>Wer unter der Woche international gespielt hat und dann auswärts antreten muss, geht mit müden Beinen ins Spiel.</p></div>
    <div class="abc-card abc-soft"><h4>Playoffs</h4><p>Im Best-of-five hat das besser platzierte Team drei mögliche Heimspiele. Für den einzelnen Tipp zählt trotzdem jedes Spiel für sich.</p></div>
  </div>
</section>

<section class="abc-sec" id="abc-glossar">
  <span class="abc-kicker">Drumherum</span>
  <div class="abc-sec-head"><h2>Glossar</h2><div class="abc-sec-rule"></div></div>
  <p>Die Begriffe, die du in Übertragungen, Live-Tickern und in der Halle am häufigsten hörst.</p>
  <dl class="abc-gloss">
    <div><dt>Alley-Oop</dt><dd>Hoher Pass an den Korb, den ein Mitspieler in der Luft fängt und direkt verwertet – meist per Dunk.</dd></div>
    <div><dt>And-One</dt><dd>Korb trotz Foul: Die Punkte zählen, dazu gibt es einen Freiwurf.</dd></div>
    <div><dt>Assist</dt><dd>Pass, der direkt zu einem Korb führt.</dd></div>
    <div><dt>Backcourt</dt><dd>Das Rückfeld – oder die Guards eines Teams.</dd></div>
    <div><dt>Backdoor</dt><dd>Schnitt hinter dem Rücken des Verteidigers zum Korb.</dd></div>
    <div><dt>Big</dt><dd>Sammelbegriff für die großen Spieler, also Positionen 4 und 5.</dd></div>
    <div><dt>Block</dt><dd>Entweder einen Wurf wegschlagen oder einem Verteidiger den Weg versperren („Block stellen“).</dd></div>
    <div><dt>Box-out</dt><dd>Ausblocken: den Gegner beim Rebound mit dem Körper vom Korb fernhalten.</dd></div>
    <div><dt>Buzzer Beater</dt><dd>Wurf, der mit der Schlusssirene fällt.</dd></div>
    <div><dt>Closeout</dt><dd>Ein Verteidiger sprintet zu einem freien Werfer, um den Wurf zu stören.</dd></div>
    <div><dt>Crunchtime</dt><dd>Die entscheidende Schlussphase. Wer dort trifft, gilt als „clutch“.</dd></div>
    <div><dt>Cut</dt><dd>Schnitt: schneller Laufweg ohne Ball, meist Richtung Korb.</dd></div>
    <div><dt>Double-Double</dt><dd>Zweistellige Werte in zwei Statistik-Kategorien.</dd></div>
    <div><dt>Dunk</dt><dd>Der Ball wird von oben in den Korb gestopft.</dd></div>
    <div><dt>Fastbreak</dt><dd>Schnellangriff, bevor die Verteidigung steht.</dd></div>
    <div><dt>Floater</dt><dd>Hoher, weicher Wurf aus dem Lauf über große Verteidiger hinweg.</dd></div>
    <div><dt>Flopping</dt><dd>Ein Foul vortäuschen, sich theatralisch fallen lassen. Wird mit einem technischen Foul bestraft.</dd></div>
    <div><dt>Garbage Time</dt><dd>Die letzten Minuten eines entschiedenen Spiels, in denen die Bankspieler ran dürfen.</dd></div>
    <div><dt>Handoff</dt><dd>Übergabe des Balls im Vorbeilaufen.</dd></div>
    <div><dt>Help Defense</dt><dd>Ein Verteidiger hilft einem Mitspieler aus, dessen Gegenspieler zum Korb zieht.</dd></div>
    <div><dt>Iso</dt><dd>Isolation: ein 1-gegen-1 mit viel Platz.</dd></div>
    <div><dt>Korbleger</dt><dd>Wurf aus dem Lauf direkt am Korb, meist übers Brett (Layup).</dd></div>
    <div><dt>Mismatch</dt><dd>Ungleiches Duell, etwa ein Center gegen einen kleinen Guard.</dd></div>
    <div><dt>Nullschritt</dt><dd>Der Schritt, in dem man den Ball im Laufen aufnimmt. Er zählt nicht zu den zwei erlaubten Schritten.</dd></div>
    <div><dt>Paint</dt><dd>Die Zone vor dem Korb.</dd></div>
    <div><dt>Pick</dt><dd>Anderes Wort für einen Block, der gestellt wird (Screen).</dd></div>
    <div><dt>Post-up</dt><dd>Mit dem Rücken zum Korb nahe der Zone den Ball fordern.</dd></div>
    <div><dt>Rebound</dt><dd>Einen Abpraller nach einem Fehlwurf sichern, offensiv oder defensiv.</dd></div>
    <div><dt>Run</dt><dd>Lauf: eine Serie von Punkten ohne Gegenpunkte, etwa „ein 12:0-Lauf“.</dd></div>
    <div><dt>Sechster Mann</dt><dd>Der beste Bankspieler, meist der Erste, der eingewechselt wird.</dd></div>
    <div><dt>Spacing</dt><dd>Die Abstände der Angreifer zueinander.</dd></div>
    <div><dt>Steal</dt><dd>Ballgewinn durch Abfangen oder Wegspitzeln.</dd></div>
    <div><dt>Swish</dt><dd>Treffer, der weder Ring noch Brett berührt.</dd></div>
    <div><dt>Switch</dt><dd>Zwei Verteidiger tauschen ihre Gegenspieler.</dd></div>
    <div><dt>Transition</dt><dd>Die Umschaltphase von Verteidigung auf Angriff und umgekehrt.</dd></div>
    <div><dt>Triple-Double</dt><dd>Zweistellige Werte in drei Statistik-Kategorien.</dd></div>
    <div><dt>Turnover</dt><dd>Ballverlust, ohne dass geworfen wurde.</dd></div>
    <div><dt>Zone</dt><dd>Die Fläche vor dem Korb – oder eine Raumverteidigung.</dd></div>
  </dl>
</section>

<footer class="abc-foot">
  <p>Stand: Oktober 2026. Regeln nach den <a href="https://about.fiba.basketball/en/news/fiba-official-basketball-rules-2026-to-take-effect-october-1" target="_blank" rel="noopener">FIBA Official Basketball Rules 2026</a>, die ab 1. Oktober 2026 gelten und in der BBL angewendet werden. Liga-Infos von <a href="https://www.easycredit-bbl.de" target="_blank" rel="noopener">easycredit-bbl.de</a>. Größen, Quoten und Punktzahlen sind Richtwerte, keine offiziellen Zahlen. Die Grafiken sind vereinfacht, aber maßstabsgetreu.</p>
</footer>
`;
