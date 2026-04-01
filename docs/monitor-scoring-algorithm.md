# Monitor Scoring Algorithm — Spec v1

## Panoramica

L'algoritmo calcola **8 punteggi** per ogni monitor:

- **4 punteggi Performance** (0–100): qualità pura, senza considerare il prezzo
  - Coding
  - Gaming
  - Grafica
  - Overall (media pesata dei precedenti, basata sui casi d'uso selezionati)

- **4 indici Qualità/Prezzo** (0–100): performance normalizzata sul prezzo
  - Coding Q/P
  - Gaming Q/P
  - Grafica Q/P
  - Overall Q/P

---

## Fattori e pesi per categoria

Ogni fattore ha un peso diverso per ciascun caso d'uso. I pesi sono espressi su base 100.

| Fattore | Coding | Gaming | Grafica | Motivazione |
|---|---|---|---|---|
| Risoluzione | 30 | 10 | 20 | Coding: densità pixel per leggibilità testo. Grafica: spazio di lavoro e dettaglio. Gaming: bello ma pesa sulla GPU, meno prioritario. |
| Dimensione (pollici) | 12 | 12 | 10 | Va letto in rapporto alla risoluzione (PPI). 27" 4K è il sweet spot per coding/grafica. Per gaming, schermi grandi = più immersione. |
| Tipo pannello | 8 | 15 | 18 | Coding: serve angolo di visione decente (IPS ok). Gaming: OLED/QD-OLED per contrasto e tempi risposta. Grafica: accuratezza colore e contrasto sono critici. |
| Refresh rate | 10 | 25 | 3 | Gaming: fattore dominante (144Hz min, 240Hz competitivo). Coding: 120Hz+ migliora lo scrolling. Grafica: irrilevante. |
| Tempo di risposta | 5 | 18 | 2 | Gaming: cruciale per ghosting/motion blur. Coding/Grafica: impercettibile. |
| Gamut colore | 5 | 5 | 25 | Grafica: fattore più critico (99% sRGB min, 95%+ DCI-P3 ideale). Coding: irrilevante. Gaming: migliora resa visiva. |
| HDR | 2 | 8 | 10 | Gaming/Grafica: aggiunge profondità, ma solo da HDR600+. Coding: inutile. HDR400 = quasi marketing. |
| Porte / Connettività | 15 | 3 | 5 | Coding: USB-C PD è game-changer per laptop, multi-input per setup complessi. Gaming/Grafica: basta un DP. |
| Stand regolabile | 5 | 2 | 5 | Coding: ore davanti allo schermo, regolazione altezza quasi obbligatoria. Gaming: sessioni diverse, postura diversa. |
| VESA | 5 | 0 | 0 | Coding: abilita bracci per multi-monitor. Gaming/Grafica: nice-to-have ma non determinante. |
| Classe energetica | 3 | 2 | 2 | Secondario ma rilevante per monitor accesi 8–12h/giorno. Impatta costo operativo. |
| **Totale** | **100** | **100** | **100** | |

---

## Logica di scoring per ogni fattore

### Risoluzione
Parsing della stringa "LARGHEZZAxALTEZZA", calcolo pixel totali.

| Pixel totali | Score |
|---|---|
| ≥ 8.294.400 (3840×2160 / 4K) | 100 |
| ≥ 5.120.000 (3440×1440 UW) | 85 |
| ≥ 3.686.400 (2560×1440 / QHD) | 70 |
| ≥ 2.073.600 (1920×1080 / FHD) | 40 |
| < 2.073.600 | 15 |

Interpolazione lineare tra i gradini.

### Dimensione (pollici)
Lo score dipende dalla risoluzione per catturare la densità pixel (PPI).

Calcolo PPI: `sqrt(w² + h²) / pollici` dove w e h derivano dalla risoluzione.

| PPI | Score |
|---|---|
| ≥ 160 | 100 |
| 140–159 | 90 |
| 110–139 | 80 (sweet spot: 27" 4K ≈ 163 PPI, 32" 4K ≈ 137 PPI) |
| 90–109 | 60 |
| < 90 | 30 |

Se la risoluzione non è disponibile, score basato solo sui pollici: 27"=80, 32"=75, 24"=70, altro=50.

### Tipo pannello

| Pannello | Coding | Gaming | Grafica |
|---|---|---|---|
| QD-OLED | 80 | 100 | 100 |
| OLED | 75 | 100 | 95 |
| Mini-LED | 85 | 80 | 85 |
| IPS | 90 | 60 | 80 |
| VA | 60 | 70 | 65 |
| TN | 30 | 50 | 20 |
| Non specificato | 50 | 50 | 50 |

Nota: IPS alto per coding perché nessun rischio burn-in con UI statiche. OLED penalizzato leggermente per coding per lo stesso motivo.

### Refresh rate (Hz)

| Hz | Coding | Gaming | Grafica |
|---|---|---|---|
| ≥ 240 | 100 | 100 | 100 |
| 165–239 | 90 | 85 | 90 |
| 144–164 | 80 | 70 | 80 |
| 120–143 | 70 | 50 | 70 |
| 75–119 | 50 | 30 | 50 |
| 60–74 | 40 | 15 | 40 |
| < 60 | 20 | 5 | 20 |

Per Coding il beneficio oltre 120Hz è marginale ma percepibile nello scrolling.
Per Gaming sotto 144Hz è un compromesso significativo.

### Tempo di risposta (ms)
Valore più basso = migliore. Se non specificato, score = 50.

| ms (GtG) | Score |
|---|---|
| ≤ 1 | 100 |
| ≤ 2 | 85 |
| ≤ 4 | 70 |
| ≤ 5 | 55 |
| ≤ 8 | 35 |
| > 8 | 15 |

### Gamut colore
Parsing del testo per estrarre percentuali. Priorità: DCI-P3 > AdobeRGB > sRGB.

| Condizione | Score |
|---|---|
| DCI-P3 ≥ 98% | 100 |
| DCI-P3 ≥ 95% | 90 |
| DCI-P3 ≥ 90% | 80 |
| AdobeRGB ≥ 99% (senza DCI-P3 dichiarato) | 85 |
| sRGB ≥ 100% (senza DCI-P3/AdobeRGB) | 70 |
| sRGB ≥ 99% | 65 |
| sRGB < 99% o non specificato | 40 |

Tentare parsing con regex tipo: `/(\d+)%?\s*(sRGB|DCI-P3|AdobeRGB|Adobe\s*RGB)/gi`

### HDR

| Livello | Score |
|---|---|
| HDR1400 | 100 |
| HDR1000 | 90 |
| Dolby Vision | 85 |
| HDR600 | 70 |
| HDR400 | 30 |
| HDR10 (base) | 20 |
| No | 0 |

HDR400 score basso di proposito: è essenzialmente marketing, non produce un vero effetto HDR percepibile.

### Porte / Connettività
Parsing del testo per contare e valutare le porte.

| Condizione | Punti (additivi, max 100) |
|---|---|
| USB-C con Power Delivery | +35 |
| USB-C senza PD (o non specificato PD) | +20 |
| DisplayPort (almeno 1) | +20 |
| HDMI ≥ 2 | +15 |
| HDMI = 1 | +8 |
| Hub USB (USB-A downstream) | +10 |
| KVM switch | +10 |
| Ethernet/RJ45 | +5 |
| Audio jack out | +5 |

Cap a 100. Se il campo è vuoto, score = 30 (assunzione: almeno 1 HDMI + 1 DP è standard).

Regex suggerita: cercare `usb-c`, `pd`, `power delivery`, `dp`, `displayport`, `hdmi`, `usb-a`, `kvm`, `rj45`, `ethernet`, `audio`, `jack`.

### Stand regolabile

| Tipo | Score |
|---|---|
| Sì (altezza + tilt + swivel + pivot) | 100 |
| Sì | 85 (assumiamo altezza + tilt come minimo) |
| Solo tilt | 30 |
| No | 0 |

### VESA

| Valore | Score |
|---|---|
| Sì | 100 |
| No | 0 |

### Classe energetica
Mapping lettera → score.

| Classe | Score |
|---|---|
| A | 100 |
| B | 85 |
| C | 70 |
| D | 55 |
| E | 40 |
| F | 25 |
| G | 10 |
| Non specificato | 50 |

Parsing: prendere la prima lettera A–G dal campo.

---

## Calcolo Performance Score

Per ogni categoria `c` ∈ {Coding, Gaming, Grafica}:

```
PerformanceScore(c) = Σ (score_fattore_i × peso_i(c)) / 100
```

Dove `score_fattore_i` è il punteggio 0–100 del singolo fattore e `peso_i(c)` è il peso di quel fattore per la categoria `c` (dalla tabella pesi).

**Gestione fattori mancanti**: se un fattore non ha valore (campo vuoto), il suo peso viene ridistribuito proporzionalmente sugli altri fattori. In pratica:

```
peso_effettivo_i(c) = peso_i(c) / somma_pesi_fattori_compilati(c) × 100
```

Questo evita di penalizzare monitor con specs parziali.

### Overall Performance

Se l'utente ha selezionato dei casi d'uso per il prodotto:

```
Overall = media pesata dei punteggi delle categorie selezionate
```

Pesi suggeriti per i casi d'uso → categorie:
- "Gaming" → Gaming 100%
- "Programmazione" → Coding 100%
- "Grafica/Video" → Grafica 100%
- "Produttività" → Coding 60%, Grafica 20%, Gaming 20%
- "Ufficio" → Coding 70%, Gaming 10%, Grafica 20%
- "Streaming" → Gaming 40%, Grafica 40%, Coding 20%

Se nessun caso d'uso selezionato:
```
Overall = (Coding + Gaming + Grafica) / 3
```

---

## Calcolo Qualità/Prezzo

```
QP(c) = PerformanceScore(c) × PriceMultiplier
```

Dove `PriceMultiplier` normalizza il prezzo rispetto a una fascia di riferimento per monitor:

```
PriceMultiplier = clamp(MedianPrice / Prezzo, 0.3, 2.0)
```

- `MedianPrice`: prezzo mediano dei monitor salvati nel database. Se c'è un solo prodotto o nessun riferimento, usare **400€** come default (fascia media monitor 27" QHD/4K).
- Il clamp evita che monitor a €50 ottengano score assurdi o che monitor a €2000 vengano azzerati.
- Il risultato finale viene scalato su 0–100: `QP_finale = clamp(QP(c), 0, 100)`

Questo approccio premia monitor che offrono performance elevata a un prezzo inferiore alla mediana, e penalizza quelli sovrapprezzati.

---

## Fasce di valutazione

| Score | Label | Colore |
|---|---|---|
| 80–100 | Eccellente | verde (#22c55e) |
| 60–79 | Buono | giallo (#eab308) |
| 40–59 | Discreto | arancione (#f97316) |
| 0–39 | Scarso | rosso (#ef4444) |
| N/D | Non disponibile | grigio |

---

## Output atteso nell'UI

### Card prodotto
Mostrare 4 barre compatte:
```
Coding:  ██████████░░ 78  |  Q/P: ██████████████░ 92
Gaming:  ████░░░░░░░░ 34  |  Q/P: █████░░░░░░░░░ 41
Grafica: ████████░░░░ 65  |  Q/P: ██████████░░░░ 79
Overall: ███████░░░░░ 59  |  Q/P: ████████░░░░░░ 71
```

### Tabella confronto
Aggiungere le righe dei punteggi per categoria nella tabella side-by-side, con highlight verde sulla cella migliore per ogni riga.

### Ordinamento
Permettere di ordinare per: Performance Coding, Performance Gaming, Performance Grafica, Performance Overall, Q/P Coding, Q/P Gaming, Q/P Grafica, Q/P Overall.

---

## Note implementative

- L'algoritmo vive in un modulo separato (es. `scoring.ts` o `scoring.js`) per testabilità.
- Funzione principale: `calcMonitorScores(product, allProducts)` → restituisce `{ coding, gaming, grafica, overall, codingQP, gamingQP, graficaQP, overallQP }`.
- `allProducts` serve per calcolare il `MedianPrice` dinamico.
- Se la categoria del prodotto non è "Monitor", restituire null (l'algoritmo è specifico per monitor, le altre categorie avranno i propri scorer in futuro).
- Tutte le funzioni di parsing (risoluzione, gamut, porte) devono essere robuste a formati inconsistenti e case-insensitive.
