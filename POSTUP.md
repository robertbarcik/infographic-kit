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
