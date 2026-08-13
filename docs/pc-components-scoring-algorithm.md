# PC Components Scoring Algorithm — Spec v1

Categorie coperte: **RAM**, **Scheda Madre**, **CPU**, **GPU**, **Alimentatore**.

## Panoramica

Ogni categoria produce, come Monitor e Frullatore:

- **N punteggi Performance** (0–100), uno per dimensione della categoria
- **1 punteggio Overall**, media pesata delle dimensioni in base ai casi d'uso selezionati
- **Gli stessi punteggi in versione Qualità/Prezzo**, ottenuti moltiplicando per il price multiplier

| Categoria | Dimensioni |
|---|---|
| RAM | Gaming, Produttività, Overclock, Compatibilità |
| Scheda Madre | Gaming, Produttività/Espandibilità, Overclock, Connettività |
| CPU | Gaming, Produttività, Efficienza, Overclock |
| GPU | Gaming (raster), Ray tracing, Creazione/AI, Efficienza, Compattezza |
| Alimentatore | Potenza/Headroom, Efficienza, Silenziosità, Affidabilità, Compattezza |

---

## Come viene scorato un singolo fattore

Tre meccanismi, scelti in base alla natura del dato.

### 1. Specifiche numeriche → punteggio relativo al dataset

Come per i frullatori (piano 003), non esistono soglie fisse: un valore vale
quanto vale **rispetto agli altri prodotti della stessa categoria** nel database.
Il punteggio è la media di due componenti:

```
percentile = (prodotti peggiori o uguali / totale) × 100
ratio      = valore / valore_migliore × 100        (metriche "più è meglio")
ratio      = valore_migliore / valore × 100        (metriche "meno è meglio")

score = (percentile + clamp(ratio, 0, 100)) / 2
```

Il percentile da solo, con pochi prodotti in database, trasforma uno scarto del
3% in 30 punti di differenza; il ratio conserva la distanza reale. Nessuna
soglia viene codificata, quindi i punteggi restano validi al variare
dell'hardware sul mercato.

Le metriche invertite (`meno è meglio`) sono: latenza reale della RAM, altezza dei
moduli, tensione, TDP e consumo, alimentatore consigliato, lunghezza e slot della
GPU, rumorosità e profondità dell'alimentatore.

**Metriche derivate**: alcuni fattori non sono campi ma calcoli, perché i singoli
campi presi da soli non dicono nulla.

| Metrica | Formula | Categoria |
|---|---|---|
| Latenza reale (ns) | `CL × 2000 / frequenza` | RAM |
| Banda memoria (GB/s) | `bus × velocità / 8` | GPU |
| Performance per watt | `benchmark / consumo` | CPU, GPU |
| Consumo reale | `consumo massimo` se presente, altrimenti `TDP` | CPU |
| Core totali | `core prestazionali + core efficienti` | CPU |
| Core utili al gaming | `min(core totali, 8)` | CPU |
| Porte USB | `porte posteriori + porte USB-C` | Scheda Madre |

### 2. Specifiche a livelli intrinseci → tabella di mapping

Dove la gerarchia è nella tecnologia stessa e non nel dataset, si usa una tabella
fissa (primo match vincente, case-insensitive).

| Spec | Livelli |
|---|---|
| Tipo memoria RAM | DDR5 100 · DDR4 60 · DDR3 25 |
| Profilo OC RAM | XMP+EXPO 100 · EXPO/XMP 85 · No 0 |
| PCIe | 5.0 100 · 4.0 75 · 3.0 40 |
| Chipset | serie W/TRX/WRX e X/Z con suffisso E 100 · X/Z 90 · B 70 · H/A 45 |
| Wi-Fi | 7 100 · 6E 88 · 6 75 · 5 55 · No 0 |
| Rete cablata | 10 GbE 100 · 5 GbE 88 · 2.5 GbE 75 · 1 GbE 45 |
| Codec audio | ESS/ALC4082 100 · ALC4080 92 · ALC12xx 80 · ALC1150 68 · ALC89x 50 |
| Formato mobo | ATX/E-ATX 100 · Micro-ATX 70 · Mini-ITX 45 |
| Tipo VRAM | HBM/GDDR7 100 · GDDR6X 85 · GDDR6 70 · GDDR5 40 |
| Ray tracing | 4ª gen 100 · 3ª gen 85 · 2ª gen 70 · Sì 55 · No 0 |
| Upscaling | DLSS4/FSR4/XeSS2 100 · DLSS3/FSR3 85 · generico 70 · No 0 |
| 80 Plus | Titanium 100 · Platinum 92 · Gold 80 · Silver 65 · Bronze 55 · White 40 · No 20 |
| Standard ATX | 3.1 100 · 3.0 85 · 2.x 50 |
| Modularità | Full 100 · Semi 65 · Non modulare 30 |
| Cuscinetto ventola | Levitazione magnetica 100 · FDB 92 · Rifle 80 · Ball 65 · Sleeve 40 |
| Formato PSU | SFX 100 · SFX-L/TFX 85 · ATX 50 |

Il formato scheda madre premia ATX perché la dimensione conta per VRM e
dissipazione; il formato PSU premia SFX perché lì la dimensione è l'obiettivo.

### 3. Sì/No e liste → flag e conteggi

Un campo affermativo vale 100, un "No" esplicito vale 0, un campo vuoto resta
`null` e non entra nella media. Le liste (es. protezioni dell'alimentatore) sono
normalizzate sul numero massimo di elementi visto nella categoria.

**Campi mancanti**: il peso di un fattore senza valore viene ridistribuito sugli
altri, esattamente come per i monitor. Un prodotto con specifiche parziali non
viene penalizzato, ma non guadagna nemmeno punti.

---

## Pesi per categoria

I pesi sono su base 100 per ogni dimensione.

### RAM

| Fattore | Gaming | Produttività | Overclock | Compatibilità |
|---|---|---|---|---|
| Latenza reale (ns) | 30 | 12 | 20 | — |
| Frequenza | 25 | 18 | 30 | — |
| Capacità | 20 | 40 | — | — |
| Tipo memoria | 15 | 10 | — | — |
| Profilo XMP/EXPO | 10 | — | 20 | 15 |
| Layout moduli | — | 10 | — | 20 |
| Supporto ECC | — | 10 | — | — |
| Dissipatore | — | — | 15 | — |
| Tensione (bassa) | — | — | 15 | 20 |
| Altezza (bassa) | — | — | — | 35 |
| Garanzia | — | — | — | 10 |

La latenza reale pesa più della frequenza nuda: 6000 CL30 (10 ns) batte 6400 CL36
(11,25 ns) nonostante la frequenza inferiore. Nel layout moduli 2 stick valgono
100 (dual channel senza stressare il memory controller), 4 valgono 75 in
produttività ma 55 in compatibilità.

### Scheda Madre

| Fattore | Gaming | Produttività | Overclock | Connettività |
|---|---|---|---|---|
| Fasi VRM | 18 | — | 33 | — |
| PCIe | 22 | — | — | — |
| Chipset | 15 | — | 22 | — |
| Slot M.2 | 15 | 20 | — | — |
| Frequenza memoria max | 15 | — | 22 | — |
| Codec audio | 8 | — | — | 10 |
| Wi-Fi | 7 | — | — | 20 |
| Memoria massima | — | 15 | — | — |
| Porte USB | — | 15 | — | 25 |
| Slot PCIe x16 | — | 13 | — | — |
| Rete cablata | — | 13 | — | 20 |
| Porte SATA | — | 12 | — | — |
| Slot memoria | — | 12 | — | — |
| Formato | — | — | 13 | — |
| BIOS Flashback | — | — | 10 | — |
| Porte USB-C | — | — | — | 20 |
| Header ventole | — | — | — | 5 |

### CPU

| Fattore | Gaming | Produttività | Efficienza | Overclock |
|---|---|---|---|---|
| Benchmark single-core | 30 | — | — | 18 |
| Cache L3 | 27 | 10 | — | — |
| Clock boost | 13 | — | — | 22 |
| Core (max 8 per il gaming) | 10 | 22 | — | — |
| Memoria supportata | 10 | 8 | — | — |
| PCIe | 10 | — | — | — |
| Benchmark multi-core | — | 40 | — | — |
| Thread | — | 15 | — | — |
| Linee PCIe | — | 5 | — | — |
| Performance per watt | — | — | 50 | — |
| TDP (basso) | — | — | 25 | — |
| Litografia (bassa) | — | — | 15 | 15 |
| Consumo reale (basso) | — | — | 10 | — |
| Moltiplicatore sbloccato | — | — | — | 30 |
| Margine di potenza (alto) | — | — | — | 15 |

Due scelte di modello: la cache L3 pesa quasi quanto il single-core perché è il
maggior discriminante nel gaming fra CPU moderne (effetto X3D), e i core oltre
l'ottavo non aumentano il punteggio gaming perché i giochi non li usano.

I campi benchmark sono opzionali ma sono i fattori più pesanti dove presenti:
senza di essi il punteggio si regge su core, clock e cache, che sono indicatori
più deboli. Conviene compilarli con una fonte omogenea (es. Cinebench R23 per
tutte le CPU, 3DMark Time Spy per tutte le GPU).

### GPU

| Fattore | Gaming | Ray tracing | Creazione/AI | Efficienza | Compattezza |
|---|---|---|---|---|---|
| Benchmark 3D | 40 | 30 | 20 | — | — |
| Banda memoria | 18 | 12 | 20 | — | — |
| Unità di shading | 14 | — | 10 | — | — |
| VRAM | 13 | 18 | 40 | — | — |
| Clock boost | 10 | — | — | — | — |
| PCIe | 5 | — | — | — | — |
| Ray tracing | — | 25 | — | — | — |
| Upscaling | — | 15 | — | — | — |
| Tipo VRAM | — | — | 10 | — | — |
| Performance per watt | — | — | — | 55 | — |
| TDP (basso) | — | — | — | 25 | 15 |
| PSU consigliato (basso) | — | — | — | 20 | 15 |
| Lunghezza (bassa) | — | — | — | — | 40 |
| Slot occupati (pochi) | — | — | — | — | 30 |

La VRAM domina in Creazione/AI perché è il vincolo che decide cosa riesci a
caricare, non quanto va veloce.

### Alimentatore

| Fattore | Potenza | Efficienza | Silenziosità | Affidabilità | Compattezza |
|---|---|---|---|---|---|
| Potenza (W) | 45 | — | — | — | — |
| Connettori 12V-2x6 | 20 | — | — | — | — |
| Connettori PCIe | 20 | — | — | — | — |
| Connettori SATA | 15 | — | — | — | — |
| Certificazione 80 Plus | — | 65 | — | 20 | — |
| Standard ATX | — | 20 | — | — | — |
| Condensatori giapponesi | — | 15 | — | 16 | — |
| Rumorosità (bassa) | — | — | 35 | — | — |
| Modalità zero RPM | — | — | 30 | — | — |
| Diametro ventola | — | — | 20 | — | — |
| Cuscinetto ventola | — | — | 15 | 12 | — |
| Garanzia | — | — | — | 32 | — |
| Protezioni | — | — | — | 20 | — |
| Profondità (bassa) | — | — | — | — | 45 |
| Formato | — | — | — | — | 35 |
| Modularità | — | — | — | — | 20 |

La garanzia è il proxy più onesto dell'affidabilità: è il produttore stesso a
scommettere sulla durata del prodotto.

---

## Casi d'uso → Overall

L'Overall è la media delle dimensioni pesata sui casi d'uso selezionati. Senza
casi d'uso selezionati è la media semplice di tutte le dimensioni.

| Categoria | Caso d'uso | Mapping |
|---|---|---|
| RAM | Gaming / Produttività / Overclock / Build compatta | 100% sulla dimensione omonima |
| RAM | Workstation | Produttività 80%, Compatibilità 20% |
| Scheda Madre | Gaming / Produttività / Overclock / Connettività | 100% sulla dimensione omonima |
| Scheda Madre | Workstation | Produttività 70%, Connettività 30% |
| CPU | Gaming / Produttività / Efficienza / Overclock | 100% sulla dimensione omonima |
| CPU | Workstation | Produttività 80%, Efficienza 20% |
| GPU | Gaming / Ray tracing / Creazione-AI / Efficienza / Build compatta | 100% sulla dimensione omonima |
| Alimentatore | Build high-end | Potenza 100% |
| Alimentatore | Efficienza / Silenziosità / Affidabilità / Build compatta | 100% sulla dimensione omonima |

Di conseguenza l'Overall risponde a "quanto è adatto **all'uso che ne farai**",
non a "quanto è potente in assoluto": una GPU compatta marcata "Build compatta"
può avere Overall più alto di una GPU top marcata "Gaming". Per confronti di
potenza pura vanno lette le singole dimensioni.

---

## Qualità/Prezzo

Identico a Monitor e Frullatore:

```
QP(dimensione) = clamp(Performance(dimensione) × PriceMultiplier, 0, 100)
PriceMultiplier = clamp(PrezzoMediano / Prezzo, 0.3, 2.0)
```

`PrezzoMediano` è la mediana dei prezzi della **stessa categoria** in database.
Default in assenza di dati: RAM 100 €, Scheda Madre 200 €, CPU 300 €, GPU 500 €,
Alimentatore 120 €.

---

## Limiti noti

- Con un solo prodotto in categoria tutti i fattori relativi valgono 100: i
  punteggi diventano informativi solo da 2–3 prodotti in su.
- Il punteggio valuta le specifiche dichiarate, non il comportamento reale:
  qualità dei VRM, binning del silicio o ripple dell'alimentatore non emergono
  dalla scheda tecnica. I campi benchmark sono il modo per introdurre dati reali.

---

## Note implementative

- Un modulo per categoria in `frontend/src/lib/scoring/`, più `helpers.ts` con le
  primitive condivise (`rankBy`, `tierScore`, `flagScore`, `composeOverall`,
  `priceMultiplier`).
- Ogni modulo esporta le proprie dimensioni e una `calc<Categoria>Scores(product, peers)`
  dove `peers` sono i prodotti della stessa categoria.
- `registry.ts` associa categoria → dimensioni + funzione di calcolo. Riga
  prodotto, tabella di confronto e ordinamenti leggono da lì: aggiungere una
  categoria non richiede modifiche alla UI.
