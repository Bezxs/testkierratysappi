# Kolmen osan työnjako — 2026-10-12

## Vastuut

| Työalue | Tiedostot | Omistajarooli |
| --- | --- | --- |
| Sovellus | `mobile/app`, `mobile/localization` | Mobile-kehittäjä |
| Palvelin | `backend/api`, `backend/application`, `backend/data-providers`, `backend/database` | Backend-kehittäjä |
| Ydin | `shared/contracts`, `shared/domain`, `shared/recycling-engine` | Ydin/rajapintakehittäjä |

Roope määrittää henkilöt rooleihin. Keksittyjä GitHub-tunnuksia, tiimejä tai
CODEOWNERS-hyväksyntöjä ei ole lisätty. Tämä on yksi Git-repo ja yksi yhteinen
integraatio; ei kolme divergenttiä kopiota. Rootin lockfile, työkalut, CI ja
dokumentaatio sovitaan yhdessä. Projektinhallinnan muistiinpanot päivitetään
rootin AGENTS.md:n mukaan myös yhden osan työssä.

## Riippuvuudet

```text
mobile -- HTTP /v1 --> backend
   |                    |
   +------ shared ------+
```

Mobile/backend eivät tuo toistensa koodia. Shared ei riipu kummastakaan.
Pakettien väliset importit käyttävät nimettyjä julkisia exportteja; ei
`../../toinen-osa/src/...`, yksityisiä ali-polkuja tai laskettuja importteja.
Työkalun AST-tarkistus ja riippuvuusgraafi ovat pakollinen `pnpm validate` -portti.
Jokainen osa saa muuttaa sisäistä toteutustaan oman julkisen sopimuksensa sisällä.
Backendin HTTP-vastauksen sopimus ja offline-lajittelu ovat tarkoituksellisesti
yhteisiä, joten niiden muutos voi vaikuttaa mobileen. Nollavaikutuksia ei luvata.

## Kolmen henkilön käytännön työ

1. Valitse omalle työlle haara, esimerkiksi `codex/mobile-<aihe>`,
   `codex/backend-<aihe>` tai `codex/shared-<aihe>` yhteisestä sovitusta commitista.
   Omat paikalliset Git-worktreet ehkäisevät toisen keskeneräisten muutosten
   sekoittumista; kansiot yksin eivät eristä samassa checkoutissa työskentelyä.
2. Muokkaa omaa koodikansiota. Älä muuta yhteistä rajapintaa, riippuvuusversioita,
   lockfilea tai toisen osan toteutusta sivuvaikutuksena. Tarvittava yhteinen muutos
   sovitaan erillisenä integraatiotyönä. Säilytä julkiset lähde/licence-metatiedot.
3. Aja `pnpm validate:mobile`, `pnpm validate:backend` tai `pnpm validate:shared`.
   Kukin kattaa oman koodin ja ilmoitetut riippuvuudet; mobile-tarkistus ei rakenna
   backendia ja backend-tarkistus ei rakenna Expo-sovellusta.
4. Ennen yhdistämistä aja aina `pnpm validate`. CI näyttää lisäksi kolme erillistä
   osatulosta ja yhteisen integraatiotuloksen. Uusi yhteensopimattomuus ei ole
   toisen kehittäjän vastuulle siirrettävä vihreä muutos.
5. Reviewaa diff ja jaa vain erikseen sovittuun repoon/haaraan. Tämä rakenteen
   muuttaminen ei valtuuta GitHub-pushia. GitHubin päähaaran suojaus/vaaditut
   tarkistukset eivät tule voimaan pelkällä workflow-tiedostolla; Roope määrittää
   ne erikseen, jos haluaa. Älä väitä hyväksyntöjä tai etä-CI:tä tehdyiksi.

## Sopimuksen muuttaminen

Nykyisen asiakkaan wire-reitti/metodi pysyy `POST /v1/recycling/lookup`.
Input/response-skeemat ovat `shared/contracts`; API ja mobile käyttävät samoja
exportteja. Frozen v1-testit ja molempien kuluttajien regressiot suojaavat
tunnetut oletukset. Rikkova muutos tarvitsee uuden rinnakkaisen version,
migraatio/käyttöönottosuunnitelman ja molempien kuluttajien hyväksynnän. Säännön
muutos voi tarkoituksella muuttaa vastausta: päivitä provenienssi/versionumerot
ja tarkista sekä online- että offline-polku. Testit eivät ole täydellinen
matemaattinen takuu kaikista mahdollisista muutoksista.

## Vanhat polut

| Aiempi | Nyt |
| --- | --- |
| `apps/mobile` | `mobile/app` |
| `apps/api` | `backend/api` |
| `packages/localization` | `mobile/localization` |
| `packages/application` | `backend/application` (lookup/piste-sopimukset erotettu `shared/contracts`-pakettiin) |
| `packages/data-providers` | `backend/data-providers` |
| `database` | `backend/database` |
| `packages/domain` | `shared/domain` |
| `packages/recycling-engine` | `shared/recycling-engine` |

Vanhojen päivättyjen testilokien/polkujen evidenssi jää historialliseksi. Nykyiset
komennot, CI, testit, importer ja päärakenne käyttävät uusia polkuja. Tällä Macilla
on vain ignored `apps/mobile`-yhteensopivuuslinkki aiemmin generoidun Xcode/Pods-
rakennuksen absoluuttisille poluille. Linkki ei ole Gitissä/GitHubissa eikä
päällekkäistä lähdekoodia; puhdas checkout ei tarvitse sitä. Uusi native prebuild
tehdään `mobile/app`-kansiosta ennen myöhempää puhdasta natiivirakennusta.
