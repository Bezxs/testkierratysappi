# 2. Backend — palvelin ja tietokanta

`api/` tarjoaa HTTP-rajapinnan. `application/` yhdistää normalisoidut tuotehavainnot,
välimuistin ja lajittelumoottorin. `data-providers/` käsittelee epäluotettavat
Open Facts -vastaukset. `database/` sisältää migraatiot, siemenet ja niiden testit.
Tietokantaskeema ei ole vielä tuotannossa eikä nykyisen API:n runtime-tallennus;
nykyinen välimuisti pysyy rajattuna prosessimuistina.

Root-kansiosta:

```sh
pnpm dev:backend
pnpm validate:backend
```

Oma tarkistus kattaa backendin paketit, tietokantamigraatiot ja niiden shared-
riippuvuudet, ei mobilea tai Expo-vientiä. Tuotehaku ja virheet noudattavat
`shared/contracts`-sopimusta. Säilytä v1-reitti, HTTP-tilat, GTIN-sidonta,
lähde/provenienssi, epävarmuus, määräajat, rajat ja turvalliset virhetilat.

Backend saa käyttää oman osansa paketteja ja sharedin julkisia exportteja.
Mobilea/käännöksiä/natiivi-UI-koodia ei saa tuoda palvelimeen. Tunnukset pysyvät
palvelimella eikä niitä tulosteta, lueta diagnostiikkaan tai commitoida.

Adapterin/välimuistin sisäinen muutos voidaan tehdä täällä ilman mobile-tiedostojen
muokkaamista, jos HTTP-sopimus säilyy. Rikkova rajapintamuutos sovitaan sharedin
ja mobilen kanssa. Koko integraatio: `pnpm validate`.
