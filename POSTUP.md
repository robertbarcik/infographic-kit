# Ako robiť infografiky opakovane a v rovnakom štýle

Zhrnutie experimentu z 29. 9. 2026. Cieľ: stránky v štýle referencií od študenta,
ktoré sa dajú vyrobiť kedykoľvek znova, bez externého API na obrázky.

## Hlavná myšlienka

Štýl žije v kóde, obsah v dátach. Nikdy sa nemiešajú.

```
specs/tema.json   len obsah: texty, názvy komponentov, názvy ikon, sémantické roly
engine/           pevný: šablóna, farby, komponenty, ikony, postavičky, merač
out/              HTML + PNG + PDF + report z merača
```

- Spec nesmie obsahovať farby, veľkosti, súradnice ani surové SVG. Validátor ich odmietne.
- Rovnaký spec dá vždy rovnaký obrázok (overené kontrolným súčtom).
- Ak stránke niečo chýba, opraví sa engine pre všetky stránky. Nikdy jedna stránka ručne.

## Ako sa to skladá: hybrid deterministického a stochastického systému

Kit je hybrid: deterministický engine (predkreslené diely, pevné pravidlá) a stochastický
LLM (vie vziať akúkoľvek tému). Skladá sa z troch vrstiev a hranica medzi nimi je jeden
JSON súbor.

### 1. Deterministická vrstva: engine

Všetko, čo má vyzerať rovnako na každej stránke, je napísané raz v kóde:

- **Assety:** vyše 100 ikon ako SVG v jednom štýle, postavička ako parametrická kresba
  (vlasy, pleť, tričko, výraz, póza, rekvizita sú len enumy), dve písma.
- **Komponenty:** `dialogue`, `steps`, `compare`, `command`, `commit-graph` a ďalšie.
  Každý má v kóde schému polí, limity dĺžky textu a vykresľovanie.
- **Štýl:** farby, hrúbky čiar, rozstupy, efekt ručnej kresby (rough.js s pevným seedom,
  takže rovnaký vstup dá rovnaké pixely).
- **Merač:** po vykreslení sa stránka zmeria v prehliadači. Pri pretečení, prekryve, malom
  písme alebo zle mierenej bubline padne s chybou.

Táto vrstva je čistá funkcia: JSON dnu, PNG a PDF von, bez náhody.

### 2. Stochastická vrstva: LLM ako autor obsahu

Model dostane tému, `AUTHORING.md` (generuje sa z enginu, takže presne popisuje, čo engine
vie) a jednu hotovú stránku ako príklad. Jeho úlohou je vybrať komponenty, vymyslieť
analógiu, napísať texty a vyplniť JSON:

```json
{ "component": "dialogue", "role": "example",
  "a": { "name": "Mila", "look": { "hair": "bun", "holding": "bookmark" } },
  "turns": [ { "who": "a", "says": "I want to try the soup with chili." } ] }
```

Tu je celá kreativita: téma, analógia, výber komponentov, text, postavička. Model ale
nemôže napísať farbu, veľkosť písma, SVG ani HTML. Schéma to zakáže a validátor odmietne.
Štýl sa tak nedá rozbiť, nech je téma akákoľvek.

### 3. Spojivo: schéma a slučka opráv

Tá istá schéma slúži trom veciam naraz: generuje sa z nej návod pre model, validuje sa ňou
jeho výstup a engine podľa nej kreslí. Vrstvy sa preto nemôžu rozísť.

Pracovná slučka:

1. Model napíše JSON.
2. Engine vyrenderuje a merač povie napríklad "bublina 3 pretečie o 2 riadky".
3. Model skráti text (engine písmo nezmenší) a skúsi znova.
4. Ak modelu chýba niečo, čo engine nevie (napríklad ikona poklopu na jedlo), nahlási to.
   Oprava ide do enginu pre všetky stránky, nikdy do jednej stránky.

Štvrtý bod je presne to, čo v predošlom pokuse chýbalo: agent lepil jednorazové záplaty do
stránok. Tu má autor stránky do enginu zakázaný prístup.

### Kde je ktorá inteligencia

| Rozhodnutie | Kto |
|---|---|
| čo je na stránke, aká analógia, aký text, aké postavy | LLM |
| ako to vyzerá, kde to stojí, akou farbou, akým písmom | kód |
| či sa to zmestí a neprekrýva | merač (kód) |
| či je to pravda a či to znie prirodzene | človek alebo druhý LLM, merač to nevie |

Prirovnanie: noviny. Redaktor píše článok do šablóny, grafiku novín neurčuje. LLM je
redaktor, engine je sadzba. Preto to funguje bez obrázkového modelu: obrázky nevznikajú
generovaním pixelov, ale skladaním hotových kreslených dielov podľa toho, čo model napíše
do JSON.

## Prečo predošlý pokus zlyhal a čo je tu inak

| Problém | Riešenie v tomto kite |
|---|---|
| Rastrový generátor po 4. stránke ušiel od štýlu | Obrázok kreslí kód, model píše len obsah |
| Agent lepil chyby jednorazovo | Autor stránky nemá právo meniť engine, medzeru len nahlási |
| Registre komponentov sa rozchádzali | `AUTHORING.md` sa generuje z kódu enginu |
| Nikto nemeral výsledok | Merač zlyhá pri pretečení, prekryve, malom písme, prázdnom mieste |
| Text znel strojovo | Pravidlá obsahu + príklady hotových stránok namiesto opisu štýlu |

## Roly

1. **Koordinátor** (silnejší model): píše zadanie, pozerá každý render, zbiera medzery,
   rozhoduje, čo ide do enginu.
2. **Staviteľ enginu** (jeden agent, drží kontext cez všetky kolá): mení len `engine/`.
3. **Autori stránok** (jeden agent na stránku, paralelne): menia len svoj spec.
4. **Kontrolór faktov** (číta, nič nemení): overuje tvrdenia proti zdrojom.

## Postup pri novej stránke

1. Zvoľ jednu myšlienku a analógiu z bežného života.
2. Prečítaj `AUTHORING.md`, najmä časť o kapacite stránky.
3. Napíš `specs/NN-tema.json`.
4. `node engine/render.mjs specs/NN-tema.json`
5. Oprav chyby, ktoré vypíše merač. Pri pretečení skracuj, nezmenšuj.
6. Otvor PNG a pozri sa naň. Merač nevidí zmysel, tón ani to, či ikona sedí.
7. Daj fakty skontrolovať niekomu, kto stránku nepísal.

## Čo sa osvedčilo

- Prvá verzia stránok bola hustá (písmo 17 px). Pomohla tvrdá spodná hranica písma v
  engine. Autori potom museli krátiť a stránky sú vzdušnejšie.
- Päť autorov nezávisle narazilo na tie isté medzery enginu. To je dobrý signál, čo
  naozaj treba doplniť.
- Postavička, ktorá drží predmet (list, pas, tácku), urobí analógiu čitateľnou bez textu.
- Kontrola faktov našla jednu vec, ktorú by študent hneď zistil: príkaz `curl` bez `-i`
  nevypíše stavový kód, hoci ho stránka sľubovala.

## Čo merač nevie

- Či je tvrdenie pravdivé a či text znie prirodzene.
- Či ikona zodpovedá významu.
- Či je stránka vizuálne vyvážená.

Preto sa každá stránka na konci pozerá očami.

## Známe slabiny (stav 29. 9. 2026)

- Terminálový blok používa rukopisné písmo, nie neproporcionálne.
- Vo fast-forward grafe (stránka 05) ide prerušovaná šípka okľukou.
- Keď je sekcia nižšia než susedná, môže v nej ostať prázdny pás (05 "Look for yourself",
  00 "A box is not a role").
- Kontrola faktov stiahla len časť zdrojov (RFC 9110, dokumentácia Docker Desktop).
  Ostatné overila zo znalosti RFC, nie zo stiahnutého textu.
- Keď pracuje viac autorov naraz, pomocné výrezy si majú ukladať pod vlastným názvom.
